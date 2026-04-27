import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AssetIncident } from './entities/asset-incident.entity';
import { Asset } from 'src/assets/entities/asset.entity';
import { AssetRequest } from 'src/assets-requests/entities/assets-request.entity';
import { AssetsService } from 'src/assets/assets.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UsersService } from 'src/users/users.service';

import { ReportIncidentDto } from './dto/report-asset-incident.dto';
import { ResolveIncidentDto } from './dto/resolve-asset-incident.dto';

@Injectable()
export class AssetIncidentsService {
  constructor(
    @InjectRepository(AssetIncident)
    private readonly incidentRepo: Repository<AssetIncident>,
    private readonly assetsService: AssetsService,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  async reportIncident(dto: ReportIncidentDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const asset = await queryRunner.manager.findOne(Asset, {
        where: { id: dto.asset_id },
      });
      if (!asset) throw new NotFoundException('Asset not found');

      // Hybrid Rule: Automatically update asset status to BROKEN on report
      asset.status = 'BROKEN';
      await queryRunner.manager.save(asset);

      const incident = queryRunner.manager.create(AssetIncident, {
        asset: { id: dto.asset_id },
        reported_by: { id: dto.user_id },
        incident_type: dto.type,
        location: dto.location,
        issue_description: dto.issue_description,
        evidence_url: dto.evidence_url,
        status: 'PENDING',
      });

      // Business Rule: If an Admin/Finance user reports an incident, it goes immediately to CEO
      const reporter = await this.usersService.findOne(dto.user_id);
      if (reporter) {
        const roleUpper = reporter.role.toUpperCase();
        const deptUpper = (reporter.department?.name || '').toUpperCase();
        const isAdmin =
          roleUpper.includes('ADMIN') ||
          roleUpper.includes('SYSTEM_ADMIN') ||
          roleUpper.includes('FINANCE') ||
          deptUpper.includes('ADMIN AND FINANCE') ||
          deptUpper.includes('ADMIN & FINANCE') ||
          deptUpper.includes('FINANCE');

        if (isAdmin) {
          incident.status = 'CEO_REVIEW';
        }
      }

      const savedIncident = await queryRunner.manager.save(incident);
      await queryRunner.commitTransaction();
      return savedIncident;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async startRepair(incidentId: string) {
    const incident = await this.incidentRepo.findOne({
      where: { id: incidentId },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.status !== 'PENDING') {
      throw new BadRequestException(
        'Incident must be PENDING to start repair.',
      );
    }

    incident.status = 'IN_REPAIR';
    return await this.incidentRepo.save(incident);
  }

  async resolveIncident(
    incidentId: string,
    dto: ResolveIncidentDto,
    isCEOAction = false,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const incident = await queryRunner.manager.findOne(AssetIncident, {
        where: { id: incidentId },
        relations: [
          'asset',
          'asset.category',
          'reported_by',
          'reported_by.department',
        ],
      });

      if (!incident) throw new NotFoundException('Incident not found');

      if (
        incident.status.startsWith('RESOLVED') ||
        incident.status === 'REJECTED_LIABILITY'
      ) {
        throw new BadRequestException(
          'This incident has already been resolved.',
        );
      }

      incident.resolution_notes = dto.resolution_notes;
      incident.status = dto.incident_status;

      // Update Asset Status
      if (incident.asset) {
        incident.asset.status = dto.new_asset_status;

        // If unfixable/replaced/liability, remove from current user if it's being disposed
        if (dto.new_asset_status === 'DISPOSED') {
          incident.asset.assigned_to = null;
        }

        await queryRunner.manager.save(incident.asset);
      }

      // Outcome specific logic
      if (dto.incident_status === 'RESOLVED_REPLACED') {
        // Auto-generate replacement request
        const request = queryRunner.manager.create(AssetRequest, {
          requested_by: incident.reported_by,
          department: incident.reported_by.department,
          title: `Replacement for ${incident.asset.name}`,
          description: `[AUTO-GENERATED REPLACEMENT] Previous asset (${incident.asset.tag_id}) was unfixable. Outcome: ${dto.resolution_notes}`,
          status: 'PENDING',
          items: [
            {
              name: incident.asset.name,
              quantity: 1,
              description: 'Replacement for damaged asset',
            },
          ],
          financials: {},
          logistics: {},
        });
        const savedRequest = await queryRunner.manager.save(request);
        incident.replacement_request = savedRequest;
      } else if (dto.incident_status === 'REJECTED_LIABILITY') {
        // Calculate penalty (Previous logic preserved for Liability case)
        const { current_value } = this.assetsService.calculateDepreciation(
          incident.asset,
        );
        incident.penalty_amount = current_value;
      }

      const updatedIncident = await queryRunner.manager.save(incident);
      await queryRunner.commitTransaction();

      // Notifications
      try {
        await this.notificationsService.notifyIncidentVerdict({
          incidentId: updatedIncident.id,
          resolution:
            updatedIncident.status === 'REJECTED_LIABILITY'
              ? 'DENIED'
              : 'ACCEPTED',
          assetName: updatedIncident.asset?.name || 'Assigned Asset',
          reporterId: updatedIncident.reported_by?.id,
          departmentId: updatedIncident.reported_by?.department?.id,
          remarks: dto.resolution_notes,
          isCEO: isCEOAction,
        });
      } catch (e) {
        console.error('Verdict notification failed:', e);
      }

      return updatedIncident;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    return this.incidentRepo.find({
      relations: [
        'asset',
        'reported_by',
        'reported_by.department',
        'replacement_request',
      ],
      order: { reported_at: 'DESC' },
    });
  }

  async forwardToCEO(incidentId: string, remarks: string) {
    const incident = await this.incidentRepo.findOne({
      where: { id: incidentId },
      relations: ['asset'],
    });
    if (!incident) throw new NotFoundException('Incident not found');

    // CEO can review items in repair or pending if they are high stakes
    incident.status = 'CEO_REVIEW';
    incident.ceo_remarks = remarks;
    const saved = await this.incidentRepo.save(incident);

    try {
      await this.notificationsService.notifyIncidentForwarded({
        incidentId: saved.id,
        assetName: saved.asset?.name || 'Assigned Asset',
        adminRemarks: remarks,
      });
    } catch (e) {
      console.error('Forward notification failed:', e);
    }

    return saved;
  }

  async togglePenaltyResolution(incidentId: string) {
    const incident = await this.incidentRepo.findOne({
      where: { id: incidentId },
      relations: ['asset', 'reported_by'],
    });

    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.status !== 'REJECTED_LIABILITY') {
      throw new BadRequestException(
        'Resolution only applicable to incidents with liability penalties.',
      );
    }

    incident.penalty_resolved_at = incident.penalty_resolved_at
      ? null
      : new Date();

    const saved = await this.incidentRepo.save(incident);

    try {
      await this.notificationsService.notifyPenaltyResolution({
        incidentId: saved.id,
        assetName: saved.asset?.name || 'Assigned Asset',
        recipientId: saved.reported_by?.id,
        amount: incident.penalty_amount || 0,
        isResolved: !!saved.penalty_resolved_at,
      });
    } catch (error) {
      console.error('Failed to send penalty resolution notification:', error);
    }

    return saved;
  }
}
