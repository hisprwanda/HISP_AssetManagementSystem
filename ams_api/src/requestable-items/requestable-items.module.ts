import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestableItemsService } from './requestable-items.service';
import { RequestableItemsController } from './requestable-items.controller';
import { RequestableItem } from './entities/requestable-item.entity';
import { Category } from '../categories/entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RequestableItem, Category])],
  controllers: [RequestableItemsController],
  providers: [RequestableItemsService],
})
export class RequestableItemsModule {}
