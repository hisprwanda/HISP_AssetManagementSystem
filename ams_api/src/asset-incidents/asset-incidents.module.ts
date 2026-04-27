import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetIncidentsService } from './asset-incidents.service';
import { AssetIncidentsController } from './asset-incidents.controller';
import { AssetIncident } from './entities/asset-incident.entity';
import { AssetsModule } from '../assets/assets.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetIncident]),
    AssetsModule,
    NotificationsModule,
    UsersModule,
  ],
  controllers: [AssetIncidentsController],
  providers: [AssetIncidentsService],
})
export class AssetIncidentsModule {}
