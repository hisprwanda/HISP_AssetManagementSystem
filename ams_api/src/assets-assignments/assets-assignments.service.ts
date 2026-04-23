import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AssetAssignment } from './entities/assets-assignment.entity';
import { Asset } from '../assets/entities/asset.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateAssetAssignmentDto } from './dto/create-assets-assignment.dto';
import { UpdateAssetAssignmentDto } from './dto/update-assets-assignment.dto';
import { PrepareAssignmentDto } from './dto/prepare-assignment.dto';
import { PrepareBulkAssignmentDto } from './dto/prepare-bulk-assignment.dto';

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

      if (!signatureName || signatureName.trim().length === 0) {
        throw new BadRequestException('Signature full name is required.');
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

  async uploadScannedForm(id: string, fileUrl: string) {
    let assignment: AssetAssignment;

    if (id.startsWith('legacy-')) {
      const assetId = id.replace('legacy-', '');
      const asset = await this.assetRepo.findOne({
        where: { id: assetId },
        relations: ['assigned_to'],
      });

      if (!asset) throw new NotFoundException('Asset not found');
      if (!asset.assigned_to) {
        throw new BadRequestException(
          'Cannot upload form for unassigned asset.',
        );
      }

      const count = await this.assignmentRepo.count();
      const formNumber = `ARF/${new Date().getFullYear()}/${(count + 1)
        .toString()
        .padStart(3, '0')}`;

      assignment = this.assignmentRepo.create({
        asset: asset,
        user: asset.assigned_to,
        assigned_at: new Date(),
        condition_on_assign: 'Legacy Scanned Form',
        form_number: formNumber,
        form_status: 'APPROVED',
        scanned_form_url: fileUrl,
        admin_signature_name: 'HISP Administration',
        admin_signed_at: new Date(),
        user_signature_name: 'Paper Signed',
        user_signed_at: new Date(),
      });
    } else {
      assignment = await this.findOne(id);
      assignment.scanned_form_url = fileUrl;
      assignment.form_status = 'APPROVED';
    }

    return await this.assignmentRepo.save(assignment);
  }

  async prepareBulkByAdmin(
    dto: PrepareBulkAssignmentDto,
  ): Promise<AssetAssignment[]> {
    const user = await this.userRepo.findOne({ where: { id: dto.user_id } });
    if (!user) throw new NotFoundException('User not found');

    const assets = await this.assetRepo.findBy({ id: In(dto.asset_ids) });
    if (assets.length !== dto.asset_ids.length) {
      throw new BadRequestException('Some assets were not found');
    }

    const unavailable = assets.filter((a) => a.status !== 'IN_STOCK');
    if (unavailable.length > 0) {
      throw new BadRequestException(
        `Some assets are not in stock: ${unavailable.map((a) => a.name).join(', ')}`,
      );
    }

    const formNumber = 'RCPT-' + Date.now();
    const assignments = assets.map((asset) => {
      return this.assignmentRepo.create({
        asset,
        user,
        form_number: formNumber,
        form_status: 'PENDING_USER_SIGNATURE',
        condition_on_assign: dto.condition_notes || 'Good Condition',
        received_from_name: dto.received_from_name,
        assigned_at: new Date(),
      });
    });

    const saved = await this.assignmentRepo.save(assignments);

    // Notify user once for the bulk assignment
    await this.notificationsService.notifyAssignmentAction({
      action: 'SENT_TO_USER',
      assignmentId: formNumber, // Use formNumber for bulk notifications
      assetName: `Batch of ${assets.length} items`,
      userId: user.id,
    });

    return saved;
  }

  async signBulkByUser(
    formNumber: string,
    signatureName: string,
  ): Promise<AssetAssignment[]> {
    const assignments = await this.assignmentRepo.find({
      where: { form_number: formNumber, form_status: 'PENDING_USER_SIGNATURE' },
      relations: ['user', 'asset'],
    });

    if (assignments.length === 0) {
      throw new NotFoundException(
        'No pending bulk assignments found for this form number',
      );
    }

    const updated = assignments.map((a) => {
      a.user_signature_name = signatureName;
      a.user_signed_at = new Date();
      a.form_status = 'PENDING_ADMIN_REVIEW';
      return a;
    });

    const saved = await this.assignmentRepo.save(updated);

    // Notify admin once
    if (saved[0].user) {
      await this.notificationsService.notifyAssignmentAction({
        action: 'SIGNED_BY_USER',
        assignmentId: formNumber,
        assetName: `Batch: ${formNumber}`,
        userId: saved[0].user.id,
      });
    }

    return saved;
  }

  async verifyBulkByAdmin(
    formNumber: string,
    approve: boolean,
    remarks?: string,
    adminSignatureName?: string,
  ): Promise<AssetAssignment[]> {
    const assignments = await this.assignmentRepo.find({
      where: { form_number: formNumber },
      relations: ['asset', 'user'],
    });

    if (assignments.length === 0) {
      throw new NotFoundException(
        'No bulk assignments found for this form number',
      );
    }

    if (approve && !adminSignatureName) {
      throw new BadRequestException(
        'Admin signature is required for approval.',
      );
    }

    for (const a of assignments) {
      if (approve) {
        a.form_status = 'APPROVED';
        a.admin_signature_name = adminSignatureName!;
        a.admin_signed_at = new Date();
        if (a.asset) {
          a.asset.status = 'ASSIGNED';
          a.asset.assigned_to = a.user;
          await this.assetRepo.save(a.asset);
        }
      } else {
        a.form_status = 'REJECTED';
        a.rejection_reason = remarks || 'Admin Rejected';
        a.user_signature_name = null;
        a.user_signed_at = null;
      }
    }

    const saved = await this.assignmentRepo.save(assignments);

    // Notify user once
    await this.notificationsService.notifyAssignmentAction({
      action: approve ? 'APPROVED' : 'REJECTED',
      assignmentId: formNumber,
      assetName: `Batch: ${formNumber}`,
      userId: saved[0].user.id,
      rejectionReason: remarks,
    });

    return saved;
  }
}
