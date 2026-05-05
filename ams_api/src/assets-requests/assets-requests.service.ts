import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetRequest } from './entities/assets-request.entity';
import { PurchaseOrderData } from './entities/assets-request.entity';
import { User } from 'src/users/entities/user.entity';
import { Department } from 'src/departments/entities/department.entity';
import { CreateAssetRequestDto } from './dto/create-assets-request.dto';
import { CreateBulkRequestDto } from './dto/create-bulk-request.dto';
import { ReviewBulkRequestDto } from './dto/review-bulk-request.dto';
import { FormalizeBulkRequestDto } from './dto/formalize-bulk-request.dto';
import { UpdateAssetRequestDto } from './dto/update-assets-request.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { RequestableItem } from '../requestable-items/entities/requestable-item.entity';
import { AssetAssignmentsService } from '../assets-assignments/assets-assignments.service';
import { DeployAssetRequestDto } from './dto/deploy-asset-request.dto';
import { Asset } from '../assets/entities/asset.entity';
import { Category } from '../categories/entities/category.entity';
import { In } from 'typeorm';

@Injectable()
export class AssetRequestsService {
  constructor(
    @InjectRepository(AssetRequest)
    private readonly requestRepo: Repository<AssetRequest>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RequestableItem)
    private readonly itemRepo: Repository<RequestableItem>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    private readonly notificationsService: NotificationsService,
    private readonly assignmentsService: AssetAssignmentsService,
  ) {}

  async create(
    dto: CreateAssetRequestDto,
    currentUserId?: string,
  ): Promise<AssetRequest> {
    const userId = currentUserId || dto.requested_by_id;

    const request = this.requestRepo.create({
      title: dto.title,
      urgency: dto.urgency,
      items: dto.items,
      financials: dto.financials,
      logistics: dto.logistics,
      is_shared: dto.is_shared || false,
      department: { id: dto.department_id } as unknown as Department,
      requested_by: { id: userId } as unknown as User,
      status: dto.status || 'PENDING',
    });

    const saved = await this.requestRepo.save(request);
    const requester = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['department'],
    });

    if (requester) {
      const roleUpper = requester.role.toUpperCase();
      const isAdmin =
        roleUpper === 'ADMIN AND FINANCE DIRECTOR' ||
        roleUpper === 'FINANCE OFFICER';

      if (!isAdmin) {
        this.notificationsService
          .notifyHODNewRequest({
            requestId: saved.id,
            requestTitle: saved.title,
            requesterName: requester.full_name,
            departmentId: requester.department?.id,
          })
          .catch((err) =>
            console.error(
              '[NotificationsService] Failed to send HOD request notification:',
              err,
            ),
          );
      }

      if (
        roleUpper === 'FINANCE OFFICER' ||
        roleUpper === 'ADMIN AND FINANCE DIRECTOR' ||
        roleUpper === 'OPERATIONS OFFICER'
      ) {
        this.notificationsService
          .notifyPersonalRequest({
            requestId: saved.id,
            requestTitle: saved.title,
            requesterId: requester.id,
            requesterName: requester.full_name,
            requesterRole: requester.role,
          })
          .catch((err) =>
            console.error(
              '[NotificationsService] Failed to send personal request notification:',
              err,
            ),
          );
      }
    }

    if (dto.logistics?.contact_phone) {
      await this.userRepo.update(userId, {
        phone_number: dto.logistics.contact_phone,
      });
    }

    return saved;
  }

  async findAll(): Promise<AssetRequest[]> {
    return await this.requestRepo.find({
      relations: ['requested_by', 'department', 'verified_by_finance'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AssetRequest> {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ['requested_by', 'department', 'verified_by_finance'],
    });

    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }

    return request;
  }

  async update(id: string, dto: UpdateAssetRequestDto): Promise<AssetRequest> {
    const request = await this.findOne(id);

    if (dto.title) request.title = dto.title;
    if (dto.description) request.description = dto.description;
    if (dto.urgency) request.urgency = dto.urgency;
    if (dto.status) request.status = dto.status;
    if (dto.is_shared !== undefined) request.is_shared = dto.is_shared;

    if (dto.items) request.items = dto.items;
    if (dto.financials) request.financials = dto.financials;
    if (dto.logistics) request.logistics = dto.logistics;

    if (dto.requested_by_id) {
      request.requested_by = { id: dto.requested_by_id } as unknown as User;
    }
    if (dto.department_id) {
      request.department = { id: dto.department_id } as unknown as Department;
    }

    if (dto.ceo_remarks) request.ceo_remarks = dto.ceo_remarks;
    if (dto.verified_by_finance_id) {
      request.verified_by_finance = {
        id: dto.verified_by_finance_id,
      } as unknown as User;
    }

    if (dto.purchase_order) {
      request.purchase_order = dto.purchase_order;
    }

    const saved = await this.requestRepo.save(request);

    if (dto.logistics?.contact_phone && request.requested_by?.id) {
      await this.userRepo.update(request.requested_by.id, {
        phone_number: dto.logistics.contact_phone,
      });
    }

    if (dto.status === 'CEO_APPROVED' || dto.status === 'REJECTED') {
      const departmentId =
        request.department?.id ||
        (
          await this.requestRepo.findOne({
            where: { id },
            relations: ['department'],
          })
        )?.department?.id;

      const requestedById =
        request.requested_by?.id ||
        (
          await this.requestRepo.findOne({
            where: { id },
            relations: ['requested_by'],
          })
        )?.requested_by?.id;

      if (departmentId && requestedById) {
        this.notificationsService
          .notifyCEODecision({
            status: dto.status,
            requestId: id,
            requestTitle: request.title,
            requestedById,
            departmentId,
            ceoRemarks: dto.ceo_remarks,
          })
          .catch((err) =>
            console.error(
              '[NotificationsService] Failed to send CEO decision notifications:',
              err,
            ),
          );
      }
    }

    if (dto.status === 'FULFILLED') {
      const departmentId =
        request.department?.id ||
        (
          await this.requestRepo.findOne({
            where: { id },
            relations: ['department'],
          })
        )?.department?.id;

      const requestedById =
        request.requested_by?.id ||
        (
          await this.requestRepo.findOne({
            where: { id },
            relations: ['requested_by'],
          })
        )?.requested_by?.id;

      if (departmentId && requestedById) {
        this.notificationsService
          .notifyFulfilment({
            requestId: id,
            requestTitle: request.title,
            requestedById,
            departmentId,
          })
          .catch((err) =>
            console.error(
              '[NotificationsService] Failed to send fulfilment notifications:',
              err,
            ),
          );
      }
    }

    return saved;
  }

  async createBulkRequest(dto: CreateBulkRequestDto): Promise<AssetRequest[]> {
    const batchNumber = 'REQ-BATCH-' + Date.now();
    const user = await this.userRepo.findOne({
      where: { id: dto.user_id },
      relations: ['department'],
    });

    if (!user) throw new NotFoundException('User not found');

    const requestableItems = await this.itemRepo.findBy({
      id: In(dto.requestable_item_ids),
    });

    const requests: AssetRequest[] = [];

    for (const item of requestableItems) {
      const request = this.requestRepo.create({
        title: `Request for ${item.name}`,
        description: dto.justification,
        batch_number: batchNumber,
        status: 'PENDING',
        urgency: 'MEDIUM',
        requested_by: user,
        department: user.department,
        items: [{ name: item.name, quantity: 1 }],
        financials: { estimated_cost: 0 },
        logistics: { justification: dto.justification },
      });
      requests.push(request);
    }

    const saved = await this.requestRepo.save(requests);

    if (user) {
      this.notificationsService
        .notifyHODNewRequest({
          requestId: saved[0]?.id,
          requestTitle: `Batch Request: ${saved.length} items`,
          requesterName: user.full_name,
          departmentId: user.department?.id,
        })
        .catch((err) =>
          console.error(
            '[NotificationsService] Failed to send HOD batch request notification:',
            err,
          ),
        );

      const roleUpper = user.role.toUpperCase();
      if (
        roleUpper === 'FINANCE OFFICER' ||
        roleUpper === 'ADMIN AND FINANCE DIRECTOR' ||
        roleUpper === 'OPERATIONS OFFICER'
      ) {
        this.notificationsService
          .notifyPersonalRequest({
            requestId: saved[0]?.id,
            requestTitle: `Batch Request: ${saved.length} items`,
            requesterId: user.id,
            requesterName: user.full_name,
            requesterRole: user.role,
          })
          .catch((err) =>
            console.error(
              '[NotificationsService] Failed to send personal batch request notification:',
              err,
            ),
          );
      }
    }

    return saved;
  }

  async reviewBulkByHOD(
    batchNumber: string,
    dto: ReviewBulkRequestDto,
  ): Promise<AssetRequest[]> {
    const requests = await this.requestRepo.find({
      where: { batch_number: batchNumber, status: 'PENDING' },
    });

    if (requests.length === 0) {
      throw new NotFoundException(
        `No pending requests found for batch ${batchNumber}`,
      );
    }

    const updatedRequests = requests.map((req) => {
      if (!dto.approve) {
        req.status = 'REJECTED';
      } else {
        const isVetoed = dto.rejected_item_ids?.includes(req.id);
        req.status = isVetoed ? 'REJECTED' : 'PENDING_FORMALIZATION';
      }
      if (dto.remarks) {
        req.description = `${req.description || ''}\n\nHOD Remarks: ${dto.remarks}`;
      }
      return req;
    });

    return await this.requestRepo.save(updatedRequests);
  }

  async formalizeBulkRequest(
    batchNumber: string,
    dto: FormalizeBulkRequestDto,
  ): Promise<AssetRequest[]> {
    const requests = await this.requestRepo.find({
      where: { batch_number: batchNumber, status: 'PENDING_FORMALIZATION' },
    });

    if (requests.length === 0) {
      throw new NotFoundException(
        `No pending formalization found for batch ${batchNumber}`,
      );
    }

    const updatedRequests = requests.map((req) => {
      const itemUpdate = dto.items.find((i) => i.id === req.id);
      if (itemUpdate) {
        req.items = [
          {
            name: itemUpdate.name,
            quantity: itemUpdate.quantity,
            unit_price: itemUpdate.unit_price,
            description: '',
          },
        ];
        req.financials = {
          subtotal: itemUpdate.quantity * itemUpdate.unit_price,
          transport_fees: dto.transport_fees / requests.length,
          grand_total:
            itemUpdate.quantity * itemUpdate.unit_price +
            dto.transport_fees / requests.length,
          cost_basis: 'MARKET_RESEARCH',
        };
      }
      req.status = 'HOD_APPROVED';
      req.urgency = dto.urgency;
      if (dto.description) req.description = dto.description;
      return req;
    });

    return await this.requestRepo.save(updatedRequests);
  }

  async uploadPoScanned(id: string, fileUrl: string): Promise<AssetRequest> {
    const request = await this.findOne(id);
    if (!request.purchase_order) {
      request.purchase_order = {} as PurchaseOrderData;
    }
    request.purchase_order.scanned_po_url = fileUrl;
    request.status = 'ORDERED';
    return await this.requestRepo.save(request);
  }
  async deploy(id: string, dto: DeployAssetRequestDto) {
    console.log(`[Deploy] Starting deployment for Request ID: ${id}`);
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ['requested_by', 'department'],
    });

    if (!request || !request.requested_by) {
      console.error('[Deploy] Request or requester not found');
      throw new BadRequestException('Request does not have a valid requester.');
    }

    const finalAssetIds: string[] = [];
    if (dto.asset_ids && dto.asset_ids.length > 0) {
      console.log(`[Deploy] Updating ${dto.asset_ids.length} existing assets`);
      for (const assetId of dto.asset_ids) {
        const asset = await this.assetRepo.findOne({ where: { id: assetId } });
        if (asset) {
          asset.department = request.department;
          asset.department_id = request.department?.id;
          asset.location = request.department?.name || 'Kigali Headquarters';
          asset.assigned_to = request.requested_by;
          asset.assigned_to_user_id = request.requested_by.id;
          asset.status = 'IN_STOCK';
          await this.assetRepo.save(asset);
          finalAssetIds.push(asset.id);
        }
      }
    }
    if (dto.new_assets && dto.new_assets.length > 0) {
      console.log(
        `[Deploy] Found ${dto.new_assets.length} new assets to create`,
      );
      const requester = await this.userRepo.findOne({
        where: { id: request.requested_by.id },
        relations: ['department'],
      });
      const department = await this.departmentRepo.findOne({
        where: { id: request.department.id },
      });
      for (const newAsset of dto.new_assets) {
        const matchingItem = ((request.items as unknown as any[]) || []).find(
          (i: { name: string }) =>
            String(i.name || '')
              .trim()
              .toLowerCase() ===
            String(newAsset.name || '')
              .trim()
              .toLowerCase(),
        ) as {
          unit_price?: number;
          financials?: { unit_cost?: number };
          estimated_unit_cost?: number;
          cost?: number;
          price?: number;
          amount?: number;
        };

        const cost: number =
          Number(matchingItem?.unit_price) ||
          Number(matchingItem?.financials?.unit_cost) ||
          Number(matchingItem?.estimated_unit_cost) ||
          Number(matchingItem?.cost) ||
          Number(matchingItem?.price) ||
          Number(matchingItem?.amount) ||
          0;

        const purchaseDate = dto.purchase_date
          ? new Date(dto.purchase_date)
          : request.purchase_order?.order_date
            ? new Date(request.purchase_order.order_date)
            : new Date();
        const locationName =
          department?.name || request.department?.name || 'Kigali Headquarters';
        const fullCategory = await this.categoryRepo.findOne({
          where: { id: newAsset.category_id },
        });

        console.log(
          `[Deploy] Creating new asset: ${newAsset.name} | Cost: ${cost} | Loc: ${locationName} | User: ${requester?.full_name} | Category: ${fullCategory?.name}`,
        );

        const asset = this.assetRepo.create({
          name: newAsset.name,
          serial_number: newAsset.serial_number || null,
          tag_id: newAsset.tag_id,
          status: 'IN_STOCK',
          category: fullCategory,
          category_id: fullCategory?.id,
          department: department,
          department_id: department?.id,
          location: locationName,
          purchase_cost: cost,
          purchase_date: purchaseDate,
          current_value: cost,
          assigned_to: requester,
          assigned_to_user_id: requester?.id,
        });

        const savedAsset = await this.assetRepo.save(asset);
        console.log(
          `[Deploy] Created Asset ID: ${savedAsset.id} (Cost: ${savedAsset.purchase_cost})`,
        );
        finalAssetIds.push(savedAsset.id);
      }
    }

    if (finalAssetIds.length === 0) {
      throw new BadRequestException('No assets provided for deployment.');
    }
    console.log(
      `[Deploy] Initiating bulk assignment for ${finalAssetIds.length} assets`,
    );
    const assignments = await this.assignmentsService.prepareBulkByAdmin({
      asset_ids: finalAssetIds,
      user_id: request.requested_by.id,
      condition_notes:
        dto.condition_notes || `Deployed for request: ${request.title}`,
      received_from_name: dto.received_from_name || 'HISP Admin',
    });
    request.status = 'DEPLOYED';
    await this.requestRepo.save(request);
    console.log('[Deploy] Handover workflow initialized successfully.');

    return {
      message: 'Deployment initiated successfully',
      assignments_count: assignments.length,
      form_number: assignments[0]?.form_number,
    };
  }
}
