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
const RolePermission = require("../modules/rbac/models/role_permission.model")(
  sequelize,
  DataTypes,
);
const Address = require("../modules/address/models/address.model")(
  sequelize,
  DataTypes,
);
const Team = require("../modules/team/models/team.model")(sequelize, DataTypes);
const TeamMember = require("../modules/team/models/team_member.model")(
  sequelize,
  DataTypes,
);
const ProductKeyword =
  require("../modules/inventory/models/product_keywords.model")(
    sequelize,
    DataTypes,
  );
const Product = require("../modules/inventory/models/product.model")(
  sequelize,
  DataTypes,
);
const ProductMeta = require("../modules/inventory/models/product_meta.model")(
  sequelize,
  DataTypes,
);
const Category = require("../modules/brands/models/category.model")(
  sequelize,
  DataTypes,
);
const ParentCategory = require("./parentCategory")(sequelize, DataTypes);
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
  require("../modules/brands/models/brand_parent_category.model")(
    sequelize,
    DataTypes,
  );
const BrandParentCategoryBrand =
  require("../modules/brands/models/brand_parentcategory_brand.model")(
    sequelize,
    DataTypes,
  );
const ActivityLog = require("../modules/engagement/models/activity_log.model")(
  sequelize,
  DataTypes,
);
const Job = require("../modules/jobs/models/job.model")(sequelize, DataTypes);
const FieldGuidedSheet = require("../modules/purchase-order/models/fgs.model")(
  sequelize,
  DataTypes,
);
const InventoryHistory =
  require("../modules/inventory/models/inventory_history.model")(
    sequelize,
    DataTypes,
  );
const Customer = require("../modules/customer/models/customers.model")(
  sequelize,
  DataTypes,
);
const Quotation = require("../modules/quotation/models/quotation.model")(
  sequelize,
  DataTypes,
);
const Order = require("../modules/order/models/orders.model")(
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
