import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetRequest } from './entities/assets-request.entity';
import { AssetRequestsController } from './assets-requests.controller';
import { AssetRequestsService } from './assets-requests.service';

@Module({
  imports: [TypeOrmModule.forFeature([AssetRequest])],
  controllers: [AssetRequestsController],
  providers: [AssetRequestsService],
  exports: [AssetRequestsService],
})
export class AssetRequestsModule {}
