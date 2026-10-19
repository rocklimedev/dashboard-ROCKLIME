import { API_URL } from "../../store/config";
import { token } from "../../components/Quotation/quotationPdf";
import { poTotals } from "../../utils/poMath";

export const PO_EXPORT_FIELDS = [["sno", "S.No"], ["name", "Product name"], ["code", "Company code"], ["hsn", "HSN"], ["qty", "Quantity"], ["price", "Unit price"], ["discount", "Discount"], ["gst", "GST"], ["total", "Amount"]];

export async function fetchPoExport(id, exportOptions) {
  const query = new URLSearchParams({ exportOptions: JSON.stringify(exportOptions) });
  const response = await fetch(`${API_URL}/purchase-orders/${id}/pdf?${query}`, { headers: { Authorization: `Bearer ${token()}` } });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || "Could not make the PDF");
  return { blob: await response.blob() };
}

export function savePoExport(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.replace(/[\\/:*?"<>|]/g, "_");
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function buildPoExcel(po, hiddenFields = []) {
  const { default: ExcelJS } = await import("exceljs");
  const hidden = new Set(hiddenFields);
  const totals = poTotals({ items: po.items || [], freight: Number(po.freight) || 0, interState: Boolean(po.interState) });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Purchase order");
  sheet.addRow([`PO ${po.poNumber}`]);
  sheet.addRow([po.vendor?.vendorName || ""]);
  sheet.addRow([po.orderDate || po.createdAt || ""]);
  sheet.addRow([]);
  const fields = PO_EXPORT_FIELDS.filter(([key]) => !hidden.has(key));
  sheet.addRow(fields.map(([, label]) => label)).font = { bold: true };
  totals.lines.forEach((line, index) => {
    const values = { sno: index + 1, name: line.productName || line.name || "Item", code: line.companyCode || line.productCode || "", hsn: line.hsn || line.hsnSac || "",
      qty: line.qty, price: line.rate, discount: line.discountType === "fixed" ? `₹${line.discountInput}` : `${line.discountInput}%`, gst: `${line.gstRate}%`, total: line.net };
    sheet.addRow(fields.map(([key]) => values[key]));
  });
  sheet.columns.forEach((column, index) => { column.width = fields[index]?.[0] === "name" ? 40 : 20; });
  if (!hidden.has("total")) {
    const summary = workbook.addWorksheet("PO summary");
    summary.addRow(["PO summary"]).font = { bold: true };
    summary.addRow(["Value before discount", totals.subTotal]);
    if (!hidden.has("discount")) summary.addRow(["Discount", totals.discount]);
    summary.addRow(["Freight", totals.freight]);
    summary.addRow(["Taxable value", totals.taxableValue]);
    if (!hidden.has("gst")) summary.addRow(["GST", totals.gstAmount]);
    summary.addRow(["Round off", totals.roundOff]);
    summary.addRow(["PO total", totals.grandTotal]);
    summary.columns = [{ width: 30 }, { width: 20 }];
  }
  return new Blob([await workbook.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
