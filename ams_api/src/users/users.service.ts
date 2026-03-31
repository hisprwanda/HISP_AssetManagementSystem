import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Department } from 'src/departments/entities/department.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}
  async onModuleInit() {
    const adminEmail = 'admin@hisprwanda.org';
    const existingAdmin = await this.findByEmail(adminEmail);

    if (!existingAdmin) {
      console.log('Seeding default Admin account...');
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      const adminUser = this.userRepo.create({
        full_name: 'System Admin',
        email: adminEmail,
        password_hash: hashedPassword,
        role: 'Admin and Finance Director',
      });
      await this.userRepo.save(adminUser);
      console.log(
        '✅ Default Admin seeded! (admin@hisprwanda.org / Admin123!)',
      );
    } else {
      console.log('Admin user found. Enforcing Admin123! password...');
      existingAdmin.password_hash = await bcrypt.hash('Admin123!', 10);
      existingAdmin.role = 'Admin and Finance Director';
      await this.userRepo.save(existingAdmin);
      console.log('✅ Admin credentials reset successfully!');
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { department_id, ...userData } = createUserDto;

    const user = this.userRepo.create({
      ...userData,
      department: { id: department_id } as Department,
    });
    return await this.userRepo.save(user);
  }

  async findAll(departmentId?: string): Promise<User[]> {
    if (departmentId) {
      return await this.userRepo.find({
        where: { department: { id: departmentId } },
        relations: ['department'],
      });
    }
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

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepo.findOne({
      where: { email },
      select: ['id', 'full_name', 'email', 'password_hash', 'role'],
      relations: ['department'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const { department_id, ...userData } = updateUserDto;

    if (department_id) {
      user.department = { id: department_id } as Department;
    }

    Object.assign(user, userData);
    return await this.userRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
  }
}
