import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DepartmentsModule } from './departments/departments.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { AssetsModule } from './assets/assets.module';
import { AssetAssignmentsModule } from './assets-assignments/assets-assignments.module';
import { AssetRequestsModule } from './assets-requests/assets-requests.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AssetIncidentsModule } from './asset-incidents/asset-incidents.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    DepartmentsModule,
    UsersModule,
    CategoriesModule,
    AssetsModule,
    AssetAssignmentsModule,
    AssetRequestsModule,
    AuditLogsModule,
    AssetIncidentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
