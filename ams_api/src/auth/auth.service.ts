import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { UserStatus } from 'src/users/entities/user.entity';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService,
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

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      // Don't reveal if user exists for security, but we'll log it
      console.warn(
        `[AuthService] Password reset requested for non-existent email: ${email}`,
      );
      return {
        message:
          'If an account exists with this email, you will receive reset instructions.',
      };
    }

    const tempPassword = this.generateTempPassword();
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    await this.usersService.updatePassword(
      user.id,
      hashedPassword,
      tempPassword,
      true,
    );

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const subject = 'Password Reset - HISP Asset Management System';
    const text = `Hello ${user.full_name},\n\nYou requested a password reset. Please use the temporary password below to log in:\n\nTemporary Password: ${tempPassword}\n\nLogin Link: ${frontendUrl}/login\n\nPlease change your password immediately after logging in.`;
    const html = `<p>Hello ${user.full_name},</p><p>You requested a password reset. Please use the temporary password below to log in:</p><p><strong>Temporary Password:</strong> ${tempPassword}</p><p><a href="${frontendUrl}/login">Login Here</a></p><p>Please change your password immediately after logging in.</p>`;

    await this.mailService.sendMail(user.email, subject, text, html);

    return {
      message:
        'If an account exists with this email, you will receive reset instructions.',
    };
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
}
