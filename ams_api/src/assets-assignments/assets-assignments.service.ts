import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Asset } from '../assets/entities/asset.entity';
import { AssetAssignment } from './entities/assets-assignment.entity';
import { CreateAssetAssignmentDto } from './dto/create-assets-assignment.dto';
import { UpdateAssetAssignmentDto } from './dto/update-assets-assignment.dto';
import { User } from 'src/users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AssetAssignmentsService {
  constructor(
    @InjectRepository(AssetAssignment)
    private readonly assignmentRepo: Repository<AssetAssignment>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createDto: CreateAssetAssignmentDto): Promise<AssetAssignment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const asset = await queryRunner.manager.findOne(Asset, {
        where: { id: createDto.asset_id },
      });
      if (!asset) {
        throw new NotFoundException(
          `Asset with ID ${createDto.asset_id} not found`,
        );
      }
      const user = await queryRunner.manager.findOne(User, {
        where: { id: createDto.user_id },
      });
      if (!user) {
        throw new NotFoundException(
          `User with ID ${createDto.user_id} not found`,
        );
      }

      // We DON'T change asset status to ASSIGNED yet.
      // It stays IN_STOCK until the form is APPROVED.
      // But we do set the assigned_to for the staged period?
      // Actually, the user says "initial status has to remain IN STOCK".
      // We'll keep assigned_to as null or the new user but status IN_STOCK.
      // Let's keep assigned_to as the target user.
      asset.assigned_to = user;
      await queryRunner.manager.save(asset);

      const count = await queryRunner.manager.count(AssetAssignment);
      const formNumber = `ARF/${new Date().getFullYear()}/${(count + 1).toString().padStart(3, '0')}`;

      const assignment = queryRunner.manager.create(AssetAssignment, {
        asset,
        user,
        condition_on_assign: createDto.condition_on_assign,
        assigned_at: new Date(),
        form_status: 'DRAFT',
        form_number: formNumber,
        // Assume initiating admin is providing their name as received_from or similar
        received_from_name: 'Administration',
        received_at: new Date(),
      });

      const savedAssignment = await queryRunner.manager.save(assignment);

      await queryRunner.commitTransaction();
      return savedAssignment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        'Failed to create asset assignment: ' + message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async signByUser(
    id: string,
    signatureName: string,
  ): Promise<AssetAssignment> {
    const assignment = await this.findOne(id);
    assignment.user_signature_name = signatureName;
    assignment.user_signed_at = new Date();
    assignment.form_status = 'PENDING_ADMIN_REVIEW';
    const saved = await this.assignmentRepo.save(assignment);

    // Notify Admins that form was signed
    this.notificationsService
      .notifyAssignmentAction({
        action: 'SIGNED_BY_USER',
        assignmentId: saved.id,
        assetName: saved.asset?.name || 'Asset',
        userId: saved.user?.id,
      })
      .catch((err) =>
        console.error('Failed to send signed notification:', err),
      );

    return saved;
  }

  async prepareByAdmin(
    id: string,
    prepareDto: {
      condition_on_assign?: string;
      received_from_name?: string;
      asset_serial_number?: string;
      asset_tag_id?: string;
      sendToUser?: boolean;
    },
  ): Promise<AssetAssignment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const assignment = await queryRunner.manager.findOne(AssetAssignment, {
        where: { id },
        relations: ['asset'],
      });
      if (!assignment) throw new NotFoundException('Assignment not found');

      if (prepareDto.condition_on_assign)
        assignment.condition_on_assign = prepareDto.condition_on_assign;
      if (prepareDto.received_from_name)
        assignment.received_from_name = prepareDto.received_from_name;

      const asset = assignment.asset;
      if (prepareDto.asset_serial_number)
        asset.serial_number = prepareDto.asset_serial_number;
      if (prepareDto.asset_tag_id) asset.tag_id = prepareDto.asset_tag_id;
      await queryRunner.manager.save(asset);

      if (prepareDto.sendToUser) {
        assignment.form_status = 'PENDING_USER_SIGNATURE';

        // Notify User that form is ready
        this.notificationsService
          .notifyAssignmentAction({
            action: 'SENT_TO_USER',
            assignmentId: assignment.id,
            assetName: asset.name,
            userId: assignment.user?.id,
          })
          .catch((err) =>
            console.error('Failed to send sent_to_user notification:', err),
          );
      }

      const saved = await queryRunner.manager.save(assignment);
      await queryRunner.commitTransaction();
      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async verifyByAdmin(
    id: string,
    approve: boolean,
    remarks?: string,
  ): Promise<AssetAssignment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const assignment = await queryRunner.manager.findOne(AssetAssignment, {
        where: { id },
        relations: ['asset', 'user'],
      });
      if (!assignment) throw new NotFoundException('Assignment not found');

      if (approve) {
        assignment.form_status = 'APPROVED';
        assignment.admin_signature_name = 'Administrator'; // Simplification for now
        assignment.admin_signed_at = new Date();

        const asset = await queryRunner.manager.findOne(Asset, {
          where: { id: assignment.asset.id },
        });
        if (asset) {
          asset.status = 'ASSIGNED';
          await queryRunner.manager.save(asset);
        }
      } else {
        assignment.form_status = 'REJECTED';
        assignment.rejection_reason = remarks || '';
      }

      const saved = await queryRunner.manager.save(assignment);
      await queryRunner.commitTransaction();

      // Send notifications based on approval/rejection
      this.notificationsService
        .notifyAssignmentAction({
          action: approve ? 'APPROVED' : 'REJECTED',
          assignmentId: saved.id,
          assetName: saved.asset?.name || 'Asset',
          userId: saved.user?.id,
          rejectionReason: remarks,
        })
        .catch((err) =>
          console.error('Failed to send verification notification:', err),
        );

      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<AssetAssignment[]> {
    return await this.assignmentRepo.find({
      relations: ['asset', 'user'],
      order: { assigned_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<AssetAssignment> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id },
      relations: ['asset', 'user'],
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment record with ID ${id} not found`);
    }
    return assignment;
  }

  async update(
    id: string,
    updateDto: UpdateAssetAssignmentDto,
  ): Promise<AssetAssignment> {
    const assignment = await this.findOne(id);

    if (updateDto.returned_at) {
      assignment.returned_at = new Date(updateDto.returned_at);

      const asset = await this.assetRepo.findOne({
        where: { id: assignment.asset.id },
      });
      if (asset) {
        asset.status = 'IN_STOCK';
        asset.assigned_to = null;
        await this.assetRepo.save(asset);
      }
    }

    if (updateDto.condition_on_assign) {
      assignment.condition_on_assign = updateDto.condition_on_assign;
    }

    return await this.assignmentRepo.save(assignment);
  }

  async remove(id: string): Promise<void> {
    const assignment = await this.findOne(id);
    await this.assignmentRepo.remove(assignment);
  }
}
