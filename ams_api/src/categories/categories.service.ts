import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Asset } from 'src/assets/entities/asset.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) { }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepo.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Category with name "${createCategoryDto.name}" already exists`,
      );
    }

    const category = this.categoryRepo.create(createCategoryDto);
    return await this.categoryRepo.save(category);
  }

  async findAll(): Promise<Category[]> {
    return await this.categoryRepo.find();
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category)
      throw new NotFoundException(`Category with ID ${id} not found`);
    return category;
  }

  async findByName(name: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { name } });
    if (!category)
      throw new NotFoundException(`Category with name "${name}" not found`);
    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.categoryRepo.findOne({
        where: { name: updateCategoryDto.name },
      });
      if (existing)
        throw new ConflictException(
          `Name "${updateCategoryDto.name}" is already in use`,
        );
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoryRepo.save(category);
  }

  async remove(id: string): Promise<void> {
    const defaultCategoryName = 'Legacy / Uncategorized';
    const categoryToDelete = await this.findOne(id);

    if (categoryToDelete.name === defaultCategoryName) {
      throw new ConflictException(
        `The default category "${defaultCategoryName}" cannot be deleted as it serves as a recovery destination for system integrity.`,
      );
    }

    await this.categoryRepo.manager.transaction(async (manager) => {
      let defaultCategory = await manager.findOne(Category, {
        where: { name: defaultCategoryName },
      });

      if (!defaultCategory) {
        defaultCategory = manager.create(Category, {
          name: defaultCategoryName,
          description:
            'Recovery category for assets whose original category has been removed.',
          depreciation_rate: 0,
          disposal_rate: 0,
        });
        defaultCategory = await manager.save(defaultCategory);
      }

      await manager.update(
        Asset,
        { category_id: id },
        { category_id: defaultCategory.id },
      );

      await manager.remove(categoryToDelete);
    });
  }
}
