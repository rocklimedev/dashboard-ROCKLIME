// src/data/helpers.js

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { message } from "antd";

const generatePDF = (data, title) => {
  const doc = new jsPDF("l", "mm", "a4");
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 28);

  if (!data || data.length === 0) {
    doc.setFontSize(14);
    doc.text("No products updated this month", 14, 50);
    doc.save(`${title.replace(/[^a-z0-9]/gi, "_")}.pdf`);
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map((row) => Object.values(row));

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 35 },
      2: { cellWidth: 40 },
      3: { cellWidth: 35 },
      4: { cellWidth: 25, halign: "center" },
      5: { cellWidth: 35 },
    },
    didDrawPage: (data) => {
      const pageSize = doc.internal.pageSize;
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `Page ${doc.getCurrentPageInfo().pageNumber}`,
        pageSize.width - 30,
        pageSize.height - 10
      );
    },
  });

  doc.save(`${title.replace(/[^a-z0-9]/gi, "_")}.pdf`);
};

const generateExcel = (data, title) => {
  if (!data || data.length === 0) {
    message.warning("No data to export");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([excelBuffer]), `${title.replace(/[^a-z0-9]/gi, "_")}.xlsx`);
};

export { generatePDF, generateExcel };
