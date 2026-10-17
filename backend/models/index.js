require("dotenv").config();
const sequelize = require("../config/database");
const { DataTypes } = require("sequelize");

// -------------------------------
// 1️⃣ Import all Sequelize models
// -------------------------------
const User = require("../modules/users/models/users.model")(
  sequelize,
  DataTypes,
);

const Role = require("../modules/rbac/models/roles.model")(
  sequelize,
  DataTypes,
);

const Permission = require("../modules/rbac/models/permission.model")(
  sequelize,
  DataTypes,
);

const RolePermission = require("../modules/rbac/models/role-permission.model")(
  sequelize,
  DataTypes,
);

const Address = require("../modules/address/models/address.model")(
  sequelize,
  DataTypes,
);

const Team = require("../modules/users/models/team.model")(
  sequelize,
  DataTypes,
);

const TeamMember = require("../modules/users/models/team-member.model")(
  sequelize,
  DataTypes,
);

const ProductKeyword =
  require("../modules/products/models/product-keywords.model")(
    sequelize,
    DataTypes,
  );

const Product = require("../modules/products/models/product.model")(
  sequelize,
  DataTypes,
);

const ProductMeta = require("../modules/products/models/product-meta.model")(
  sequelize,
  DataTypes,
);

const Category = require("../modules/brands/models/category.model")(
  sequelize,
  DataTypes,
);

const ParentCategory =
  require("../modules/brands/models/parent-category.model")(
    sequelize,
    DataTypes,
  );

const Brand = require("../modules/brands/models/brand.model")(
  sequelize,
  DataTypes,
);

const Vendor = require("../modules/vendors/models/vendor.model")(
  sequelize,
  DataTypes,
);

const Keyword = require("../modules/brands/models/keyword.model")(
  sequelize,
  DataTypes,
);

const BrandParentCategory =
  require("../modules/brands/models/brand-parentcategory.model")(
    sequelize,
    DataTypes,
  );

const BrandParentCategoryBrand =
  require("../modules/brands/models/brand-parentcategory-brand.model")(
    sequelize,
    DataTypes,
  );

const ActivityLog = require("../modules/engagement/models/activity-log.model")(
  sequelize,
  DataTypes,
);

const Job = require("../modules/jobs/models/job.model")(sequelize, DataTypes);

const FieldGuidedSheet = require("../modules/purchase-order/models/fgs.model")(
  sequelize,
  DataTypes,
);

const InventoryHistory =
  require("../modules/products/models/inventory-history.model")(
    sequelize,
    DataTypes,
  );

const Customer = require("../modules/customers/models/customers.model")(
  sequelize,
  DataTypes,
);

const Quotation = require("../modules/quotations/models/quotation.model")(
  sequelize,
  DataTypes,
);

const Order = require("../modules/orders/models/orders.model")(
  sequelize,
  DataTypes,
);

const OrderDispatch = require("../modules/orders/models/order_dispatch.model")(
  sequelize,
  DataTypes,
);

const OrderActivity = require("../modules/orders/models/order_activity.model")(
  sequelize,
  DataTypes,
);

// ✅ NEW — Credit Note
const OrderCreditNote = require("../modules/orders/models/order_credit_note")(
  sequelize,
  DataTypes,
);

const OrderCreditNoteItem =
  require("../modules/orders/models/order_credit_note_item")(
    sequelize,
    DataTypes,
  );

const PurchaseOrder =
  require("../modules/purchase-order/models/purchaseorder.model")(
    sequelize,
    DataTypes,
  );

// Payments received against orders (Accounts)
const OrderPayment = require("../modules/payments/payment.model")(sequelize, DataTypes);

// GST tax invoices
const TaxInvoice = require("../modules/invoices/invoice.model")(sequelize, DataTypes);

// Quotation follow-up log (pipeline)
const QuotationFollowUp = require("../modules/quotations/followup.model")(sequelize, DataTypes);

// Stock engine
const StockModels = require("../modules/stock/models/stock.models")(
  sequelize,
  DataTypes,
);

// -------------------------------
// 2️⃣ Run associations if defined
// -------------------------------
[
  User,
  Role,
  Permission,
  FieldGuidedSheet,
  RolePermission,
  Address,
  Team,
  TeamMember,
  ProductKeyword,
  Product,
  ProductMeta,
  Category,
  ParentCategory,
  Job,
  Brand,
  Vendor,
  Keyword,
  BrandParentCategory,
  ActivityLog,
  BrandParentCategoryBrand,
  Customer,
  Quotation,
  Order,
  OrderDispatch,
  OrderActivity,

  // ✅ NEW
  OrderCreditNote,
  OrderCreditNoteItem,

  PurchaseOrder,
  InventoryHistory,
].forEach((model) => {
  if (typeof model.associate === "function") {
    model.associate({
      User,
      Role,
      Permission,
      RolePermission,
      Address,
      Team,
      TeamMember,
      FieldGuidedSheet,
      ProductKeyword,
      Product,
      Job,
      ProductMeta,
      Category,
      ParentCategory,
      Brand,
      Vendor,
      Keyword,
      BrandParentCategory,
      BrandParentCategoryBrand,
      Customer,
      Quotation,
      Order,
      OrderDispatch,
      OrderActivity,

      // ✅ NEW
      OrderCreditNote,
      OrderCreditNoteItem,

      PurchaseOrder,
      InventoryHistory,
      ActivityLog,
    });
  }
});

// -------------------------------
// JSON columns: MariaDB stores JSON as text, and some rows were saved
// double-encoded ("\"[...]\""). Every JSON attribute without its own getter
// returns parsed data, so controllers always see arrays/objects.
// -------------------------------
const parseJsonValue = (value) => {
  let v = value;
  for (let i = 0; i < 3 && typeof v === "string"; i++) {
    const t = v.trim();
    if (!t || !/^[\[{"]/.test(t)) break;
    try {
      v = JSON.parse(t);
    } catch {
      break;
    }
  }
  return v;
};
for (const model of Object.values(sequelize.models)) {
  let changed = false;
  for (const [name, attr] of Object.entries(model.rawAttributes)) {
    const key = attr.type?.key || attr.type?.constructor?.key;
    if (key !== "JSON" || attr.get) continue;
    attr.get = function getJson() {
      return parseJsonValue(this.getDataValue(name));
    };
    changed = true;
  }
  if (changed) model.refreshAttributes();
}

// -------------------------------
// Quotation pipeline: a quotation is Won while it has a live order. Every
// way an order is saved or removed runs this, after the change is committed.
// -------------------------------
{
  const syncQuotation = (order, options) => {
    const ids = new Set(
      [order.quotationId, order.previous?.("quotationId")].filter(Boolean),
    );
    if (!ids.size) return;
    const run = () => {
      const { syncWon } = require("../modules/quotations/pipeline");
      for (const id of ids) {
        syncWon(id).catch((err) =>
          console.error("[quotation pipeline] sync failed:", err.message),
        );
      }
    };
    if (options?.transaction?.afterCommit) options.transaction.afterCommit(run);
    else setImmediate(run);
  };
  Order.addHook("afterCreate", "quotationPipeline", syncQuotation);
  Order.addHook("afterUpdate", "quotationPipeline", (order, options) => {
    if (order.changed("status") || order.changed("quotationId")) syncQuotation(order, options);
  });
  Order.addHook("afterDestroy", "quotationPipeline", syncQuotation);
}

// -------------------------------
// 3️⃣ Export models + sequelize
// -------------------------------
module.exports = {
  sequelize,

  User,
  Role,
  Permission,
  RolePermission,
  Address,
  FieldGuidedSheet,
  Team,
  Job,
  TeamMember,

  ProductKeyword,
  Product,
  ProductMeta,

  Category,
  ParentCategory,
  Brand,
  Vendor,
  Keyword,
  BrandParentCategory,
  BrandParentCategoryBrand,

  Customer,
  Quotation,

  Order,
  OrderDispatch,
  OrderActivity,

  // ✅ NEW
  OrderCreditNote,
  OrderCreditNoteItem,

  PurchaseOrder,
  ActivityLog,
  InventoryHistory,

  OrderPayment,
  QuotationFollowUp,
  TaxInvoice,
  ...StockModels,
};
