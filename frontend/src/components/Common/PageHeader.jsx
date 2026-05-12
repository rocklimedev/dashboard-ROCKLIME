import React from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { FilePdfFilled, FileExcelFilled } from "@ant-design/icons";
import { Tooltip, Switch } from "antd";
import { AppstoreOutlined, UnorderedListOutlined } from "@ant-design/icons";
const PageHeader = ({
  title,
  subtitle,
  onAdd,
  tableData = [],
  exportOptions = { pdf: true, excel: true },
  extra, // ← Accepts any JSX (buttons, toggles, etc.)
  viewToggle, // ← Optional: For card/list toggle
}) => {
  const handleDownloadPDF = () => {
    if (tableData.length === 0) {
      alert("No data available to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${title} Report`, 14, 20);

    const headers = Object.keys(tableData[0] || {});
    const rows = tableData.map((row) =>
      headers.map((h) => String(row[h] ?? "—")),
    );

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [60, 141, 188] },
    });

    doc.save(`${title.toLowerCase().replace(/\s+/g, "_")}.pdf`);
  };

  const handleDownloadExcel = () => {
    if (tableData.length === 0) {
      alert("No data available to export");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(
      workbook,
      `${title.toLowerCase().replace(/\s+/g, "_")}.xlsx`,
    );
  };

  return (
    <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
      {/* Left Side - Title & Subtitle */}
      <div className="add-item">
        <div className="page-title">
          <h4 className="fw-bold mb-1">{title}</h4>
          {subtitle && <h6 className="text-muted mb-0">{subtitle}</h6>}
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="d-flex align-items-center gap-3">
        {/* Export Buttons */}
        <ul className="table-top-head d-flex align-items-center gap-2 mb-0">
          {exportOptions.pdf && (
            <li>
              <Tooltip title="Download PDF">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDownloadPDF();
                  }}
                  style={{ fontSize: 24, color: "#e74c3c", cursor: "pointer" }}
                >
                  <FilePdfFilled />
                </a>
              </Tooltip>
            </li>
          )}

          {exportOptions.excel && (
            <li>
              <Tooltip title="Download Excel">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDownloadExcel();
                  }}
                  style={{ fontSize: 24, color: "#27ae60", cursor: "pointer" }}
                >
                  <FileExcelFilled />
                </a>
              </Tooltip>
            </li>
          )}
        </ul>

        {/* View Toggle (Card/List) - Optional */}
        {viewToggle && (
          <Tooltip
            title={viewToggle.viewMode === "card" ? "List View" : "Card View"}
          >
            <Switch
              checkedChildren={<AppstoreOutlined />}
              unCheckedChildren={<UnorderedListOutlined />}
              checked={viewToggle.viewMode === "card"}
              onChange={viewToggle.onChange}
            />
          </Tooltip>
        )}

        {/* Custom Extra Content (Book Mode Toggle, Filters, etc.) */}
        {extra && <div className="d-flex align-items-center">{extra}</div>}

        {/* Add Button */}
        {onAdd && (
          <button onClick={onAdd} className="btn btn-primary">
            + Add {title}
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
