const { Sequelize } = require("sequelize");
const { DataTypes } = require("sequelize");
const { INVOICE_STATUS } = require("../config/constant");

// Set up a test database using SQLite (in-memory)
const sequelize = new Sequelize("sqlite::memory:", { logging: false });

// Define the Customer model
const Customer = sequelize.define(
  "Customer",
  {
    customerId: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), unique: true, allowNull: false },
    mobileNumber: { type: DataTypes.STRING(20), allowNull: false },
    companyName: { type: DataTypes.STRING(150), allowNull: true },
    address: { type: DataTypes.JSON, allowNull: true },
    quotations: { type: DataTypes.JSON, allowNull: true },
    invoices: { type: DataTypes.JSON, allowNull: true },
    isVendor: { type: DataTypes.BOOLEAN, defaultValue: false },
    vendorId: { type: DataTypes.UUID, allowNull: true },
    totalAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
    paidAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
    balance: { type: DataTypes.FLOAT, defaultValue: 0 },
    dueDate: { type: DataTypes.DATE, allowNull: true },
    paymentMode: { type: DataTypes.STRING(50), allowNull: true },
    invoiceStatus: {
      type: DataTypes.ENUM(...Object.values(INVOICE_STATUS)),
      allowNull: true,
    },
  },
  { timestamps: true }
);

// Jest test suite
describe("Customer Model Test", () => {
  // Setup database before running tests
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  // Test inserting a customer
  test("Should create a new customer", async () => {
    const newCustomer = await Customer.create({
      name: "John Doe",
      email: "johndoe@example.com",
      mobileNumber: "9876543210",
      companyName: "Doe Enterprises",
      address: { street: "123 Main St", city: "New York" },
      quotations: ["a1b2c3d4-e5f6-7890-1234-56789abcdef0"], // UUIDs as JSON array
      invoices: ["z9y8x7w6-v5u4-3210-0987-abcdef123456"],
      isVendor: false,
      totalAmount: 5000,
      paidAmount: 2000,
      balance: 3000,
      dueDate: new Date("2025-03-01"),
      paymentMode: "Credit Card",
      invoiceStatus: "Partially Paid",
    });

    expect(newCustomer).toBeDefined();
    expect(newCustomer.name).toBe("John Doe");
    expect(newCustomer.email).toBe("johndoe@example.com");
    expect(newCustomer.balance).toBe(3000);
  });

  // Test retrieving a customer
  test("Should retrieve a customer by email", async () => {
    const customer = await Customer.findOne({
      where: { email: "johndoe@example.com" },
    });

    expect(customer).toBeDefined();
    expect(customer.name).toBe("John Doe");
  });

  // Cleanup after tests
  afterAll(async () => {
    await sequelize.close();
  });
});
