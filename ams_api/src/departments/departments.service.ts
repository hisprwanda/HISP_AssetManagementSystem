import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const existing = await this.departmentRepo.findOne({
      where: { name: createDepartmentDto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Department with name '${createDepartmentDto.name}' already exists`,
      );
    }

    const department = this.departmentRepo.create(createDepartmentDto);
    return await this.departmentRepo.save(department);
  }

  async findAll(): Promise<Department[]> {
    return await this.departmentRepo.find({ relations: ['users'] });
  }

  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepo.findOne({
      where: { id },
      relations: ['users'],
    });
    if (!department)
      throw new NotFoundException(`Department with ID ${id} not found`);
    return department;
  }

  async findByName(name: string): Promise<Department> {
    const department = await this.departmentRepo.findOne({
      where: { name },
      relations: ['users'],
    });
    if (!department)
      throw new NotFoundException(`Department with name '${name}' not found`);
    return department;
  }

  async update(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    const department = await this.findOne(id);
    Object.assign(department, updateDepartmentDto);
    return await this.departmentRepo.save(department);
  }

  async remove(id: string): Promise<void> {
    const department = await this.findOne(id);
    await this.departmentRepo.remove(department);
  }
}
