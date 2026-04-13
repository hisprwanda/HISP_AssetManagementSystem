import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}
  async notifyCEODecision(params: {
    status: 'CEO_APPROVED' | 'REJECTED';
    requestId: string;
    requestTitle: string;
    requestedById: string;
    departmentId: string;
    ceoRemarks?: string;
  }): Promise<void> {
    const {
      status,
      requestId,
      requestTitle,
      requestedById,
      departmentId,
      ceoRemarks,
    } = params;
    const isApproved = status === 'CEO_APPROVED';

    const allUsers = await this.userRepo.find({ relations: ['department'] });

    const recipients: { user: User; role: 'staff' | 'hod' | 'admin' }[] = [];

    for (const user of allUsers) {
      const roleUpper = user.role.toUpperCase();
      const isAdmin =
        roleUpper.includes('SYSTEM_ADMIN') ||
        roleUpper.includes('ADMIN') ||
        roleUpper.includes('FINANCE') ||
        roleUpper === 'ADMIN AND FINANCE DIRECTOR';
      const isHOD = roleUpper.includes('HOD') || roleUpper.includes('HEAD OF');
      const isCEO =
        roleUpper.includes('OFFICE OF THE CEO') || roleUpper === 'CEO';

      if (isCEO) continue;

      if (user.id === requestedById) {
        recipients.push({ user, role: 'staff' });
      } else if (isHOD && user.department?.id === departmentId) {
        recipients.push({ user, role: 'hod' });
      } else if (isAdmin) {
        recipients.push({ user, role: 'admin' });
      }
    }

    const notifications = recipients.map(({ user, role }) => {
      let title: string;
      let message: string;

      const remarksNote = ceoRemarks ? ` CEO Remarks: "${ceoRemarks}".` : '';

      if (role === 'staff') {
        title = isApproved
          ? `Your request has been approved!`
          : `Your request has been declined.`;
        message = isApproved
          ? `The CEO has approved your procurement request for "${requestTitle}". Administration will now coordinate the purchase.${remarksNote}`
          : `The CEO has declined your procurement request for "${requestTitle}". Please contact your HOD for further guidance.${remarksNote}`;
      } else if (role === 'hod') {
        title = isApproved
          ? `CEO Approved: ${requestTitle}`
          : `CEO Declined: ${requestTitle}`;
        message = isApproved
          ? `The CEO has approved the procurement request "${requestTitle}" from your directorate. Administration is coordinating the fulfilment.${remarksNote}`
          : `The CEO has declined the procurement request "${requestTitle}" from your directorate. Please inform the requester of this decision.${remarksNote}`;
      } else {
        title = isApproved
          ? `Procurement Approved — Action Required`
          : `Procurement Declined by CEO`;
        message = isApproved
          ? `The CEO has approved the request "${requestTitle}". Please proceed with purchasing and mark it as FULFILLED when complete.${remarksNote}`
          : `The CEO has declined the request "${requestTitle}". No further procurement action is required.${remarksNote}`;
      }

      return this.notifRepo.create({
        recipient: { id: user.id } as User,
        title,
        message,
        type: isApproved ? 'CEO_APPROVED' : 'CEO_REJECTED',
        request_id: requestId,
        request_title: requestTitle,
        is_read: false,
      });
    });

    await this.notifRepo.save(notifications);
  }

  async getForUser(userId: string): Promise<Notification[]> {
    return this.notifRepo.find({
      where: { recipient: { id: userId } },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async markRead(notificationId: string, userId: string): Promise<void> {
    await this.notifRepo.update(
      { id: notificationId, recipient: { id: userId } },
      { is_read: true },
    );
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notifRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ is_read: true })
      .where('recipient_id = :userId', { userId })
      .execute();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifRepo.count({
      where: { recipient: { id: userId }, is_read: false },
    });
  }
}
