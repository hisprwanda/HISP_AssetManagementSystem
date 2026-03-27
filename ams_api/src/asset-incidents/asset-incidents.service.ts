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

@Injectable()
export class AssetIncidentsService {
  constructor(
    @InjectRepository(AssetIncident)
    private readonly incidentRepo: Repository<AssetIncident>,
    private readonly assetsService: AssetsService,
    private readonly dataSource: DataSource,
  ) {}

  async reportIncident(dto: {
    asset_id: string;
    user_id: string;
    type: string;
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

      asset.status = dto.type === 'MISSING' ? 'MISSING' : 'UNDER_REPAIR';
      await queryRunner.manager.save(asset);
      const incident = queryRunner.manager.create(AssetIncident, {
        asset: { id: dto.asset_id },
        reported_by: { id: dto.user_id },
        incident_type: dto.type,
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
  async resolveIncident(
    incidentId: string,
    resolution: 'ACCEPTED' | 'DENIED',
    remarks: string,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const incident = await queryRunner.manager.findOne(AssetIncident, {
        where: { id: incidentId },
        relations: ['asset', 'asset.category', 'reported_by'],
      });

      if (!incident) throw new NotFoundException('Incident not found');
      if (incident.investigation_status !== 'INVESTIGATING') {
        throw new BadRequestException(
          'This incident has already been resolved.',
        );
      }

      incident.investigation_status = resolution;

      if (resolution === 'ACCEPTED') {
        const request = queryRunner.manager.create(AssetRequest, {
          requester: incident.reported_by,
          description: `[AUTO-GENERATED REPLACEMENT] Previous asset (${incident.asset.tag_id}) was ${incident.incident_type}. Reason: ${remarks}`,
          status: 'PENDING',
        });
        const savedRequest = await queryRunner.manager.save(request);
        incident.replacement_request = savedRequest;
      } else if (resolution === 'DENIED') {
        const currentBookValue = this.assetsService.calculateCurrentValue(
          incident.asset,
        );
        incident.penalty_amount = currentBookValue;
      }

      const updatedIncident = await queryRunner.manager.save(incident);
      await queryRunner.commitTransaction();
      return updatedIncident;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
