import { PDFDocument, StandardFonts } from "pdf-lib";
import lowStockTemplate from "../../assets/pdf/low_stock_report.pdf";
const addTemplatePage = async (pdfDoc, templateBytes) => {
  const templateDoc = await PDFDocument.load(templateBytes);
  const [templatePage] = await pdfDoc.copyPages(templateDoc, [0]);
  pdfDoc.addPage(templatePage);
  return pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
};
export const generateLowStockReportPDF = async (products) => {
  try {
    const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= 20);

    const templateBytes = await fetch(lowStockTemplate).then((res) =>
      res.arrayBuffer(),
    );

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const page = await addTemplatePage(pdfDoc, templateBytes);

    let y = 700;

    lowStock.forEach((p, i) => {
      const code =
        p.metaDetails?.find((d) => d.value?.match(/^[A-Za-z0-9]{6,12}$/))
          ?.value || "-";

      page.drawText(`${i + 1}`, { x: 30, y, font, size: 10 });
      page.drawText(p.name || "-", { x: 80, y, font, size: 10 });
      page.drawText(String(p.quantity), { x: 300, y, font, size: 10 });
      page.drawText(code, { x: 380, y, font, size: 10 });

      y -= 30;
    });

    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `Low_Stock_Report_${Date.now()}.pdf`;
    link.click();

    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Low Stock Report Error:", err);
  }
};
