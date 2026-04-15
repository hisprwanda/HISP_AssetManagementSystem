import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetIncidentsService } from './asset-incidents.service';
import { AssetIncidentsController } from './asset-incidents.controller';
import { AssetIncident } from './entities/asset-incident.entity';
import { AssetsModule } from '../assets/assets.module';

@Module({
  imports: [TypeOrmModule.forFeature([AssetIncident]), AssetsModule],
  controllers: [AssetIncidentsController],
  providers: [AssetIncidentsService],
})
export class AssetIncidentsModule {}
