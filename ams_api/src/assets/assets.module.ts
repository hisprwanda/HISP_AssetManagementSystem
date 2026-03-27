import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { Asset } from './entities/asset.entity';
import { AssetAssignment } from '../assets-assignments/entities/assets-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, AssetAssignment])],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
