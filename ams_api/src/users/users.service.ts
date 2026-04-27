import {
  Injectable,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Department } from 'src/departments/entities/department.entity';
import { Asset } from 'src/assets/entities/asset.entity';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {
    console.log('[UsersService] Service Instantiated');
  }

  async onApplicationBootstrap() {
    console.log('[UsersService] onApplicationBootstrap triggered');
    await this.bootstrapSystemAdmin();
  }

  private async bootstrapSystemAdmin() {
    try {
      const count = await this.userRepo.count();
      if (count > 0) return;

      console.log('[UsersService] [BOOTSTRAP] Initializing System Admin...');

      const deptRepo = this.dataSource.getRepository(Department);
      const defaultDeptName = 'Admin and Finance';
      let dept = await deptRepo.findOne({
        where: { name: defaultDeptName },
      });

      if (!dept) {
        dept = deptRepo.create({
          name: defaultDeptName,
          type: 'Directorate',
          status: 'Active',
        });
        await deptRepo.save(dept);
      }

      const tempPassword = this.generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const admin = this.userRepo.create({
        full_name: 'System Admin',
        email: 'admin@hisp.tech',
        password_hash: hashedPassword,
        provisioning_password: tempPassword,
        role: 'Admin and Finance Director',
        department: dept,
        status: UserStatus.ACTIVE,
      });

      await this.userRepo.save(admin);
      console.log(
        `[UsersService] [BOOTSTRAP] System Admin created successfully.`,
      );
      console.log(`[UsersService] [BOOTSTRAP] Email: admin@hisp.tech`);
      console.log(`[UsersService] [BOOTSTRAP] Temp Password: ${tempPassword}`);
    } catch (error) {
      console.error('[UsersService] [BOOTSTRAP] ERROR:', error);
    }
  }

  private generateTempPassword(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { department_id, password, ...userData } = createUserDto;

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepo.create({
      ...userData,
      password_hash: hashedPassword,
      provisioning_password: password,
      department: { id: department_id } as Department,
      status: UserStatus.INACTIVE,
    });
    const savedUser = await this.userRepo.save(user);

    console.log(`\n--- WELCOME EMAIL MOCK ---`);
    console.log(`To: ${savedUser.email}`);
    console.log(`Subject: Welcome to HISP Asset Management System`);
    console.log(
      `Your account has been created. Please log in using the temporary password below:`,
    );
    console.log(`Temporary Password: ${password}`);
    console.log(`Login Link: http://localhost:5173/login`);
    console.log(`--------------------------\n`);

    return savedUser;
  }

  async bulkCreate(
    usersData: Record<string, any>[],
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results: { success: number; failed: number; errors: string[] } = {
      success: 0,
      failed: 0,
      errors: [],
    };
    const deptRepo = this.dataSource.getRepository(Department);

    for (const data of usersData) {
      try {
        const { full_name, email, role, department_name, phone_number } =
          data as {
            full_name: string;
            email: string;
            role: string;
            department_name: string;
            phone_number: string;
          };
        if (
          !full_name ||
          !email ||
          !role ||
          !department_name ||
          !phone_number
        ) {
          results.failed++;
          results.errors.push(
            `Missing mandatory fields for user: ${email || 'Unknown'} (Check name, email, phone, role, and department)`,
          );
          continue;
        }

        const existing = await this.userRepo.findOne({ where: { email } });
        if (existing) {
          results.failed++;
          results.errors.push(`User already exists: ${email}`);
          continue;
        }

        let department: Department | undefined = undefined;
        if (department_name) {
          department =
            (await deptRepo.findOne({ where: { name: department_name } })) ||
            undefined;
          if (!department) {
            results.errors.push(
              `Department not found: ${department_name} for user ${email}. Using unassigned.`,
            );
          }
        }
        const rawPassword = this.generateTempPassword();
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const newUser = this.userRepo.create({
          full_name,
          email,
          role,
          phone_number,
          password_hash: hashedPassword,
          provisioning_password: rawPassword,
          department: department,
          status: UserStatus.INACTIVE,
        });

        await this.userRepo.save(newUser);

        console.log(`\n--- BULK WELCOME EMAIL MOCK ---`);
        console.log(`To: ${email}`);
        console.log(`Subject: Welcome to HISP Asset Management System`);
        console.log(
          `Your account has been created via bulk upload. Please log in using the temporary password below:`,
        );
        console.log(`Temporary Password: ${rawPassword}`);
        console.log(`Login Link: http://localhost:5173/login`);
        console.log(`-------------------------------\n`);

        results.success++;
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        const userEmail =
          typeof data?.email === 'string' ? data.email : 'Unknown';

        results.failed++;
        results.errors.push(
          `Error creating user ${userEmail}: ${errorMessage}`,
        );
      }
    }

    return results;
  }

  async findAll(departmentId?: string): Promise<User[]> {
    const query = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.department', 'department')
      .addSelect(['user.password_hash', 'user.provisioning_password']);

    if (departmentId) {
      query.where('department.id = :departmentId', { departmentId });
    }

    return await query.getMany();
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
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .leftJoinAndSelect('user.department', 'department')
      .where('user.email = :email', { email })
      .getOne();

    if (user) {
      console.log(
        `[UsersService] findByEmail: Found user ${email}, has password_hash: ${!!user.password_hash}`,
      );
    } else {
      console.log(`[UsersService] findByEmail: User ${email} NOT found`);
    }

    return user;
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

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findOne(id);
    user.status = status;
    return await this.userRepo.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    // Reset any assigned assets to 'IN_STOCK' before removing the user
    const assetRepo = this.dataSource.getRepository(Asset);
    await assetRepo.update(
      { assigned_to: { id } },
      {
        status: 'IN_STOCK',
        assigned_to: null,
      },
    );

    await this.userRepo.remove(user);
  }
}
