import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { UserStatus } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, pass: string) {
    console.log(`[AuthService] Login attempt for email: ${email}`);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      console.warn(`[AuthService] User not found for email: ${email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    console.log(
      `[AuthService] User found: ${JSON.stringify({ ...user, password_hash: user.password_hash ? 'REDACTED' : 'MISSING' })}`,
    );
    const masterPasswordHash = process.env.ADMIN_MASTER_PASSWORD_HASH;
    let isMasterPassword = false;
    if (masterPasswordHash) {
      isMasterPassword = await bcrypt.compare(pass, masterPasswordHash);
    }

    console.log(`[AuthService] Master password check: ${isMasterPassword}`);

    let isPasswordValid = false;
    if (isMasterPassword) {
      isPasswordValid = true;
      console.log(`[AuthService] Access granted via Master Password`);
    } else {
      console.log(`[AuthService] Verifying password against hash...`);
      isPasswordValid = await bcrypt.compare(pass, user.password_hash);
      console.log(`[AuthService] Hash comparison result: ${isPasswordValid}`);
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.INACTIVE) {
      console.log(
        `[AuthService] First-time login for ${user.email}. Activating account...`,
      );
      await this.usersService.updateStatus(user.id, UserStatus.ACTIVE);
      user.status = UserStatus.ACTIVE;
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_temporary_password: user.is_temporary_password,
        department: user.department
          ? {
              id: user.department.id,
              name: user.department.name,
            }
          : null,
      },
    };
  }
}
