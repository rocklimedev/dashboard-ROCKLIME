import { Injectable } from '@nestjs/common';
import { NotificationService } from '../../common/notification/notification.service';
import { Order } from './models/order.model';

/**
 * All the order-flavoured notification copy (create / update / status /
 * delete / team / invoice / gate-pass), built on top of the generic
 * NotificationService so message wording lives in one place instead of
 * being duplicated across every controller action.
 */
@Injectable()
export class OrderNotificationService {
  constructor(private readonly notifications: NotificationService) {}

  private stakeholders(order: Order) {
    return [order.createdBy, order.assignedUserId, order.secondaryUserId];
  }

  async notifyCreated(order: Order, customerName: string, creatorName: string) {
    await this.notifications.sendMany(
      [order.createdBy, order.assignedUserId, order.secondaryUserId],
      `New Order #${order.orderNo}`,
      `Order #${order.orderNo} created for ${customerName}.`,
    );
    await this.notifications.send({
      userId: this.notifications.ADMIN_USER_ID,
      title: `New Order #${order.orderNo}`,
      message: `Order #${order.orderNo} created by ${creatorName} for ${customerName}.`,
    });
  }

  async notifyUpdated(
    order: Order,
    customerName: string,
    addressSuffix: string,
    updatedBy: string,
  ) {
    await this.notifications.sendMany(
      this.stakeholders(order),
      `Order Updated #${order.orderNo}`,
      `Order #${order.orderNo} for ${customerName}${addressSuffix} updated.`,
    );
    await this.notifications.send({
      userId: this.notifications.ADMIN_USER_ID,
      title: `Order #${order.orderNo} Updated`,
      message: `Order updated by ${updatedBy}.`,
    });
  }

  async notifyStatusChanged(
    order: Order,
    customerName: string,
    oldStatus: string,
    newStatus: string,
  ) {
    await this.notifications.sendMany(
      this.stakeholders(order),
      `Order Status #${order.orderNo}`,
      `Order #${order.orderNo} for ${customerName} → ${newStatus}.`,
    );
    await this.notifications.send({
      userId: this.notifications.ADMIN_USER_ID,
      title: `Order Status #${order.orderNo}`,
      message: `Order #${order.orderNo} changed from ${oldStatus} → ${newStatus}.`,
    });
  }

  async notifyDeleted(order: Order, customerName: string) {
    await this.notifications.sendMany(
      this.stakeholders(order),
      `Order Deleted #${order.orderNo}`,
      `Order #${order.orderNo} for ${customerName} deleted.`,
    );
    await this.notifications.send({
      userId: this.notifications.ADMIN_USER_ID,
      title: `Order Deleted #${order.orderNo}`,
      message: `Order #${order.orderNo} deleted.`,
    });
  }

  async notifyTeamUpdated(
    order: Order,
    customerName: string,
    addressSuffix: string,
    newTeamMemberIds: string[],
  ) {
    await this.notifications.sendMany(
      this.stakeholders(order),
      `Order Team Updated #${order.orderNo}`,
      `The team for order #${order.orderNo} for ${customerName}${addressSuffix} has been updated.`,
    );
    await this.notifications.send({
      userId: this.notifications.ADMIN_USER_ID,
      title: `Order Team Updated #${order.orderNo}`,
      message: `The team for order #${order.orderNo} for ${customerName}${addressSuffix} has been updated.`,
    });
    if (newTeamMemberIds.length) {
      await Promise.all(
        newTeamMemberIds.map((userId) =>
          this.notifications.send({
            userId,
            title: `Order Assigned to Team #${order.orderNo}`,
            message: `Order #${order.orderNo} has been assigned to your team for ${customerName}${addressSuffix}.`,
          }),
        ),
      );
    }
  }

  async notifyInvoiceUploaded(order: Order, customerName: string) {
    await this.notifications.sendMany(
      this.stakeholders(order),
      `Invoice Uploaded for Order #${order.orderNo}`,
      `An invoice has been uploaded for order #${order.orderNo} for ${customerName}.`,
    );
    await this.notifications.send({
      userId: this.notifications.ADMIN_USER_ID,
      title: `Invoice Uploaded for Order #${order.orderNo}`,
      message: `An invoice has been uploaded for order #${order.orderNo} for ${customerName}.`,
    });
  }

  async notifyGatePassIssued(order: Order, customerName: string) {
    await this.notifications.sendMany(
      this.stakeholders(order),
      `Gate-Pass Issued #${order.orderNo}`,
      `Gate-pass uploaded for order #${order.orderNo} – ${customerName}.`,
    );
    await this.notifications.send({
      userId: this.notifications.ADMIN_USER_ID,
      title: `Gate-Pass Issued #${order.orderNo}`,
      message: `Gate-pass uploaded for order #${order.orderNo}.`,
    });
  }

  async notifyDraftCreated(
    orderNo: string | number,
    assignedTeamId: string,
    teamMembers: Array<{ userId: string }>,
  ) {
    await this.notifications.send({
      userId: this.notifications.ADMIN_USER_ID,
      title: `Draft Order #${orderNo}`,
      message: `Draft order #${orderNo} created.`,
    });
    await Promise.all(
      teamMembers.map((m) =>
        this.notifications.send({
          userId: m.userId,
          title: `Draft Assigned #${orderNo}`,
          message: `Draft order #${orderNo} assigned to your team.`,
        }),
      ),
    );
  }
}
