import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetRequest } from './entities/assets-request.entity';
import { AssetRequestsController } from './assets-requests.controller';
import { AssetRequestsService } from './assets-requests.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetRequest, User]),
    NotificationsModule,
  ],
  controllers: [AssetRequestsController],
  providers: [AssetRequestsService],
  exports: [AssetRequestsService],
})
export class AssetRequestsModule {}
