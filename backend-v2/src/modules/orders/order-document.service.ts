import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Response } from 'express';
import * as path from 'path';
import axios from 'axios';
import * as PDFDocument from 'pdfkit';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { Order } from './models/order.model';
import { Customer } from '../customer/models/customer.model';
import { Quotation } from '../quotation/models/quotation.model';
import { Address } from '../address/models/address.model';
import { Team } from '../users/models/team.model';
import { User } from '../users/models/user.model';
import { FtpService } from '@/modules/cdn/ftp.service';
import { OrderNotificationService } from './order-notification.service';
import { ActivityLogService } from '@/modules/engagement/services/activity-log.service';
import { Request } from 'express';

const pipe = promisify(pipeline);

/**
 * File-shaped concerns: invoice download proxy, gate-pass / invoice
 * uploads to FTP, generic document download, and the PDFKit order
 * summary export. Isolated because none of this touches order state
 * beyond a couple of link columns.
 */
@Injectable()
export class OrderDocumentService {
  constructor(
    @InjectModel(Order) private readonly orderModel: typeof Order,
    @InjectModel(Customer) private readonly customerModel: typeof Customer,
    private readonly ftp: FtpService,
    private readonly notify: OrderNotificationService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async downloadInvoice(orderId: string, res: Response) {
    const order = await this.orderModel.findByPk(orderId, {
      include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
      attributes: ['id', 'orderNo', 'invoiceLink'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.invoiceLink) {
      throw new NotFoundException('No invoice attached to this order');
    }

    const response = await fetch(order.invoiceLink);
    if (!response.ok) {
      throw new BadRequestException('Unable to retrieve invoice from storage');
    }

    const customerName = (order as any).customer?.name || 'Customer';
    const cleanName = customerName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 30);
    const filename = `INVOICE #${order.orderNo} for ${cleanName}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    await pipe(response.body as any, res);
  }

  async uploadInvoiceAndLink(
    orderId: string,
    file: Express.Multer.File,
    req?: Request,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const order = await this.orderModel.findByPk(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const fileUrl = await this.ftp.upload(file.buffer, file.originalname, {
      remoteDir: '/invoice_pdfs',
      chmod: '644',
    });

    const previousInvoice = order.invoiceLink;
    order.invoiceLink = fileUrl;
    await order.save();

    const customer = await this.customerModel.findByPk(order.createdFor);

    await this.activityLog.log({
      userId: (req as any)?.user?.userId || order.createdBy,
      contextTag: 'SALES',
      subContext: 'ORDER',
      action: 'UPLOAD_INVOICE',
      entityId: order.id,
      entityName: order.orderNo,
      description: `Invoice uploaded for Order ${order.orderNo}`,
      metadata: {
        orderNo: order.orderNo,
        invoiceLink: fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        previousInvoice: previousInvoice || null,
        replaced: !!previousInvoice,
        customerName: customer?.name || null,
      },
      req,
    });

    await this.notify.notifyInvoiceUploaded(
      order,
      customer?.name || 'Customer',
    );

    return { order, fileUrl, previousInvoice, replaced: !!previousInvoice };
  }

  async issueGatePass(
    orderId: string,
    file: Express.Multer.File,
    req?: Request,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const order = await this.orderModel.findByPk(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const fileUrl = await this.ftp.upload(file.buffer, file.originalname, {
      remoteDir: '/invoice_pdfs',
      chmod: '644',
    });

    const previousGatePass = order.gatePassLink;
    await order.update({ gatePassLink: fileUrl });

    const customer = await this.customerModel.findByPk(order.createdFor);

    await this.activityLog.log({
      userId: (req as any)?.user?.userId || order.createdBy,
      contextTag: 'SALES',
      subContext: 'ORDER',
      action: 'ISSUE_GATE_PASS',
      entityId: order.id,
      entityName: order.orderNo,
      description: `Gate-pass issued for Order ${order.orderNo}`,
      oldValues: { gatePassLink: previousGatePass || null },
      newValues: { gatePassLink: fileUrl },
      metadata: {
        orderNo: order.orderNo,
        customerName: customer?.name || null,
        fileUrl,
        fileName: file.originalname,
        fileSize: file.size,
        replaced: !!previousGatePass,
      },
      req,
    });

    await this.notify.notifyGatePassIssued(order, customer?.name || 'Customer');

    return { order, fileUrl, previousGatePass, replaced: !!previousGatePass };
  }

  async getDownloadDocument(
    orderId: string,
    type: 'invoice' | 'gatepass',
    res: Response,
  ) {
    if (!['invoice', 'gatepass'].includes(type)) {
      throw new BadRequestException('Invalid type');
    }

    const order = await this.orderModel.findByPk(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const fileUrl = type === 'invoice' ? order.invoiceLink : order.gatePassLink;
    if (!fileUrl) throw new NotFoundException(`${type} not available`);

    const filename = path.basename(fileUrl);
    const response = await axios.get(fileUrl, { responseType: 'stream' });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader(
      'Content-Type',
      response.headers['content-type'] || 'application/octet-stream',
    );

    response.data.pipe(res);
    return new Promise<void>((resolve, reject) => {
      response.data.on('end', () => {
        res.end();
        resolve();
      });
      response.data.on('error', (err: Error) => {
        reject(err);
      });
    });
  }

  async downloadOrderPdf(orderId: string, res: Response) {
    const order = await this.orderModel.findByPk(orderId, {
      include: [
        { model: Customer, as: 'customer', attributes: ['customerId', 'name'] },
        {
          model: User,
          as: 'creator',
          attributes: ['userId', 'username', 'name'],
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['userId', 'username', 'name'],
        },
        {
          model: User,
          as: 'secondaryUser',
          attributes: ['userId', 'username', 'name'],
        },
        { model: Team, as: 'assignedTeam', attributes: ['id', 'teamName'] },
        { model: Order, as: 'previousOrder', attributes: ['id', 'orderNo'] },
        { model: Order, as: 'masterOrder', attributes: ['id', 'orderNo'] },
        { model: Order, as: 'nextOrders', attributes: ['id', 'orderNo'] },
        { model: Order, as: 'pipelineOrders', attributes: ['id', 'orderNo'] },
        { model: Address, as: 'shippingAddress', attributes: ['addressId'] },
        {
          model: Quotation,
          as: 'quotation',
          attributes: [
            'quotationId',
            'document_title',
            'quotation_date',
            'due_date',
            'followupDates',
            'reference_number',
            'products',
            'discountAmount',
            'roundOff',
            'finalAmount',
            'signature_name',
            'signature_image',
            'createdBy',
            'customerId',
            'shipTo',
          ],
        },
      ],
    });
    if (!order) throw new NotFoundException('Order not found');

    const data: any = order.toJSON();
    const quotationProducts = data.quotation?.products || [];
    const products =
      data.products?.length > 0 ? data.products : quotationProducts;

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Order-${data.orderNo}.pdf`,
    );
    doc.pipe(res);

    doc.fontSize(22).text('ORDER SUMMARY', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Order No: ${data.orderNo}`);
    doc.text(`Quotation Ref: ${data.quotation?.reference_number || '-'}`);
    doc.text(`Status: ${data.status}`);
    doc.text(`Priority: ${data.priority}`);
    doc.text(`Created Date: ${new Date(data.createdAt).toLocaleDateString()}`);
    doc.text(
      `Due Date: ${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : '-'}`,
    );
    doc.moveDown();

    doc.fontSize(16).text('Customer Details');
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Customer: ${data.customer?.name || '-'}`);
    doc.text(
      `Created By: ${data.creator?.name || data.creator?.username || '-'}`,
    );
    doc.text(
      `Assigned User: ${data.assignedUser?.name || data.assignedUser?.username || '-'}`,
    );
    doc.text(`Assigned Team: ${data.assignedTeam?.teamName || '-'}`);
    doc.moveDown();

    doc.fontSize(16).text('Description');
    doc.moveDown(0.5);
    doc.fontSize(11).text(data.description || '-');
    doc.moveDown();

    doc.fontSize(16).text('Products');
    doc.moveDown();
    let y = doc.y;
    doc.fontSize(10);
    doc.text('#', 40, y);
    doc.text('Product', 70, y);
    doc.text('Qty', 320, y);
    doc.text('Price', 380, y);
    doc.text('Total', 470, y);
    y += 20;

    let grandTotal = 0;
    products.forEach((item: any, index: number) => {
      const total =
        Number(item.total) || Number(item.price) * Number(item.quantity);
      grandTotal += total;

      doc.text(String(index + 1), 40, y);
      doc.text(item.name || '-', 70, y, { width: 220 });
      doc.text(String(item.quantity || 0), 320, y);
      doc.text(`₹${Number(item.price || 0).toFixed(2)}`, 380, y);
      doc.text(`₹${total.toFixed(2)}`, 470, y);
      y += 25;

      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    });

    doc.moveDown(3);
    doc.fontSize(16).text('Financial Summary');
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Product Total : ₹${grandTotal.toFixed(2)}`);
    doc.text(`Quotation Amount : ₹${data.quotation?.finalAmount || 0}`);
    doc.text(`Shipping : ₹${data.shipping || 0}`);
    doc.text(`GST : ₹${data.gstValue || 0}`);
    doc.text(`Extra Discount : ₹${data.extraDiscountValue || 0}`);
    doc.moveDown();

    const finalAmount =
      data.finalAmount && Number(data.finalAmount) > 0
        ? data.finalAmount
        : data.quotation?.finalAmount || 0;

    doc
      .fontSize(14)
      .text(`Final Amount : ₹${finalAmount}`, { underline: true });
    doc.text(`Amount Paid : ₹${data.amountPaid || 0}`);
    doc.moveDown(2);

    doc.fontSize(16).text('Order Relations');
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Master Order : ${data.masterOrder?.orderNo || '-'}`);
    doc.text(`Previous Order : ${data.previousOrder?.orderNo || '-'}`);
    doc.text(
      `Next Orders : ${
        data.nextOrders?.length
          ? data.nextOrders.map((o: any) => o.orderNo).join(', ')
          : '-'
      }`,
    );
    doc.moveDown(2);

    doc
      .fontSize(10)
      .fillColor('gray')
      .text(`Generated on ${new Date().toLocaleString()}`, { align: 'right' });

    doc.end();
  }
}
