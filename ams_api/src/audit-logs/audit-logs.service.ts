import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "./entities/audit-log.entity";
import { CreateAuditLogDto } from "./dto/create-audit-log.dto";

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) { }

  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    const logEntry = this.auditRepo.create(dto);
    return await this.auditRepo.save(logEntry);
  }

  async findAll(): Promise<AuditLog[]> {
    return await this.auditRepo.find({
      order: { timestamp: 'DESC' },
      take: 100,
    });
  }

  async findByRecord(record_id: string): Promise<AuditLog[]> {
    return await this.auditRepo.find({
      where: { record_id },
      order: { timestamp: 'DESC' },
    });
  }
}