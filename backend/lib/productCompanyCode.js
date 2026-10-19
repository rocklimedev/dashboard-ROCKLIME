const COMPANY_CODE_ID = "d11da9f9-3f2e-4536-8236-9671200cca4a";
const normalize = value => String(value || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
const decode = value => {
  for (let i = 0; i < 3 && typeof value === "string"; i++) {
    try { value = JSON.parse(value); } catch { break; }
  }
  return value;
};
function productCompanyCode(product, definitions = []) {
  const row = product?.toJSON ? product.toJSON() : product;
  const meta = decode(row?.meta);
  const keys = [COMPANY_CODE_ID, ...definitions.filter(field => normalize(field.slug) === "companycode" || normalize(field.title) === "companycode").map(field => field.id), "companyCode", "company_code", "companycode"];
  const details = [meta, decode(row?.metaDetails)].filter(Array.isArray).flat();
  const values = [
    row?.companyCode, row?.company_code, row?.companycode,
    ...keys.map(key => meta?.[key]),
    ...details.filter(field => keys.includes(field?.id) || normalize(field?.slug) === "companycode" || normalize(field?.title) === "companycode").map(field => field.value),
  ];
  for (let value of values) {
    if (value && typeof value === "object") value = value.value;
    if (value != null && typeof value !== "object" && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}
module.exports = { productCompanyCode };
