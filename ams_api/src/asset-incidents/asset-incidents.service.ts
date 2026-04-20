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

@Injectable()
export class AssetIncidentsService {
  constructor(
    @InjectRepository(AssetIncident)
    private readonly incidentRepo: Repository<AssetIncident>,
    private readonly assetsService: AssetsService,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
  ) {}

  async reportIncident(dto: {
    asset_id: string;
    user_id: string;
    type: string;
    location: string;
    explanation: string;
    evidence_url?: string;
  }) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const asset = await queryRunner.manager.findOne(Asset, {
        where: { id: dto.asset_id },
      });
      if (!asset) throw new NotFoundException('Asset not found');

      asset.status = dto.type === 'MISSING' ? 'MISSING' : 'BROKEN';
      await queryRunner.manager.save(asset);
      console.log('--- RECV INCIDENT REPORT ---');
      console.log('Asset ID:', dto.asset_id);
      console.log('Evidence URL Length:', dto.evidence_url?.length || 0);
      console.log('Evidence URL Sample:', dto.evidence_url?.slice(0, 50));

      const incident = queryRunner.manager.create(AssetIncident, {
        asset: { id: dto.asset_id },
        reported_by: { id: dto.user_id },
        incident_type: dto.type,
        location: dto.location,
        explanation: dto.explanation,
        evidence_url: dto.evidence_url,
        investigation_status: 'INVESTIGATING',
      });

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
    if (incident.investigation_status !== 'INVESTIGATING') {
      throw new BadRequestException(
        'Only items in current investigation can be forwarded.',
      );
    }

    incident.investigation_status = 'CEO_REVIEW';
    incident.investigation_remarks = remarks;
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

  async resolveIncident(
    incidentId: string,
    resolution: 'ACCEPTED' | 'DENIED',
    remarks: string,
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

      const currentStatus = incident.investigation_status;
      if (currentStatus === 'ACCEPTED' || currentStatus === 'DENIED') {
        throw new BadRequestException(
          'This incident has already been resolved.',
        );
      }

      if (currentStatus === 'CEO_REVIEW') {
        incident.ceo_remarks = remarks;
      } else {
        incident.investigation_remarks = remarks;
      }

      incident.investigation_status = resolution;

      if (resolution === 'ACCEPTED') {
        const request = queryRunner.manager.create(AssetRequest, {
          requested_by: incident.reported_by,
          department: incident.reported_by.department,
          title: `Replacement for ${incident.asset.name}`,
          description: `[AUTO-GENERATED REPLACEMENT] Previous asset (${incident.asset.tag_id}) was ${incident.incident_type}. Outcome: ${remarks}`,
          status: 'PENDING',
          items: [
            {
              name: incident.asset.name,
              quantity: 1,
              description: 'Replacement for damaged/missing asset',
            },
          ],
          financials: {},
          logistics: {},
        });
        const savedRequest = await queryRunner.manager.save(request);
        incident.replacement_request = savedRequest;
      } else if (resolution === 'DENIED') {
        const { current_value } = this.assetsService.calculateDepreciation(
          incident.asset,
        );
        incident.penalty_amount = current_value;
      }

      const updatedIncident = await queryRunner.manager.save(incident);
      await queryRunner.commitTransaction();

      try {
        await this.notificationsService.notifyIncidentVerdict({
          incidentId: updatedIncident.id,
          resolution: updatedIncident.investigation_status as
            | 'ACCEPTED'
            | 'DENIED',
          assetName: updatedIncident.asset?.name || 'Assigned Asset',
          reporterId: updatedIncident.reported_by?.id,
          departmentId: updatedIncident.reported_by?.department?.id,
          remarks:
            updatedIncident.investigation_status === 'ACCEPTED' ||
            updatedIncident.investigation_status === 'DENIED'
              ? isCEOAction
                ? updatedIncident.ceo_remarks
                : updatedIncident.investigation_remarks
              : remarks,
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
  async togglePenaltyResolution(incidentId: string) {
    const incident = await this.incidentRepo.findOne({
      where: { id: incidentId },
      relations: ['asset', 'reported_by'],
    });

    if (!incident) throw new NotFoundException('Incident not found');
    if (incident.investigation_status !== 'DENIED') {
      throw new BadRequestException(
        'Resolution only applicable to denied incidents with penalties.',
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
        amount: saved.penalty_amount || 0,
        isResolved: !!saved.penalty_resolved_at,
      });
    } catch (error) {
      console.error('Failed to send penalty resolution notification:', error);
    }

    return saved;
  }
}
