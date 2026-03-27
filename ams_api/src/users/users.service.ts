import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Department } from 'src/departments/entities/department.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Map the incoming department_id to the department relation object
    const user = this.userRepo.create({
      ...createUserDto,
      department: { id: createUserDto.department_id },
    });
    return await this.userRepo.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepo.find({ relations: ['department'] });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['department'],
    });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findByName(full_name: string): Promise<User[]> {
    const users = await this.userRepo.find({
      where: { full_name },
      relations: ['department'],
    });
    if (!users || users.length === 0)
      throw new NotFoundException(`No users found with name '${full_name}'`);
    return users;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // If the department is being updated, handle the relational mapping
    if (updateUserDto.department_id) {
      user.department = { id: updateUserDto.department_id } as Department;
    }

    Object.assign(user, updateUserDto);
    return await this.userRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
  }
}
