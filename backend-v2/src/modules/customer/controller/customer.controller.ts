const { sendNotification } = require('./notificationController'); // Import sendNotification
const { Customer } = require('../models');
const ADMIN_USER_ID = '2ef0f07a-a275-4fe1-832d-fe9a5d145f60'; // Replace with actual admin user ID or channel
const { Op } = require('sequelize');
const { ActivityLog } = require('../models');
const logActivity = require('../utils/activityLogger');
// Create a new customer
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
    const allowedTypes = [
      'Retail',
      'Architect',
      'Interior',
      'Builder',
      'Contractor',
    ];
    if (
      req.body.customerType &&
      !allowedTypes.includes(req.body.customerType)
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid customerType. Must be one of: ${allowedTypes.join(
          ', ',
        )}`,
      });
    }

    const newCustomer = await Customer.create({
      ...req.body,
      phone2: req.body.phone2 || null,
      customerType: req.body.customerType || null,
      gstNumber: req.body.gstNumber || null,
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
      data: newCustomer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get all customers (no notification needed)

exports.getCustomers = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clause
    const where = {};

    // Search by name, email, or phone (use LIKE – case-insensitive in MySQL ci collation)
    const search = req.query.search?.trim();
    if (search) {
      const searchTerm = `%${search}%`;
      where[Op.or] = [
        { name: { [Op.like]: searchTerm } },
        { email: { [Op.like]: searchTerm } },
        { mobileNumber: { [Op.like]: searchTerm } },
        // Add more fields if needed, e.g.:
        // { companyName: { [Op.like]: searchTerm } },
      ];
    }

    // Optional: Add customerType filter later if you want server-side
    // if (req.query.customerType && req.query.customerType !== "All") {
    //   where.customerType = req.query.customerType;
    // }

    // Fetch paginated customers
    const { count: totalCustomers, rows: customers } =
      await Customer.findAndCountAll({
        where,
        offset,
        limit,
        order: [['name', 'ASC']], // or [["createdAt", "DESC"]]
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        subQuery: false,
      });

    const totalPages = Math.ceil(totalCustomers / limit);

    return res.status(200).json({
      success: true,
      data: customers.map((customer) => customer.toJSON()),
      pagination: {
        total: totalCustomers,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Failed to fetch customers',
    });
  }
};

// Get a single customer by ID (no notification needed)
exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' });
    }

    const allowedTypes = [
      'Retail',
      'Architect',
      'Interior',
      'Builder',
      'Contractor',
    ];

    if (
      req.body.customerType &&
      !allowedTypes.includes(req.body.customerType)
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid customerType. Must be one of: ${allowedTypes.join(', ')}`,
      });
    }

    // ✅ Capture OLD values BEFORE update
    const oldValues = customer.get({ plain: true });

    // Update customer
    await customer.update({
      ...req.body,
      phone2: req.body.phone2 !== undefined ? req.body.phone2 : customer.phone2,
      customerType:
        req.body.customerType !== undefined
          ? req.body.customerType
          : customer.customerType,
      gstNumber:
        req.body.gstNumber !== undefined
          ? req.body.gstNumber
          : customer.gstNumber,
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
      data: customer,
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
      return res
        .status(404)
        .json({ success: false, message: 'Customer not found' });
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
      },

      metadata: {
        deletedBy: req.user?.userId || null,
      },

      req,
    }).catch(console.error);
    res
      .status(200)
      .json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
