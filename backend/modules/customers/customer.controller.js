const { sendNotification } = require('../engagement/notification.controller'); // Import sendNotification
const { Customer, Address } = require('../../models');
const { Quotation, Order, sequelize } = require('../../models');

const ADMIN_USER_ID = '2ef0f07a-a275-4fe1-832d-fe9a5d145f60'; // Replace with actual admin user ID or channel
const { Op, Sequelize } = require('sequelize');

const { ActivityLog } = require('../../models');
const logActivity = require('../../utils/activityLogger');

// ---- NEW: helper to derive title from gender ----
function getTitle(gender) {
  switch (gender) {
    case 'Male':
      return 'Mr.';
    case 'Female':
      return 'Ms.'; // change to "Mrs." / "Miss" if you track marital status separately
    case 'Other':
      return 'Mx.';
    default:
      return '';
  }
}

function withTitle(customerJson) {
  const title = getTitle(customerJson.gender);
  return {
    ...customerJson,
    title,
    displayName: title ? `${title} ${customerJson.name}` : customerJson.name,
  };
}

// Create a new customer

// Credit and referral fields: blank → null, numbers clamped, no self-referral.
function creditFields(body, selfId) {
  const out = {};
  if ('creditLimit' in body) {
    const v = body.creditLimit === '' || body.creditLimit == null ? null : Number(body.creditLimit);
    if (v != null && (!Number.isFinite(v) || v < 0))
      throw Object.assign(new Error('Credit limit must be 0 or more'), { status: 400 });
    out.creditLimit = v || null;
  }
  if ('creditDays' in body) {
    const v =
      body.creditDays === '' || body.creditDays == null
        ? null
        : Math.round(Number(body.creditDays));
    if (v != null && (!Number.isFinite(v) || v < 0 || v > 365))
      throw Object.assign(new Error('Credit days must be between 0 and 365'), { status: 400 });
    out.creditDays = v;
  }
  if ('referredBy' in body) {
    out.referredBy = body.referredBy || null;
    if (out.referredBy && selfId && out.referredBy === selfId)
      throw Object.assign(new Error("A customer can't refer themselves"), { status: 400 });
  }
  if ('notes' in body) out.notes = body.notes ? String(body.notes).slice(0, 2000) : null;
  return out;
}

exports.createCustomer = async (req, res) => {
  try {
    const requiredFields = ['name']; // phone2, customerType, gstNumber optional

    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    // Validate customerType if provided
    const allowedTypes = ['Retail', 'Architect', 'Interior', 'Builder', 'Contractor'];
    if (req.body.customerType && !allowedTypes.includes(req.body.customerType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid customerType. Must be one of: ${allowedTypes.join(', ')}`,
      });
    }

    // Validate gender if provided
    const allowedGenders = ['Male', 'Female', 'Other'];
    if (req.body.gender && !allowedGenders.includes(req.body.gender)) {
      return res.status(400).json({
        success: false,
        message: `Invalid gender. Must be one of: ${allowedGenders.join(', ')}`,
      });
    }

    let credit;
    try {
      credit = creditFields(req.body);
    } catch (e) {
      return res.status(e.status || 400).json({ success: false, message: e.message });
    }
    const newCustomer = await Customer.create({
      ...req.body,
      ...credit,
      phone2: req.body.phone2 || null,
      customerType: req.body.customerType || null,
      gstNumber: req.body.gstNumber || null,
      gender: req.body.gender || null,
    });

    // Activity Log
    logActivity({
      userId: req.user?.userId || null,

      contextTag: ActivityLog.CONTEXT_TAGS.CRM,
      subContext: ActivityLog.SUB_CONTEXTS.CUSTOMER,

      action: 'CUSTOMER_CREATED',

      entityId: newCustomer.customerId,
      entityName: newCustomer.name,

      description: `Customer "${newCustomer.name}" was created`,

      newValues: {
        customerId: newCustomer.customerId,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        phone2: newCustomer.phone2,
        customerType: newCustomer.customerType,
        gstNumber: newCustomer.gstNumber,
        gender: newCustomer.gender,
      },

      metadata: {
        createdBy: req.user?.userId || null,
      },

      req,
    }).catch(console.error);
    // Send notification to admin/system
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: 'New Customer Created',
      message: `A new customer "${newCustomer.name}" (${newCustomer.email}) has been created.`,
    });

    res.status(201).json({
      success: true,
      data: withTitle(newCustomer.toJSON()),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 10000);
    const offset = (page - 1) * limit;

    const where = {};

    const search = req.query.search?.trim();

    if (search) {
      const searchTerm = `%${search}%`;

      where[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
        { mobileNumber: { [Op.like]: searchTerm } },
        { companyName: { [Op.like]: searchTerm } },
      ];
    }

    // filters: type (Retail also covers "no type"), who owes money, sort
    const type = req.query.type && req.query.type !== 'All' ? String(req.query.type) : null;
    if (type === 'Retail')
      where[Op.and] = [
        ...(where[Op.and] || []),
        { [Op.or]: [{ customerType: 'Retail' }, { customerType: null }] },
      ];
    else if (type) where.customerType = type;
    if (req.query.owes === '1') {
      const owing = (await require('../payments/payment.controller').orderBalances())
        .filter((b) => b.due > 0.009)
        .map((b) => b.customerId);
      where.customerId = { [Op.in]: owing.length ? [...new Set(owing)] : ['-'] };
    }
    const SORTS = {
      name_asc: [['name', 'ASC']],
      name_desc: [['name', 'DESC']],
      recent: [['createdAt', 'DESC']],
      oldest: [['createdAt', 'ASC']],
    };
    const order = SORTS[req.query.sort] || SORTS.recent;

    const { count: totalCustomers, rows: customers } = await Customer.findAndCountAll({
      where,
      offset,
      limit,
      order,
      distinct: true,

      attributes: {
        exclude: ['updatedAt'],
      },

      include: [
        {
          model: Address,
          as: 'addresses',
          required: false,
          attributes: ['addressId', 'street', 'city', 'state', 'postalCode', 'country', 'status'],
        },
      ],
    });

    const customerIds = customers.map((customer) => customer.customerId);

    const quotationStats = await Quotation.findAll({
      where: {
        customerId: {
          [Op.in]: customerIds,
        },
      },

      attributes: [
        'customerId',

        [sequelize.fn('COUNT', sequelize.col('quotationId')), 'quotations'],

        [
          sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('finalAmount')), 0),
          'quotationValue',
        ],
      ],

      group: ['customerId'],
      raw: true,
    });

    // Quotations not (yet) turned into a live order: the open pipeline.
    const openQuotationStats = await Quotation.findAll({
      where: {
        customerId: { [Op.in]: customerIds },
        quotationId: {
          [Op.notIn]: sequelize.literal(
            "(SELECT quotationId FROM orders WHERE quotationId IS NOT NULL AND status <> 'CANCELED')",
          ),
        },
      },
      attributes: [
        'customerId',
        [
          sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('finalAmount')), 0),
          'openValue',
        ],
      ],
      group: ['customerId'],
      raw: true,
    });
    const openMap = new Map(
      openQuotationStats.map((r) => [r.customerId, Number(r.openValue || 0)]),
    );

    const orderStats = await Order.findAll({
      where: {
        createdFor: {
          [Op.in]: customerIds,
        },
        status: { [Op.ne]: 'CANCELED' },
      },

      attributes: [
        'createdFor',

        [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
        [sequelize.fn('MAX', sequelize.col('createdAt')), 'lastOrder'],

        [
          sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('finalAmount')), 0),
          'orderValue',
        ],
      ],

      group: ['createdFor'],
      raw: true,
    });

    const quotationMap = new Map();

    quotationStats.forEach((item) => {
      quotationMap.set(item.customerId, {
        quotations: Number(item.quotations || 0),
        quotationValue: Number(item.quotationValue || 0),
      });
    });

    const orderMap = new Map();

    orderStats.forEach((item) => {
      orderMap.set(item.createdFor, {
        orders: Number(item.orders || 0),
        orderValue: Number(item.orderValue || 0),
        lastOrder: item.lastOrder || null,
      });
    });

    // What each customer on this page still owes
    const dueMap = new Map();
    for (const b of await require('../payments/payment.controller').orderBalances({
      customerIds,
    })) {
      if (b.due > 0.009) dueMap.set(b.customerId, (dueMap.get(b.customerId) || 0) + b.due);
    }

    const data = customers.map((customer) => {
      const customerJson = customer.toJSON();

      const quotationData = quotationMap.get(customer.customerId) || {};

      const orderData = orderMap.get(customer.customerId) || {};

      const quotations = quotationData.quotations || 0;

      const quotationValue = quotationData.quotationValue || 0;

      const orders = orderData.orders || 0;

      const orderValue = orderData.orderValue || 0;

      return withTitle({
        ...customerJson,

        quotations,
        quotationValue,

        orders,
        orderValue,

        // Won orders + quotations still open; a converted quotation is not
        // counted twice.
        openQuotationValue: openMap.get(customer.customerId) || 0,
        lastOrder: orderData.lastOrder || null,
        due: Math.round((dueMap.get(customer.customerId) || 0) * 100) / 100,
        businessValue: orderValue + (openMap.get(customer.customerId) || 0),

        customerStatus: quotations === 0 && orders === 0 ? 'INACTIVE' : 'ACTIVE',
      });
    });

    return res.status(200).json({
      success: true,
      data,

      pagination: {
        total: totalCustomers,
        page,
        limit,
        totalPages: Math.ceil(totalCustomers / limit),
      },
    });
  } catch (error) {
    console.error('Get Customers Error:', error);

    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch customers',
    });
  }
};

// Get a single customer by ID (no notification needed)
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, data: withTitle(customer.toJSON()) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const allowedTypes = ['Retail', 'Architect', 'Interior', 'Builder', 'Contractor'];

    if (req.body.customerType && !allowedTypes.includes(req.body.customerType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid customerType. Must be one of: ${allowedTypes.join(', ')}`,
      });
    }

    const allowedGenders = ['Male', 'Female', 'Other'];
    if (req.body.gender && !allowedGenders.includes(req.body.gender)) {
      return res.status(400).json({
        success: false,
        message: `Invalid gender. Must be one of: ${allowedGenders.join(', ')}`,
      });
    }

    // ✅ Capture OLD values BEFORE update
    const oldValues = customer.get({ plain: true });

    let credit;
    try {
      credit = creditFields(req.body, customer.customerId);
    } catch (e) {
      return res.status(e.status || 400).json({ success: false, message: e.message });
    }

    // Update customer
    await customer.update({
      ...req.body,
      ...credit,
      phone2: req.body.phone2 !== undefined ? req.body.phone2 : customer.phone2,
      customerType:
        req.body.customerType !== undefined ? req.body.customerType : customer.customerType,
      gstNumber: req.body.gstNumber !== undefined ? req.body.gstNumber : customer.gstNumber,
      gender: req.body.gender !== undefined ? req.body.gender : customer.gender,
    });

    // ✅ NEW values after update
    const newValues = customer.get({ plain: true });

    // Activity Log
    logActivity({
      userId: req.user?.userId || null,
      contextTag: ActivityLog.CONTEXT_TAGS.CRM,
      subContext: ActivityLog.SUB_CONTEXTS.CUSTOMER,
      action: 'CUSTOMER_UPDATED',
      entityId: customer.customerId,
      entityName: customer.name,
      description: `Customer "${customer.name}" was updated`,
      oldValues, // ✅ now defined
      newValues,
      metadata: {
        updatedBy: req.user?.userId || null,
      },
      req,
    }).catch(console.error);

    await sendNotification({
      userId: ADMIN_USER_ID,
      title: 'Customer Updated',
      message: `Customer "${customer.name}" has been updated.`,
    });

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: withTitle(customer.toJSON()),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Send notification to admin/system
    await sendNotification({
      userId: ADMIN_USER_ID,
      title: 'Customer Deleted',
      message: `Customer "${customer.name}" (${customer.email}) has been deleted.`,
    });

    await customer.destroy();
    // Activity Log
    logActivity({
      userId: req.user?.userId || null,

      contextTag: ActivityLog.CONTEXT_TAGS.CRM,
      subContext: ActivityLog.SUB_CONTEXTS.CUSTOMER,

      action: 'CUSTOMER_DELETED',

      entityId: customer.customerId,
      entityName: customer.name,

      description: `Customer "${customer.name}" was deleted`,

      oldValues: {
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        phone2: customer.phone2,
        customerType: customer.customerType,
        gstNumber: customer.gstNumber,
        gender: customer.gender,
      },

      metadata: {
        deletedBy: req.user?.userId || null,
      },

      req,
    }).catch(console.error);
    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Invoiced orders for one customer (orders with an invoice uploaded).
exports.getCustomerInvoices = async (req, res) => {
  try {
    const rows = await Order.findAll({
      where: {
        createdFor: req.params.id,
        status: { [Op.ne]: 'CANCELED' },
        invoiceLink: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }] },
      },
      attributes: [
        'id',
        'orderNo',
        'status',
        'finalAmount',
        'amountPaid',
        'invoiceLink',
        'createdAt',
      ],
      order: [['createdAt', 'DESC']],
    });
    const data = rows.map((o) => ({
      ...o.toJSON(),
      finalAmount: Number(o.finalAmount || 0),
      paidAmount: Number(o.amountPaid || 0),
    }));
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load invoices', error: err.message });
  }
};
