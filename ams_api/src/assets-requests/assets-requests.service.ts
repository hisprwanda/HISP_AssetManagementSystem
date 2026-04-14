import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetRequest } from './entities/assets-request.entity';
import { User } from 'src/users/entities/user.entity';
import { Department } from 'src/departments/entities/department.entity';
import { CreateAssetRequestDto } from './dto/create-assets-request.dto';
import { UpdateAssetRequestDto } from './dto/update-assets-request.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AssetRequestsService {
  constructor(
    @InjectRepository(AssetRequest)
    private readonly requestRepo: Repository<AssetRequest>,
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

    return await this.requestRepo.save(request);
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

    // Trigger notifications when CEO makes a final decision
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

    // Trigger notifications when request is marked as FULFILLED
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
}
