export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

export const permissions = {
  PRODUCT_CREATE: ["ADMIN", "MANAGER"],
  PRODUCT_EDIT: ["ADMIN", "MANAGER"],
  PRODUCT_DELETE: ["ADMIN"],
  STOCK_EDIT: ["ADMIN", "MANAGER"],
  IMPORT_PRODUCTS: ["ADMIN"],
};

export const can = (role: Role, permission: keyof typeof permissions) =>
  permissions[permission].includes(role);
