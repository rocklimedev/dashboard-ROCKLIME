import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { InjectModel as InjectMongooseModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as XLSX from 'xlsx';
import { Quotation } from '@/modules/quotation/models/quotation.model'; // adjust to your actual model path
import { QuotationItem } from '@/modules/quotation/models/quotation-item.model';
import { QuotationVersion } from '@/modules/quotation/models/quotation-version.model';
import { QuotationCalculationService } from '@/modules/quotation/services/quotation-calculation.service';

export interface QuotationExportResult {
  buffer: Buffer;
  filename: string;
}

@Injectable()
export class QuotationExportService {
  constructor(
    @InjectModel(Quotation)
    private readonly quotationModel: typeof Quotation,
    @InjectMongooseModel(QuotationItem.name)
    private readonly quotationItemModel: Model<QuotationItem>,
    @InjectMongooseModel(QuotationVersion.name)
    private readonly quotationVersionModel: Model<QuotationVersion>,
    private readonly calculationService: QuotationCalculationService,
  ) {}

  async export(
    quotationId: string,
    version?: number,
  ): Promise<QuotationExportResult> {
    let quotation: any;
    let quotationItems: any[] = [];
    let floors: any[] = [];

    if (version) {
      const versionData = await this.quotationVersionModel.findOne({
        quotationId,
        version: Number(version),
      });
      if (!versionData) throw new NotFoundException('Version not found');
      quotation = versionData.quotationData;
      quotationItems = versionData.quotationItems || [];
      floors = versionData.floors || quotation.floors || [];
    } else {
      quotation = await this.quotationModel.findByPk(quotationId);
      if (!quotation) throw new NotFoundException('Quotation not found');
      const itemsDoc = await this.quotationItemModel.findOne({ quotationId });
      quotationItems = itemsDoc ? (itemsDoc as any).items : [];
      floors = quotation.floors || [];
    }

    const { subTotal, totalItemDiscount, extraDiscountAmount, gstAmount } =
      this.calculationService.calculateTotals(
        quotationItems,
        quotation.extraDiscount || 0,
        quotation.extraDiscountType || 'percent',
        quotation.shippingAmount || 0,
        quotation.gst || 0,
      );

    const totalTax = 0; // line-level tax is currently always 0, kept for parity with the original sheet layout

    const finalTotal =
      subTotal +
      totalTax +
      (quotation.shippingAmount || 0) +
      gstAmount -
      totalItemDiscount -
      extraDiscountAmount +
      (quotation.roundOff || 0);

    const sheetData = this.buildSheetRows(quotation, quotationItems, floors, {
      subTotal,
      totalItemDiscount,
      extraDiscountAmount,
      gstAmount,
      totalTax,
      finalTotal,
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    worksheet['!cols'] = [
      { wch: 6 }, // S.No
      { wch: 25 }, // Image
      { wch: 35 }, // Name
      { wch: 15 }, // Code
      { wch: 12 }, // MRP
      { wch: 12 }, // Discount
      { wch: 12 }, // Rate
      { wch: 8 }, // Qty
      { wch: 14 }, // Total
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Quotation');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    const filename = `Quotation_${quotation.reference_number || quotationId}${version ? `_v${version}` : ''}.xlsx`;

    return { buffer, filename };
  }

  private buildSheetRows(
    quotation: any,
    quotationItems: any[],
    floors: any[],
    totals: {
      subTotal: number;
      totalItemDiscount: number;
      extraDiscountAmount: number;
      gstAmount: number;
      totalTax: number;
      finalTotal: number;
    },
  ): (string | number)[][] {
    const sheetData: (string | number)[][] = [
      ['Estimate / Quotation', '', '', '', 'GROHE / AMERICAN STANDARD'],
      [''],
      [
        'M/s',
        quotation.companyName ||
          quotation.customer?.name ||
          quotation.customerId ||
          'CUSTOMER NAME',
        '',
        'Date',
        quotation.quotation_date
          ? new Date(quotation.quotation_date).toLocaleDateString('en-IN')
          : new Date().toLocaleDateString('en-IN'),
      ],
      [
        'Address',
        quotation.shipTo || '—',
        '',
        'Quotation No',
        quotation.reference_number || '—',
      ],
      [''],
    ];

    const groupedItems: Record<string, Record<string, any[]>> = {};

    quotationItems.forEach((item) => {
      const floorId = item.floorId || 'no-floor';
      const floorName =
        item.floorName ||
        floors.find((f) => f.floorId === floorId)?.floorName ||
        'Unassigned Floor';
      const roomId = item.roomId || 'no-room';
      const roomName = item.roomName || 'Unassigned Room';

      const floorKey = `${floorId}|${floorName}`;
      if (!groupedItems[floorKey]) groupedItems[floorKey] = {};

      const roomKey = `${roomId}|${roomName}`;
      if (!groupedItems[floorKey][roomKey])
        groupedItems[floorKey][roomKey] = [];

      groupedItems[floorKey][roomKey].push(item);
    });

    const sortedFloorKeys = Object.keys(groupedItems).sort((a, b) => {
      const fa = floors.find((f) => f.floorId === a.split('|')[0]);
      const fb = floors.find((f) => f.floorId === b.split('|')[0]);
      return (fa?.sortOrder ?? 999) - (fb?.sortOrder ?? 999);
    });

    let rowIndex = 1;

    for (const floorKey of sortedFloorKeys) {
      const [, floorName] = floorKey.split('|');

      sheetData.push([`Floor: ${floorName}`, '', '', '', '', '', '', '', '']);

      const rooms = groupedItems[floorKey];
      const sortedRoomKeys = Object.keys(rooms);

      for (const roomKey of sortedRoomKeys) {
        const [, roomName] = roomKey.split('|');

        sheetData.push([`  Room: ${roomName}`, '', '', '', '', '', '', '', '']);

        sheetData.push([
          'S.No',
          'Product Image',
          'Product Name',
          'Product Code',
          'MRP',
          'Discount',
          'Rate',
          'Qty',
          'Total',
        ]);

        const roomItems = rooms[roomKey].sort(
          (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
        );
        roomItems.forEach((p) => {
          const discountDisplay = p.discount
            ? p.discountType === 'percent'
              ? `${Number(p.discount).toFixed(1)}%`
              : `₹${Number(p.discount).toFixed(2)}`
            : '—';

          sheetData.push([
            rowIndex++,
            p.imageUrl || 'N/A',
            p.name || '—',
            p.productCode || p.product_code || '—',
            Number(p.price * (1 + (p.discount || 0) / 100)).toFixed(2) || '—',
            discountDisplay,
            Number(p.price || p.total || 0).toFixed(2),
            Number(p.quantity || 1),
            Number(p.total || 0).toFixed(2),
          ]);
        });

        sheetData.push(['']);
      }

      sheetData.push(['']);
    }

    sheetData.push(['', '', '', '', '', '', 'Summary', '', '']);
    sheetData.push([
      '',
      '',
      '',
      '',
      '',
      '',
      'Subtotal',
      '',
      totals.subTotal.toFixed(2),
    ]);
    sheetData.push([
      '',
      '',
      '',
      '',
      '',
      '',
      'Item Discount',
      '',
      totals.totalItemDiscount.toFixed(2),
    ]);

    if (totals.extraDiscountAmount > 0) {
      sheetData.push([
        '',
        '',
        '',
        '',
        '',
        '',
        `Extra Discount ${quotation.extraDiscountType === 'percent' ? `(${quotation.extraDiscount}%)` : ''}`,
        '',
        totals.extraDiscountAmount.toFixed(2),
      ]);
    }

    sheetData.push([
      '',
      '',
      '',
      '',
      '',
      '',
      'Tax (if any)',
      '',
      totals.totalTax.toFixed(2),
    ]);
    sheetData.push([
      '',
      '',
      '',
      '',
      '',
      '',
      'Shipping Charges',
      '',
      (quotation.shippingAmount || 0).toFixed(2),
    ]);
    sheetData.push([
      '',
      '',
      '',
      '',
      '',
      '',
      'GST',
      '',
      totals.gstAmount.toFixed(2),
    ]);
    sheetData.push([
      '',
      '',
      '',
      '',
      '',
      '',
      'Round Off',
      '',
      (quotation.roundOff || 0).toFixed(2),
    ]);
    sheetData.push([
      '',
      '',
      '',
      '',
      '',
      '',
      'GRAND TOTAL',
      '',
      totals.finalTotal.toFixed(2),
    ]);

    return sheetData;
  }
}
