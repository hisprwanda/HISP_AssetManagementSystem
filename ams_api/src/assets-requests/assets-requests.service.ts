import { Injectable, NotFoundException } from '@nestjs/common';
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
    private readonly notificationsService: NotificationsService,
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

    return await this.requestRepo.save(requests);
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
          transport_fees: dto.transport_fees / requests.length, // Distribute fees evenly
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
    request.status = 'ORDERED'; // Ensure it's marked as ordered if a PO is uploaded
    return await this.requestRepo.save(request);
  }
}
