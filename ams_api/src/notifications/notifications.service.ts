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

  async notifyIncidentForwarded(params: {
    incidentId: string;
    assetName: string;
    adminRemarks: string;
  }): Promise<void> {
    const { assetName, adminRemarks } = params;

    const allUsers = await this.userRepo.find();
    const ceos = allUsers.filter((u) => {
      const roleUpper = u.role.toUpperCase();
      return (
        roleUpper.includes('CEO') || roleUpper.includes('OFFICE OF THE CEO')
      );
    });

    if (ceos.length === 0) return;

    const notifications = ceos.map((ceo) => {
      return this.notifRepo.create({
        recipient: { id: ceo.id } as User,
        title: 'Investigation Forwarded for Executive Review',
        message: `An incident involving "${assetName}" has been forwarded to your office for strategic review. Administrative Findings: "${adminRemarks}"`,
        type: 'INCIDENT',
        is_read: false,
      });
    });

    await this.notifRepo.save(notifications);
  }

  async notifyIncidentVerdict(params: {
    incidentId: string;
    resolution: 'ACCEPTED' | 'DENIED';
    assetName: string;
    reporterId: string;
    departmentId: string;
    remarks: string;
    isCEO: boolean;
  }): Promise<void> {
    const { resolution, assetName, reporterId, departmentId, remarks, isCEO } =
      params;
    const isAccepted = resolution === 'ACCEPTED';

    const allUsers = await this.userRepo.find({ relations: ['department'] });
    const recipients: { user: User; role: 'reporter' | 'hod' | 'admin' }[] = [];

    for (const user of allUsers) {
      const roleUpper = user.role.toUpperCase();
      const isAdmin =
        roleUpper.includes('SYSTEM_ADMIN') ||
        roleUpper.includes('ADMIN') ||
        roleUpper.includes('FINANCE') ||
        roleUpper === 'ADMIN AND FINANCE DIRECTOR';
      const isHOD = roleUpper.includes('HOD') || roleUpper.includes('HEAD OF');

      if (user.id === reporterId) {
        recipients.push({ user, role: 'reporter' });
      } else if (isHOD && user.department?.id === departmentId) {
        recipients.push({ user, role: 'hod' });
      } else if (isAdmin) {
        recipients.push({ user, role: 'admin' });
      }
    }

    const titlePrefix = isCEO ? 'Executive Verdict:' : 'Investigation Outcome:';
    const decisionText = isAccepted ? 'ACCEPTED' : 'DENIED';

    const notifications = recipients.map(({ user, role }) => {
      const title = `${titlePrefix} ${assetName} (${decisionText})`;
      let message: string;

      if (role === 'reporter') {
        message = isAccepted
          ? `Your report for "${assetName}" has been accepted. A replacement request has been automatically initiated.`
          : `Your report for "${assetName}" has been denied. A penalty equivalent to the asset's current value has been applied to your account.`;
      } else if (role === 'hod') {
        message = `Final decision on incident involving "${assetName}" in your department: ${decisionText}. Remarks: "${remarks}"`;
      } else {
        message = `The investigation for "${assetName}" has been finalized with a verdict of ${decisionText} by ${isCEO ? 'the CEO' : 'Administration'}.`;
      }

      return this.notifRepo.create({
        recipient: { id: user.id } as User,
        title,
        message,
        type: isAccepted ? 'INFO' : 'ALERT',
        is_read: false,
      });
    });

    await this.notifRepo.save(notifications);
  }

  async notifyFulfilment(params: {
    requestId: string;
    requestTitle: string;
    requestedById: string;
    departmentId: string;
  }): Promise<void> {
    const { requestId, requestTitle, requestedById, departmentId } = params;

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

      if (user.id === requestedById) {
        recipients.push({ user, role: 'staff' });
      } else if (isHOD && user.department?.id === departmentId) {
        recipients.push({ user, role: 'hod' });
      } else if (isAdmin) {
        recipients.push({ user, role: 'admin' });
      }
    }

    const notifications = recipients.map(({ user, role }) => {
      let title: string = `Asset Arrived: ${requestTitle}`;
      let message: string;

      if (role === 'staff') {
        message = `Good news! The asset you requested ("${requestTitle}") has arrived and been marked as fulfilled. Please wait for Administration to contact you for the official assignment form and pick-up.`;
      } else if (role === 'hod') {
        message = `Information: The asset requested by your department member ("${requestTitle}") has arrived at the facility. Administration is now processing the assignment.`;
      } else {
        title = `Action Required: Assign Arrived Asset`;
        message = `The request "${requestTitle}" has been fulfilled. You should now proceed to assign the asset to the requester and initiate the Digital Receipt Form.`;
      }

      return this.notifRepo.create({
        recipient: { id: user.id } as User,
        title,
        message,
        type: 'INFO',
        request_id: requestId,
        request_title: requestTitle,
        is_read: false,
      });
    });

    await this.notifRepo.save(notifications);
  }

  async notifyAssignmentAction(params: {
    action: 'SENT_TO_USER' | 'SIGNED_BY_USER' | 'REJECTED' | 'APPROVED';
    assignmentId: string;
    assetName: string;
    userId: string;
    rejectionReason?: string;
  }): Promise<void> {
    const { action, assetName, userId, rejectionReason } = params;

    const allUsers = await this.userRepo.find({ relations: ['department'] });
    const targetUser = allUsers.find((u) => u.id === userId);

    if (!targetUser) return;

    const admins = allUsers.filter((u) => {
      const roleUpper = u.role.toUpperCase();
      return (
        roleUpper.includes('ADMIN') ||
        roleUpper.includes('SYSTEM_ADMIN') ||
        roleUpper === 'ADMIN AND FINANCE DIRECTOR'
      );
    });

    let recipients: User[] = [];
    let title = '';
    let message = '';

    switch (action) {
      case 'SENT_TO_USER':
        recipients = [targetUser];
        title = 'Action Required: Sign Asset Receipt Form';
        message = `Administration has prepared your digital receipt form for "${assetName}". Please log in to your portal, review the details, and provide your digital signature.`;
        break;
      case 'SIGNED_BY_USER':
        recipients = admins;
        title = 'Form Signed: Review Required';
        message = `${targetUser.full_name} has signed the receipt form for "${assetName}". Please verify the signature and approve the assignment.`;
        break;
      case 'REJECTED':
        recipients = [targetUser];
        title = 'Receipt Form Rejected';
        message = `Your digital receipt for "${assetName}" has been rejected. Reason: "${rejectionReason || 'Details need correction'}". Please review the comments and sign again.`;
        break;
      case 'APPROVED':
        recipients = [targetUser];
        title = 'Asset Assignment Approved';
        message = `Your digital receipt for "${assetName}" has been verified and approved. You may now proceed with the physical pick-up if not already done.`;
        break;
    }

    const notifications = recipients.map((recipient) => {
      return this.notifRepo.create({
        recipient: { id: recipient.id } as User,
        title,
        message,
        type: 'INFO',
        is_read: false,
      });
    });

    await this.notifRepo.save(notifications);
  }

  async notifyPenaltyResolution(params: {
    incidentId: string;
    assetName: string;
    recipientId: string;
    amount: number;
    isResolved: boolean;
  }): Promise<void> {
    const { assetName, recipientId, amount, isResolved } = params;

    const title = isResolved
      ? 'Penalty Settled Successfully'
      : 'Penalty Status Updated';
    const message = isResolved
      ? `Your financial penalty of ${Number(amount).toLocaleString()} RWF for asset "${assetName}" has been officially settled. Your account is now clear regarding this incident.`
      : `The settlement status for the incident involving "${assetName}" has been updated by Administration. Please check your portal for current status.`;

    const notification = this.notifRepo.create({
      recipient: { id: recipientId } as User,
      title,
      message,
      type: 'INFO',
      is_read: false,
    });

    await this.notifRepo.save(notification);
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
