import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Asset } from '../assets/entities/asset.entity';
import { AssetAssignment } from './entities/assets-assignment.entity';
import { CreateAssetAssignmentDto } from './dto/create-assets-assignment.dto';
import { UpdateAssetAssignmentDto } from './dto/update-assets-assignment.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AssetAssignmentsService {
  constructor(
    @InjectRepository(AssetAssignment)
    private readonly assignmentRepo: Repository<AssetAssignment>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Assigns an asset to a user and records it in history.
   */
  async create(createDto: CreateAssetAssignmentDto): Promise<AssetAssignment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Check if Asset exists
      const asset = await queryRunner.manager.findOne(Asset, {
        where: { id: createDto.asset_id },
      });
      if (!asset) {
        throw new NotFoundException(`Asset with ID ${createDto.asset_id} not found`);
      }

      // 2. Check if User exists
      const user = await queryRunner.manager.findOne(User, {
        where: { id: createDto.user_id },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${createDto.user_id} not found`);
      }

      // 3. Update Asset status and assigned_to
      asset.status = 'ASSIGNED';
      asset.assigned_to = user;
      await queryRunner.manager.save(asset);

      // 4. Create Assignment Record
      const assignment = queryRunner.manager.create(AssetAssignment, {
        asset,
        user,
        condition_on_assign: createDto.condition_on_assign,
        assigned_at: new Date(),
      });

      const savedAssignment = await queryRunner.manager.save(assignment);

      await queryRunner.commitTransaction();
      return savedAssignment;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to create asset assignment');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<AssetAssignment[]> {
    return await this.assignmentRepo.find({
      relations: ['asset', 'user'],
      order: { assigned_at: 'DESC' }
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

  async update(id: string, updateDto: UpdateAssetAssignmentDto): Promise<AssetAssignment> {
    const assignment = await this.findOne(id);

    if (updateDto.returned_at) {
      assignment.returned_at = new Date(updateDto.returned_at);

      const asset = await this.assetRepo.findOne({
        where: { id: assignment.asset.id }
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