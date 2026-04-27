import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, In } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { Category } from 'src/categories/entities/category.entity';
import { Department } from 'src/departments/entities/department.entity';
import { User } from 'src/users/entities/user.entity';
import { AssetAssignment } from 'src/assets-assignments/entities/assets-assignment.entity';
import { DisposeAssetDto } from './dto/dispose-asset.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { AssetIncident } from 'src/asset-incidents/entities/asset-incident.entity';

interface BulkAssetData {
  serial_number?: string;
  tag_id?: string;
  category_name?: string;
  Category?: string;
  department_name?: string;
  Department?: string;
  Personnel?: string;
  personnel_name?: string;
  status?: string;
  purchase_cost?: number | string;
  [key: string]: any;
}

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(AssetIncident)
    private readonly incidentRepo: Repository<AssetIncident>,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createAssetDto: CreateAssetDto): Promise<Asset> {
    const { category_id, department_id, assigned_to_user_id, ...assetData } =
      createAssetDto;

    if (assetData.serial_number === '') {
      assetData.serial_number = null;
    }

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
        status: assigned_to_user_id
          ? 'IN_STOCK'
          : assetData.status || 'IN_STOCK',
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
        }
      }

      const savedAsset = await queryRunner.manager.save(asset);

      if (assigned_to_user_id) {
        const count = await queryRunner.manager.count(AssetAssignment);
        const formNumber = `ARF/${new Date().getFullYear()}/${(count + 1).toString().padStart(3, '0')}`;

        const initialAssignment = queryRunner.manager.create(AssetAssignment, {
          asset: savedAsset,
          user: { id: assigned_to_user_id } as User,
          condition_on_assign: 'Initial Purchase / Brand New',
          assigned_at: new Date(),
          form_status: 'DRAFT',
          form_number: formNumber,
          received_from_name: 'Administration',
          received_at: new Date(),
        } as any);
        await queryRunner.manager.save(initialAssignment);
      }

      await queryRunner.commitTransaction();
      return savedAsset;
    } catch {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        `Failed to create asset and initial assignment record`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async bulkCreate(assetsData: BulkAssetData[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const data of assetsData) {
        try {
          // Manual Duplicate Check to avoid transaction poisoning
          if (data.serial_number) {
            const existingSerial = await queryRunner.manager.findOne(Asset, {
              where: { serial_number: data.serial_number },
            });
            if (existingSerial) {
              throw new Error(
                `Serial Number '${data.serial_number}' already registered`,
              );
            }
          }

          if (data.tag_id) {
            const existingTag = await queryRunner.manager.findOne(Asset, {
              where: { tag_id: data.tag_id },
            });
            if (existingTag) {
              throw new Error(`Tag ID '${data.tag_id}' already registered`);
            }
          }
          let category: Category | null = null;
          if (data.category_name || data.Category) {
            category = await queryRunner.manager.findOne(Category, {
              where: { name: data.category_name || data.Category },
            });
          }

          let department: Department | null = null;
          if (data.department_name || data.Department) {
            department = await queryRunner.manager.findOne(Department, {
              where: { name: data.department_name || data.Department },
            });
          }

          let assigned_to: User | null = null;
          const personnelName = data.Personnel || data.personnel_name;
          if (personnelName) {
            assigned_to = await queryRunner.manager.findOne(User, {
              where: { full_name: personnelName },
            });
          }

          const entityFields = { ...data };
          delete entityFields.category_name;
          delete entityFields.Category;
          delete entityFields.department_name;
          delete entityFields.Department;
          delete entityFields.Personnel;
          delete entityFields.personnel_name;
          delete entityFields.purchase_cost;
          delete entityFields.status;

          const rawCost = data.purchase_cost;

          const asset = queryRunner.manager.create(Asset, {
            ...entityFields,
            serial_number: entityFields.serial_number || null,
            purchase_cost: Number(rawCost || 0),
            category,
            department,
            assigned_to,
            status: data.status || (assigned_to ? 'ASSIGNED' : 'IN_STOCK'),
          });

          if (category) {
            const dep = this.calculateDepreciation(asset);
            asset.current_value = dep.current_value;
            asset.accumulated_depreciation = dep.accumulated_depreciation;
            asset.disposal_value = dep.disposal_value;
          } else {
            asset.current_value = Number(data.purchase_cost || 0);
            asset.accumulated_depreciation = 0;
          }

          await queryRunner.manager.save(asset);
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push(
            `Row ${results.success + results.failed}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        `Bulk operation failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      await queryRunner.release();
    }

    return results;
  }

  async findAll(search?: string): Promise<Asset[]> {
    const query = this.assetRepo
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.category', 'category')
      .leftJoinAndSelect('asset.department', 'department')
      .leftJoinAndSelect('asset.assigned_to', 'assigned_to')
      .leftJoinAndSelect('asset.assignment_history', 'assignment_history')
      .leftJoinAndSelect('assignment_history.user', 'history_user');

    if (search) {
      query.where(
        '(asset.name ILike :search OR asset.serial_number ILike :search OR category.name ILike :search OR asset.tag_id ILike :search)',
        { search: `%${search}%` },
      );
    }

    return await query.getMany();
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
        'incidents',
        'incidents.reported_by',
      ],
    });

    if (!asset) throw new NotFoundException(`Asset with ID ${id} not found`);
    return asset;
  }

  async update(id: string, updateAssetDto: UpdateAssetDto): Promise<Asset> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const asset = await queryRunner.manager.findOne(Asset, {
        where: { id },
        relations: ['category', 'department', 'assigned_to'],
      });

      if (!asset) throw new NotFoundException(`Asset with ID ${id} not found`);

      const oldAssignedToId = asset.assigned_to?.id;
      const newAssignedToId = updateAssetDto.assigned_to_user_id;

      const isValidUUID = (id: unknown): boolean =>
        typeof id === 'string' && id.length === 36;

      if (
        updateAssetDto.category_id !== undefined &&
        updateAssetDto.category_id !== asset.category?.id
      ) {
        if (isValidUUID(updateAssetDto.category_id)) {
          const category = await queryRunner.manager.findOne(Category, {
            where: { id: updateAssetDto.category_id },
          });
          if (category) {
            asset.category = category;
            asset.category_id = category.id;
          }
        } else if (updateAssetDto.category_id === null) {
          asset.category = null;
          asset.category_id = null;
        }
      }

      if (
        updateAssetDto.department_id !== undefined &&
        updateAssetDto.department_id !== asset.department?.id
      ) {
        if (isValidUUID(updateAssetDto.department_id)) {
          const department = await queryRunner.manager.findOne(Department, {
            where: { id: updateAssetDto.department_id },
          });
          if (department) {
            asset.department = department;
            asset.department_id = department.id;
          }
        } else if (updateAssetDto.department_id === null) {
          asset.department = null;
          asset.department_id = null;
        }
      }

      if (newAssignedToId !== undefined) {
        const userChanging =
          isValidUUID(newAssignedToId) && newAssignedToId !== oldAssignedToId;
        const statusChangingToAssigned =
          updateAssetDto.status === 'ASSIGNED' && asset.status !== 'ASSIGNED';

        if (userChanging || statusChangingToAssigned) {
          const user = await queryRunner.manager.findOne(User, {
            where: { id: newAssignedToId },
          });
          if (!user) throw new NotFoundException('Target user not found');

          const isManualOverride = updateAssetDto.status === 'ASSIGNED';

          if (!isManualOverride) {
            const count = await queryRunner.manager.count(AssetAssignment);
            const formNumber = `ARF/${new Date().getFullYear()}/${(count + 1).toString().padStart(3, '0')}`;

            const assignment = queryRunner.manager.create(AssetAssignment, {
              asset: { id: asset.id } as Asset,
              user: user,
              condition_on_assign: 'Assigned via System Update',
              assigned_at: new Date(),
              form_status: 'DRAFT',
              form_number: formNumber,
              received_from_name: 'Administration',
              received_at: new Date(),
            });
            await queryRunner.manager.save(assignment);

            updateAssetDto.status = 'IN_STOCK';
          }

          asset.assigned_to = user;
          asset.assigned_to_user_id = user.id;
        } else if (newAssignedToId === null) {
          asset.assigned_to = null;
          asset.assigned_to_user_id = null;
        }
      }

      const otherData = { ...updateAssetDto };
      delete otherData.category_id;
      delete otherData.department_id;
      delete otherData.assigned_to_user_id;
      Object.assign(asset, otherData);
      const dep = this.calculateDepreciation(asset);
      asset.current_value = dep.current_value;
      asset.accumulated_depreciation = dep.accumulated_depreciation;
      asset.disposal_value = dep.disposal_value;

      const savedAsset = await queryRunner.manager.save(asset);
      await queryRunner.commitTransaction();

      return await this.findOne(savedAsset.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error('[AssetsService] Update Error:', err);
      throw err;
    } finally {
      await queryRunner.release();
    }
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

  async initiateReturn(id: string, userId: string): Promise<Asset> {
    const asset = await this.findOne(id);
    const initiator = await this.dataSource.manager.findOne(User, {
      where: { id: userId },
    });

    if (!initiator)
      throw new NotFoundException('Initiator of return not found');
    if (asset.status !== 'ASSIGNED') {
      throw new BadRequestException(
        'Only currently assigned assets can be returned.',
      );
    }

    asset.status = 'RETURN_PENDING';
    const saved = await this.assetRepo.save(asset);

    try {
      await this.notificationsService.notifyReturnInitiated({
        asset: saved,
        initiator,
      });
    } catch (e) {
      console.error('Return initiation notification failed:', e);
    }

    return saved;
  }

  async acknowledgeReturn(id: string): Promise<Asset> {
    const asset = await this.findOne(id);

    if (asset.status !== 'RETURN_PENDING') {
      throw new BadRequestException('Asset is not in pending return state.');
    }

    if (asset.assigned_to) {
      try {
        await this.notificationsService.notifyReturnAcknowledged({
          asset,
          recipientId: asset.assigned_to.id,
        });
      } catch (e) {
        console.error('Acknowledgment notification failed:', e);
      }
    }

    return asset;
  }

  async finalizeReturn(
    id: string,
    params: { isDamaged: boolean; remarks?: string; location?: string },
  ): Promise<Asset> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const asset = await queryRunner.manager.findOne(Asset, {
        where: { id },
        relations: [
          'assigned_to',
          'department',
          'category',
          'assignment_history',
        ],
      });

      if (!asset) throw new NotFoundException('Asset not found');
      const previousAssigneeId = asset.assigned_to?.id;

      if (params.isDamaged) {
        asset.status = 'BROKEN';
        // Create an incident
        const incident = queryRunner.manager.create(AssetIncident, {
          asset: { id: asset.id },
          reported_by: { id: previousAssigneeId },
          incident_type: 'BROKEN',
          location:
            params.location || asset.location || 'Administration Office',
          explanation: `[AUTO-GENERATED ON RETURN] Asset returned in bad condition. Remarks: ${params.remarks || 'No details provided.'}`,
          investigation_status: 'INVESTIGATING',
        });
        await queryRunner.manager.save(incident);
      } else {
        asset.status = 'IN_STOCK';
      }

      // Close the active assignment
      const activeAssignment = asset.assignment_history?.find(
        (a) => a.returned_at === null,
      );
      if (activeAssignment) {
        activeAssignment.returned_at = new Date();
        activeAssignment.condition_on_assign = `${activeAssignment.condition_on_assign || ''} [RETURNED: ${params.isDamaged ? 'DAMAGED' : 'GOOD'}]`;
        await queryRunner.manager.save(activeAssignment);
      }

      // Clear the assignee
      asset.assigned_to = null;
      asset.assigned_to_user_id = null;

      const savedAsset = await queryRunner.manager.save(asset);
      await queryRunner.commitTransaction();

      if (previousAssigneeId) {
        try {
          await this.notificationsService.notifyReturnFinalized({
            asset: savedAsset,
            recipientId: previousAssigneeId,
            isDamaged: params.isDamaged,
            remarks: params.remarks,
          });
        } catch (e) {
          console.error('Finalization notification failed:', e);
        }
      }

      return savedAsset;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleNightlyDepreciation(): Promise<{ updated: number }> {
    console.log('[Cron] STARTING NIGHTLY FINANCIAL SYNC...');
    const assets = await this.assetRepo.find({
      where: { status: Not(In(['DISPOSED'])) },
      relations: ['category'],
    });

    let updatedCount = 0;
    const now = new Date();

    for (const asset of assets) {
      const dep = this.calculateDepreciation(asset);
      asset.current_value = dep.current_value;
      asset.accumulated_depreciation = dep.accumulated_depreciation;

      // Check for End-of-Life triggers
      const isDepreciated =
        asset.current_value <= (asset.disposal_value || 0) ||
        asset.current_value === 0;

      const isWarrantyExpired =
        asset.warranty_expiry && new Date(asset.warranty_expiry) < now;

      if (isDepreciated || isWarrantyExpired) {
        await this.notificationsService.notifyAssetEndOfLife({
          assetName: asset.name,
          serialNumber: asset.serial_number || 'N/A',
          currentValue: asset.current_value,
          reason: isDepreciated ? 'DEPRECIATED' : 'WARRANTY_EXPIRED',
        });
      }

      await this.assetRepo.save(asset);
      updatedCount++;
    }

    console.log(`[Cron] SYNC COMPLETE: ${updatedCount} assets updated.`);
    return { updated: updatedCount };
  }
}
