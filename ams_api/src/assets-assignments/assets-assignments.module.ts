import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetAssignmentsService } from './assets-assignments.service';
import { AssetAssignmentsController } from './assets-assignments.controller';
import { Asset } from '../assets/entities/asset.entity';
import { AssetAssignment } from './entities/assets-assignment.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AssetAssignment, Asset, User])],
  controllers: [AssetAssignmentsController],
  providers: [AssetAssignmentsService],
  exports: [AssetAssignmentsService],
})
export class AssetAssignmentsModule {}
