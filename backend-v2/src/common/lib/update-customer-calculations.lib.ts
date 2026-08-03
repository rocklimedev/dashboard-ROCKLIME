import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';

import { Customer } from '../models/customer.model';
import { Invoice } from '../models/invoice.model';
import { INVOICE_STATUS } from '../constants/invoice-status.constant';

@Injectable()
export class CustomerCalculationService {
  constructor(
    @InjectModel(Customer)
    private readonly customerModel: typeof Customer,

    @InjectModel(Invoice)
    private readonly invoiceModel: typeof Invoice,
  ) {}

  async recalculateCustomer(
    customerId: string,
    transaction?: Transaction,
  ): Promise<void> {
    const customer = await this.customerModel.findByPk(customerId, {
      transaction,
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const invoices = await this.invoiceModel.findAll({
      where: {
        customerId,
        status: {
          [Op.notIn]: ['refund', 'void'],
        },
      },
      attributes: ['amount', 'status', 'dueDate'],
      transaction,
    });

    let totalAmount = 0;
    let paidAmount = 0;
    let latestDueDate: Date | null = null;

    for (const invoice of invoices) {
      const amount = Number(invoice.amount);

      totalAmount += amount;

      if (
        invoice.status === INVOICE_STATUS.PAID ||
        invoice.status === INVOICE_STATUS.PARTIALLY_PAID
      ) {
        // Replace this with actual payment calculation if needed
        paidAmount += amount;
      }

      if (invoice.dueDate) {
        const dueDate = new Date(invoice.dueDate);

        if (!latestDueDate || dueDate > latestDueDate) {
          latestDueDate = dueDate;
        }
      }
    }

    const balance = totalAmount - paidAmount;

    let invoiceStatus = INVOICE_STATUS.DRAFT;

    if (totalAmount > 0 && totalAmount === paidAmount) {
      invoiceStatus = INVOICE_STATUS.PAID;
    } else if (paidAmount > 0) {
      invoiceStatus = INVOICE_STATUS.PARTIALLY_PAID;
    } else if (latestDueDate && latestDueDate < new Date()) {
      invoiceStatus = INVOICE_STATUS.OVERDUE;
    } else if (latestDueDate) {
      invoiceStatus = INVOICE_STATUS.UNDUE;
    }

    await customer.update(
      {
        totalAmount,
        paidAmount,
        balance,
        dueDate: latestDueDate,
        invoiceStatus,
      },
      {
        transaction,
      },
    );
  }
}