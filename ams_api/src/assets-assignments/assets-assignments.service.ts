import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetAssignment } from './entities/assets-assignment.entity';
import { Asset } from '../assets/entities/asset.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAssetAssignmentDto } from './dto/create-assets-assignment.dto';
import { UpdateAssetAssignmentDto } from './dto/update-assets-assignment.dto';
import { PrepareAssignmentDto } from './dto/prepare-assignment.dto';

@Injectable()
export class AssetAssignmentsService {
  constructor(
    @InjectRepository(AssetAssignment)
    private readonly assignmentRepo: Repository<AssetAssignment>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createDto: CreateAssetAssignmentDto) {
    const asset = await this.assetRepo.findOne({
      where: { id: createDto.asset_id },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    const user = await this.userRepo.findOne({
      where: { id: createDto.user_id },
    });
    if (!user) throw new NotFoundException('User not found');

    const assignment = this.assignmentRepo.create({
      asset,
      user,
      assigned_at: createDto.assigned_at
        ? new Date(createDto.assigned_at)
        : new Date(),
      condition_on_assign: createDto.condition_on_assign ?? '',
      form_status: 'DRAFT',
    });

    return await this.assignmentRepo.save(assignment);
  }

  async findAll() {
    return this.assignmentRepo.find({ relations: ['asset', 'user'] });
  }

  async findOne(id: string) {
    const assignment = await this.assignmentRepo.findOne({
      where: { id },
      relations: ['asset', 'user'],
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async update(id: string, updateDto: UpdateAssetAssignmentDto) {
    const assignment = await this.findOne(id);
    if (updateDto.returned_at) {
      assignment.returned_at = new Date(updateDto.returned_at);
      if (assignment.asset) {
        assignment.asset.status = 'IN_STOCK';
        assignment.asset.assigned_to = null;
        await this.assetRepo.save(assignment.asset);
      }
    }

    if (updateDto.condition_on_assign !== undefined) {
      assignment.condition_on_assign = updateDto.condition_on_assign;
    }

    return await this.assignmentRepo.save(assignment);
  }

  async prepareByAdmin(id: string, prepareDto: PrepareAssignmentDto) {
    const assignment = await this.findOne(id);
    if (!assignment) throw new NotFoundException('Assignment not found');

    assignment.condition_on_assign = prepareDto.condition_on_assign ?? '';
    assignment.received_from_name = prepareDto.received_from_name ?? '';

    if (prepareDto.asset_serial_number && assignment.asset) {
      assignment.asset.serial_number = prepareDto.asset_serial_number;
    }
    if (prepareDto.asset_tag_id && assignment.asset) {
      assignment.asset.tag_id = prepareDto.asset_tag_id;
    }

    if (prepareDto.user_phone_number && assignment.user) {
      assignment.user.phone_number = prepareDto.user_phone_number;
      await this.userRepo.save(assignment.user);
    }

    if (assignment.asset) {
      await this.assetRepo.save(assignment.asset);
    }

    if (prepareDto.sendToUser) {
      assignment.form_status = 'PENDING_USER_SIGNATURE';
      await this.assignmentRepo.save(assignment);

      if (assignment.user && assignment.asset) {
        await this.notificationsService.notifyAssignmentAction({
          action: 'SENT_TO_USER',
          assignmentId: assignment.id,
          assetName: assignment.asset.name,
          userId: assignment.user.id,
        });
      }
    } else {
      await this.assignmentRepo.save(assignment);
    }

    return assignment;
  }

  async signByUser(id: string, signatureName: string) {
    try {
      const assignment = await this.findOne(id);

      if (
        assignment.form_status !== 'PENDING_USER_SIGNATURE' &&
        assignment.form_status !== 'REJECTED'
      ) {
        throw new BadRequestException('Form is not awaiting your signature.');
      }

      const expectedSignatureStart = 'I agree and ';
      if (
        !signatureName.startsWith(expectedSignatureStart) ||
        signatureName.length <= expectedSignatureStart.length
      ) {
        throw new BadRequestException(
          'Signature must be in the format: "I agree and Full Names"',
        );
      }

      assignment.user_signature_name = signatureName;
      assignment.user_signed_at = new Date();
      assignment.form_status = 'PENDING_ADMIN_REVIEW';

      const saved = await this.assignmentRepo.save(assignment);

      if (saved.user && saved.asset) {
        await this.notificationsService
          .notifyAssignmentAction({
            action: 'SIGNED_BY_USER',
            assignmentId: saved.id,
            assetName: saved.asset.name,
            userId: saved.user.id,
          })
          .catch((err) =>
            console.error('Notification failed but signing succeeded:', err),
          );
      }

      return saved;
    } catch (error) {
      console.error('--- SIGN_BY_USER FAILED ---');
      console.error(error);
      throw error;
    }
  }

  async verifyByAdmin(
    id: string,
    approve: boolean,
    remarks?: string,
    adminSignatureName?: string,
  ) {
    const assignment = await this.findOne(id);

    if (approve) {
      if (!adminSignatureName) {
        throw new BadRequestException(
          'Admin signature is required for approval.',
        );
      }
      assignment.form_status = 'APPROVED';
      assignment.admin_signature_name = adminSignatureName;
      assignment.admin_signed_at = new Date();

      if (assignment.asset) {
        assignment.asset.status = 'ASSIGNED';
        assignment.asset.assigned_to = assignment.user;
        await this.assetRepo.save(assignment.asset);
      }

      await this.assignmentRepo.save(assignment);

      if (assignment.user && assignment.asset) {
        await this.notificationsService.notifyAssignmentAction({
          action: 'APPROVED',
          assignmentId: assignment.id,
          assetName: assignment.asset.name,
          userId: assignment.user.id,
        });
      }
    } else {
      assignment.form_status = 'REJECTED';
      assignment.rejection_reason = remarks ?? '';
      assignment.user_signature_name = null;
      assignment.user_signed_at = null;

      await this.assignmentRepo.save(assignment);

      if (assignment.user && assignment.asset) {
        await this.notificationsService.notifyAssignmentAction({
          action: 'REJECTED',
          assignmentId: assignment.id,
          assetName: assignment.asset.name,
          userId: assignment.user.id,
          rejectionReason: remarks,
        });
      }
    }

    return assignment;
  }
}
