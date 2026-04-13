import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { Category } from 'src/categories/entities/category.entity';
import { Department } from 'src/departments/entities/department.entity';
import { User } from 'src/users/entities/user.entity';
import { AssetAssignment } from 'src/assets-assignments/entities/assets-assignment.entity';
import { DisposeAssetDto } from './dto/dispose-asset.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createAssetDto: CreateAssetDto): Promise<Asset> {
    const { category_id, department_id, assigned_to_user_id, ...assetData } =
      createAssetDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const asset = queryRunner.manager.create(Asset, {
        ...assetData,
        category: category_id ? ({ id: category_id } as Category) : undefined,
        department: department_id
          ? ({ id: department_id } as Department)
          : undefined,
        assigned_to: assigned_to_user_id
          ? ({ id: assigned_to_user_id } as User)
          : undefined,
      });
      if (category_id) {
        const fullCategory = await queryRunner.manager.findOne(Category, {
          where: { id: category_id },
        });
        if (fullCategory) {
          asset.category = fullCategory;
          asset.category = fullCategory;
          const dep = this.calculateDepreciation(asset);
          asset.current_value = dep.current_value;
          asset.accumulated_depreciation = dep.accumulated_depreciation;
          asset.disposal_value = dep.disposal_value;
          console.log(
            ` -> New Dep: ${dep.current_value} | New Disp: ${dep.disposal_value}`,
          );
        }
      }

      const savedAsset = await queryRunner.manager.save(asset);

      if (assigned_to_user_id) {
        const initialAssignment = queryRunner.manager.create(AssetAssignment, {
          asset: savedAsset,
          user: { id: assigned_to_user_id } as User,
          condition_on_assign: 'Initial Purchase / Brand New',
          assigned_at: new Date(),
        });
        await queryRunner.manager.save(initialAssignment);
      }

      await queryRunner.commitTransaction();
      return savedAsset;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('--- ASSET REGISTRATION TRANSACTION FAILED ---');
      console.error('Error Details:', error);

      const err = error as { code?: string; message?: string };

      if (err.code === '23505') {
        throw new BadRequestException(
          'Asset with this serial number or tag ID already exists.',
        );
      }

      throw new InternalServerErrorException(
        `Failed to create asset and initial assignment record: ${err.message || 'Unknown error'}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Asset[]> {
    return await this.assetRepo.find({
      relations: [
        'category',
        'department',
        'assigned_to',
        'assignment_history',
        'assignment_history.user',
      ],
    });
  }

  async findOne(id: string): Promise<Asset> {
    const asset = await this.assetRepo.findOne({
      where: { id },
      relations: [
        'category',
        'department',
        'assigned_to',
        'assignment_history',
        'assignment_history.user',
      ],
    });

    if (!asset) throw new NotFoundException(`Asset with ID ${id} not found`);
    return asset;
  }

  async update(id: string, updateAssetDto: UpdateAssetDto): Promise<Asset> {
    const asset = await this.findOne(id);

    if (updateAssetDto.category_id)
      asset.category = { id: updateAssetDto.category_id } as Category;
    if (updateAssetDto.department_id)
      asset.department = { id: updateAssetDto.department_id } as Department;

    if (updateAssetDto.assigned_to_user_id !== undefined) {
      asset.assigned_to = updateAssetDto.assigned_to_user_id
        ? ({ id: updateAssetDto.assigned_to_user_id } as User)
        : null;
    }

    Object.assign(asset, updateAssetDto);

    const dep = this.calculateDepreciation(asset);
    asset.current_value = dep.current_value;
    asset.accumulated_depreciation = dep.accumulated_depreciation;
    asset.disposal_value = dep.disposal_value;

    return await this.assetRepo.save(asset);
  }

  async remove(id: string): Promise<void> {
    const asset = await this.findOne(id);
    await this.assetRepo.remove(asset);
  }

  async updateStatus(id: string, status: string): Promise<Asset> {
    const asset = await this.findOne(id);
    asset.status = status;
    return await this.assetRepo.save(asset);
  }

  async updateLocation(id: string, location: string): Promise<Asset> {
    const asset = await this.findOne(id);
    asset.location = location;
    return await this.assetRepo.save(asset);
  }

  calculateDepreciation(asset: Asset): {
    current_value: number;
    accumulated_depreciation: number;
    disposal_value: number;
  } {
    if (
      !asset.purchase_cost ||
      !asset.purchase_date ||
      !asset.category?.depreciation_rate
    ) {
      return {
        current_value: Number(asset.purchase_cost) || 0,
        accumulated_depreciation: 0,
        disposal_value:
          Number(asset.purchase_cost || 0) *
          (Number(asset.category?.disposal_rate || 0) / 100),
      };
    }

    const cost = Number(asset.purchase_cost || 0);
    const rate = Number(asset.category?.depreciation_rate || 0) / 100;
    const disposalRate = Number(asset.category?.disposal_rate || 0) / 100;

    const disposalValue = cost * disposalRate;
    const depreciableAmount = cost - disposalValue;

    const purchaseDate = new Date(asset.purchase_date);
    const now = new Date();

    const monthsElapsed =
      (now.getFullYear() - purchaseDate.getFullYear()) * 12 +
      (now.getMonth() - purchaseDate.getMonth());

    const monthlyRate = rate / 12;
    let accumulatedDepreciation =
      depreciableAmount * monthlyRate * Math.max(0, monthsElapsed);

    accumulatedDepreciation = Math.min(
      accumulatedDepreciation,
      depreciableAmount,
    );

    const currentValue = cost - accumulatedDepreciation;

    return {
      current_value: Number(currentValue.toFixed(2)),
      accumulated_depreciation: Number(accumulatedDepreciation.toFixed(2)),
      disposal_value: Number(disposalValue.toFixed(2)),
    };
  }

  async recalculateAll(): Promise<{ updated: number }> {
    console.log('--- STARTING GLOBAL FINANCIAL RECALCULATION ---');
    const assets = await this.assetRepo.find({ relations: ['category'] });
    let updatedCount = 0;

    for (const asset of assets) {
      if (!asset.category && asset.category_id) {
        const category = await this.dataSource.manager.findOne(Category, {
          where: { id: asset.category_id },
        });
        if (category) {
          asset.category = category;
        }
      }
      const dep = this.calculateDepreciation(asset);
      asset.current_value = dep.current_value;
      asset.accumulated_depreciation = dep.accumulated_depreciation;
      if (asset.status !== 'DISPOSED') {
        asset.disposal_value = dep.disposal_value;
        console.log(
          ` -> Synced ${asset.name}: Dep ${dep.current_value}, Disp ${dep.disposal_value}`,
        );
      }
      await this.assetRepo.save(asset);
      updatedCount++;
    }

    return { updated: updatedCount };
  }
  async dispose(id: string, disposeAssetDto: DisposeAssetDto): Promise<Asset> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const asset = await queryRunner.manager.findOne(Asset, {
        where: { id },
        relations: ['assignment_history', 'assigned_to', 'department'],
      });

      if (!asset) throw new NotFoundException(`Asset with ID ${id} not found`);
      if (asset.status === 'DISPOSED')
        throw new BadRequestException(`Asset is already disposed`);
      const activeAssignment = asset.assignment_history?.find(
        (a) => a.returned_at === null,
      );

      if (activeAssignment) {
        activeAssignment.returned_at = new Date(disposeAssetDto.disposal_date);
        activeAssignment.condition_on_assign = `${activeAssignment.condition_on_assign || ''} [SYSTEM FORCED RETURN: Asset Disposed]`;
        await queryRunner.manager.save(activeAssignment);
      }

      asset.status = 'DISPOSED';
      asset.disposal_date = new Date(disposeAssetDto.disposal_date);
      asset.disposal_value = disposeAssetDto.disposal_value;
      asset.disposal_reason = disposeAssetDto.disposal_reason;
      const savedAsset = await queryRunner.manager.save(asset);

      await queryRunner.commitTransaction();
      return savedAsset;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Disposal Transaction Failed:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
