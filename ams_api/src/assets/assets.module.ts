import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { Asset } from './entities/asset.entity';
import { AssetAssignment } from '../assets-assignments/entities/assets-assignment.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AssetIncident } from '../asset-incidents/entities/asset-incident.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, AssetAssignment, AssetIncident]),
    NotificationsModule,
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
