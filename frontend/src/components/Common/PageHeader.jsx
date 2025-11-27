import React from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  FilePdfFilled,
  FileExcelFilled,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Switch, Tooltip } from "antd";

const PageHeader = ({
  title,
  subtitle,
  onAdd,
  tableData = [],
  extra, // ← This will now accept any JSX (buttons, etc.)
  exportOptions = { pdf: true, excel: true },
}) => {
  const handleDownloadPDF = () => {
    if (tableData.length === 0) {
      alert("No data available to export");
      return;
    }
    // ... your PDF logic
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${title} Report`, 14, 20);
    const headers = Object.keys(tableData[0] || {});
    const rows = tableData.map((row) =>
      headers.map((h) => String(row[h] ?? "—"))
    );
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [60, 141, 188] },
    });
    doc.save(`${title}.pdf`);
  };

  const handleDownloadExcel = () => {
    if (tableData.length === 0) {
      alert("No data available to export");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${title}.xlsx`);
  };

  // Extract view toggle if provided
  const viewToggle =
    extra && typeof extra === "object" && "viewMode" in extra
      ? {
          viewMode: extra.viewMode,
          onViewToggle: extra.onViewToggle,
          showViewToggle: extra.showViewToggle,
        }
      : null;

  return (
    <div className="page-header">
      <div className="add-item d-flex">
        <div className="page-title">
          <h4 className="fw-bold">{title}</h4>
          {subtitle && <h6>{subtitle}</h6>}
        </div>
      </div>

      {/* Export Buttons */}
      <ul className="table-top-head d-flex align-items-center">
        {exportOptions.pdf && (
          <li title="Download PDF" onClick={handleDownloadPDF}>
            <a href="#" onClick={(e) => e.preventDefault()}>
              <FilePdfFilled style={{ fontSize: 22, color: "#e74c3c" }} />
            </a>
          </li>
        )}
        {exportOptions.excel && (
          <li title="Download Excel" onClick={handleDownloadExcel}>
            <a href="#" onClick={(e) => e.preventDefault()}>
              <FileExcelFilled style={{ fontSize: 22, color: "#27ae60" }} />
            </a>
          </li>
        )}
        {viewToggle?.showViewToggle && (
          <li>
            <Tooltip
              title={viewToggle.viewMode === "card" ? "List View" : "Card View"}
            >
              <Switch
                checkedChildren={<AppstoreOutlined />}
                unCheckedChildren={<UnorderedListOutlined />}
                checked={viewToggle.viewMode === "card"}
                onChange={viewToggle.onViewToggle}
              />
            </Tooltip>
          </li>
        )}
      </ul>

      {/* Custom Extra Buttons (This is what was missing!) */}
      <div className="page-btn">
        {/* First: Render custom extra (your buttons) */}
        {extra && typeof extra !== "object" && extra} {/* If extra is JSX */}
        {extra &&
          typeof extra === "object" &&
          !("viewMode" in extra) &&
          extra.children}
        {/* Then: Default "Add" button */}
        {onAdd && (
          <button onClick={onAdd} className="btn btn-primary ms-2">
            + Add {title}
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
