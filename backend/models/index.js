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
const PurchaseOrder =
  require("../modules/purchase-order/models/purchaseorder.model")(
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
  ActivityLog, // ← add here
  BrandParentCategoryBrand,
  Customer,
  Quotation,
  Order,
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
      PurchaseOrder,
      InventoryHistory,
      ActivityLog, // ← add here
    });
  }
});

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
  PurchaseOrder,
  ActivityLog, // ← add here
  InventoryHistory,
};
