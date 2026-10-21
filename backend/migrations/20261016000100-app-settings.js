'use strict';

/**
 * App settings (company details printed on documents, quotation defaults)
 * and the HSN Code product field used on quotations and invoices.
 * Safe to run more than once.
 */
const { randomUUID } = require('crypto');

const DEFAULTS = {
  company: {
    name: 'CM Trading Co.',
    brandName: 'Chhabra Marble', // printed on quotations and gate passes
    legalName: 'Chhabra Marble Trading Co.',
    gstin: '',
    pan: '',
    address: '487/65, National Market, Peera Garhi, Delhi 110087',
    state: 'Delhi',
    stateCode: '07',
    phone: '099110 80605',
    email: '',
    website: 'www.cmtradingco.com',
    bankName: '',
    bankAccountName: '',
    bankAccountNo: '',
    bankIfsc: '',
    bankBranch: '',
    upiId: '',
    summaryEmails: '', // daily 8 pm summary, comma-separated
  },
  quotation: {
    validityDays: 30,
    defaultGstRate: 18,
    paymentTerms: '50% advance with order, balance before dispatch.',
    deliveryNote:
      'In-stock items dispatch within 2–3 working days; others as per the delivery estimate.',
    // {validityDays}, {validTill}, {gst} and {company} are filled in on the PDF
    keyTerms: [
      'This quotation is valid for {validityDays} days, until {validTill}.',
      '100% advance payment is required to confirm the order. Quoted rates apply only once full payment is received.',
      'On partial advance, only the discount percentages are locked; MRPs applicable on the billing date will apply.',
      'Delivery within 7–10 working days of confirmed PO and payment, subject to stock availability.',
      "Delivery and unloading charges are borne by the buyer. Any damage at site during or after unloading is the buyer's responsibility.",
      'Any change in products or quantities may revise the quoted discounts.',
    ],
    includes: [
      'All products listed, in original brand packaging',
      'Item-wise discounts as stated in this quotation',
      'GST @ {gst}%',
      "Manufacturer's standard warranty, as per brand policy",
    ],
    excludes: [
      'Delivery, transport and unloading at site',
      'Installation, plumbing and fixing labour',
      'Civil, tiling and waterproofing work',
      'Electrical work for steam generators (wiring, MCB, power point)',
      'Steam enclosure, glass partitions, doors and sealing',
      'Pipes, fittings and accessories not listed above',
    ],
    coverImage: '', // blank = the standard cover photo
    defaultStyle: 'detailed',
    showCoverPage: true,
  },
  // Purchase orders (printed on the PO)
  purchase: {
    paymentTerms: 'Payment within 30 days of delivery against invoice.',
    deliveryTerms:
      'Deliver to the godown address above, freight paid, with invoice and packing list.',
    terms: [
      'Quote this PO number on your invoice, delivery challan and every box.',
      'Supply exactly as ordered: brand, code, finish and quantity. Changes need our written approval.',
      'Goods are received after counting and inspection; short, damaged or wrong items will be returned at your cost.',
      'Invoice with our GSTIN and the HSN code of every item.',
      'Deliver by the expected date; inform us at once of any delay.',
    ],
  },
  // GST invoices and the Tally export (read with defaults; no row needed)
  accounts: {
    invoicePrefix: 'CM',
    invoiceTerms: [
      'Goods once sold will not be taken back except for manufacturing defects.',
      'Interest at 18% p.a. is charged on payments overdue beyond 30 days.',
      'Subject to Delhi jurisdiction.',
    ],
    tallySalesLedger: 'Sales',
    tallyCgstLedger: 'Output CGST',
    tallySgstLedger: 'Output SGST',
    tallyIgstLedger: 'Output IGST',
    tallyFreightLedger: 'Freight Charges',
    tallyRoundOffLedger: 'Round Off',
    tallyCashLedger: 'Cash',
    tallyBankLedger: 'Bank',
  },
  // CRM app and its Zoho Bigin link
  crm: {
    sources: [
      'Walk-in',
      'Referral',
      'Architect',
      'Interior designer',
      'Builder',
      'Website',
      'Instagram',
      'Google',
      'IndiaMART',
      'Existing customer',
      'Zoho Bigin',
      'Other',
    ],
    stuckAfterDays: 10,
    biginSubPipeline: 'Sales Pipeline', // the Bigin pipeline deals go to
    // CM stage → Bigin stage (Bigin's default "Sales Pipeline" names)
    stageMap: {
      capture: 'Qualification',
      qual: 'Qualification',
      visit: 'Needs Analysis',
      quote: 'Proposal/Price Quote',
      nego: 'Negotiation/Review',
      won: 'Closed Won',
      nurture: 'Qualification',
      lost: 'Closed Lost',
    },
    autoSync: true, // pull changes from Bigin every 15 minutes while connected
  },
};

module.exports = {
  async up(queryInterface) {
    const Sequelize = require('sequelize');
    const { DataTypes } = Sequelize;
    const tables = await queryInterface.showAllTables();
    if (!tables.map((t) => (typeof t === 'string' ? t : t.tableName)).includes('app_settings')) {
      await queryInterface.createTable('app_settings', {
        key: { type: DataTypes.STRING(64), primaryKey: true, allowNull: false },
        value: { type: DataTypes.TEXT('long'), allowNull: false },
        updatedBy: { type: DataTypes.CHAR(36), allowNull: true },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
    }
    for (const [key, value] of Object.entries(DEFAULTS)) {
      await queryInterface.sequelize.query(
        'INSERT IGNORE INTO app_settings (`key`, value, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())',
        { replacements: [key, JSON.stringify(value)] },
      );
    }
    // HSN Code product field (read by slug "hsnCode")
    const [hsn] = await queryInterface.sequelize.query(
      "SELECT id FROM product_metas WHERE slug = 'hsnCode' OR LOWER(title) IN ('hsn', 'hsn code') LIMIT 1",
    );
    if (!hsn.length) {
      await queryInterface.sequelize.query(
        "INSERT INTO product_metas (id, title, slug, fieldType, unit, createdAt) VALUES (?, 'HSN Code', 'hsnCode', 'string', NULL, NOW())",
        { replacements: [randomUUID()] },
      );
    }
  },
  DEFAULTS,
};
