import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

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
    console.log(`[AuthService] Verifying password against hash...`);
    const isPasswordValid = await bcrypt.compare(pass, user.password_hash);
    console.log(`[AuthService] Password valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
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
