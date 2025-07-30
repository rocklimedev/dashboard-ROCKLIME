import React from "react";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import {
  FileAddFilled,
  FilePdfFilled,
  FileExcelFilled,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Button, Switch, Tooltip } from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";

const PageHeader = ({
  title,
  subtitle,
  onAdd,
  tableData = [],
  extra = {},
  exportOptions = { pdf: true, excel: true }, // New prop to control export options
}) => {
  // Function to handle downloading PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    let yOffset = 10;

    // Add title
    doc.setFontSize(16);
    doc.text(title, 10, yOffset);
    yOffset += 10;

    if (tableData.length === 0) {
      doc.setFontSize(12);
      doc.text("No data available", 10, yOffset);
      doc.save(`${title}.pdf`);
      return;
    }

    // Extract column headers
    const headers = Object.keys(tableData[0]);
    const colWidths = headers.map(() => 40); // Fixed width for simplicity
    const rowHeight = 10;

    // Add headers
    doc.setFontSize(12);
    headers.forEach((header, index) => {
      doc.text(header, 10 + index * 40, yOffset);
    });
    yOffset += rowHeight;

    // Add table rows
    tableData.forEach((row) => {
      headers.forEach((header, index) => {
        const value = row[header] || "";
        doc.text(String(value), 10 + index * 40, yOffset);
      });
      yOffset += rowHeight;
    });

    doc.save(`${title}.pdf`);
  };

  // Function to handle downloading Excel
  const handleDownloadExcel = () => {
    if (tableData.length === 0) {
      alert("No data available to export");
      return;
    }

    // Convert tableData to worksheet
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title);

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${title}.xlsx`);
  };

  // Destructure extra prop for view toggle attributes
  const {
    viewMode,
    onViewToggle,
    showViewToggle = false,
    cartItems = [],
    onCartClick,
  } = extra;

  return (
    <div className="page-header">
      <div className="add-item d-flex">
        <div className="page-title">
          <h4 className="fw-bold">{title}</h4>
          {subtitle && <h6>{subtitle}</h6>}
        </div>
      </div>
      <ul className="table-top-head d-flex align-items-center">
        {exportOptions.pdf && (
          <li title="Download PDF" onClick={handleDownloadPDF}>
            <a data-bs-toggle="tooltip" data-bs-placement="top" title="PDF">
              <FilePdfFilled
                size={22}
                className="text-red-500 hover:text-red-700"
              />
            </a>
          </li>
        )}
        {exportOptions.excel && (
          <li title="Download Excel" onClick={handleDownloadExcel}>
            <a data-bs-toggle="tooltip" data-bs-placement="top" title="Excel">
              <FileExcelFilled
                size={22}
                className="text-green-500 hover:text-green-700"
              />
            </a>
          </li>
        )}
        {showViewToggle && (
          <li>
            <Tooltip
              title={
                viewMode === "card"
                  ? "Switch to List View"
                  : "Switch to Card View"
              }
            >
              <Switch
                checkedChildren={<AppstoreOutlined />}
                unCheckedChildren={<UnorderedListOutlined />}
                checked={viewMode === "card"}
                onChange={onViewToggle}
                className="view-toggle-switch"
              />
            </Tooltip>
          </li>
        )}
        {onCartClick && (
          <li>
            <Button
              style={{ color: "#c72c41" }}
              icon={<ShoppingCartOutlined />}
              onClick={onCartClick}
            >
              Cart ({cartItems.length})
            </Button>
          </li>
        )}
      </ul>
      <div className="page-btn">
        {onAdd && (
          <button onClick={onAdd} className="btn btn-primary">
            <FileAddFilled size={20} />
            Add {title}
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
