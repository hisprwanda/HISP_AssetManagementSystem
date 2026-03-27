import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetRequest } from './entities/assets-request.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateAssetRequestDto } from './dto/create-assets-request.dto';
import { UpdateAssetRequestDto } from './dto/update-assets-request.dto';

@Injectable()
export class AssetRequestsService {
  constructor(
    @InjectRepository(AssetRequest)
    private readonly requestRepo: Repository<AssetRequest>,
  ) {}

  async create(dto: CreateAssetRequestDto): Promise<AssetRequest> {
    const request = this.requestRepo.create({
      ...dto,
      requester: { id: dto.requester_id } as User,
      status: 'PENDING',
    });
    return await this.requestRepo.save(request);
  }

  async findAll(): Promise<AssetRequest[]> {
    return await this.requestRepo.find({
      relations: ['requester', 'requester.department', 'verified_by_finance'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AssetRequest> {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ['requester', 'requester.department', 'verified_by_finance'],
    });
    if (!request)
      throw new NotFoundException(`Request with ID ${id} not found`);
    return request;
  }

  async update(id: string, dto: UpdateAssetRequestDto): Promise<AssetRequest> {
    const request = await this.findOne(id);

    if (dto.status) request.status = dto.status;
    if (dto.ceo_remarks) request.ceo_remarks = dto.ceo_remarks;
    if (dto.verified_by_finance_id) {
      request.verified_by_finance = { id: dto.verified_by_finance_id } as User;
    }

    return await this.requestRepo.save(request);
  }
}
