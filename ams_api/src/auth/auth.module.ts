import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { MailModule } from 'src/mail/mail.module';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    UsersModule,
    MailModule,
    NotificationsModule,
    JwtModule.register({
      global: true,
      secret: 'HISP_RWANDA_AMS_SUPER_SECRET_KEY_2026',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule { }
