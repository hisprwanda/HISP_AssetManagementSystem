import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestableItem } from './entities/requestable-item.entity';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class RequestableItemsService {
  constructor(
    @InjectRepository(RequestableItem)
    private readonly itemRepo: Repository<RequestableItem>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findByCategoryId(categoryId: string): Promise<RequestableItem[]> {
    return this.itemRepo.find({
      where: { category: { id: categoryId } },
      order: { name: 'ASC' },
    });
  }

  async create(categoryId: string, name: string): Promise<RequestableItem> {
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const item = this.itemRepo.create({ name, category });
    return this.itemRepo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.itemRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Requestable item with ID ${id} not found`);
    }
    await this.itemRepo.remove(item);
  }
}
