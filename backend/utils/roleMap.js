const rolePermissions = {
  SUPER_ADMIN: ["*"], // Access to all routes
  ADMIN: ["*"], // Access to all routes
  ACCOUNTS: ["/customers", "/orders", "/quotations"],
  SALES: [
    "/keywords",
    "/parent-category",
    "/category",
    "/vendors",
    "/brands",
    "/quotations",
    "/orders",
  ],
  DEVELOPER: ["*"], // Access to all routes
};
