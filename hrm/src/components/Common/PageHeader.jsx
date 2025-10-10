import React from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable"; // Import for structured PDF tables
import * as XLSX from "xlsx";
import {
  FileAddFilled,
  FilePdfFilled,
  FileExcelFilled,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Switch, Tooltip } from "antd";

// Add custom CSS to style the Switch component
const switchStyles = `
  .custom-switch .ant-switch {
    background-color: #808080 !important; /* Grey when unchecked */
  }
  .custom-switch .ant-switch-checked {
    background-color: #808080 !important; /* Grey when checked */
  }
  .custom-switch .ant-switch-handle::before {
    background-color: #fff !important; /* White handle for contrast */
  }
`;

// Inject the styles into the document
const styleSheet = document.createElement("style");
styleSheet.innerText = switchStyles;
document.head.appendChild(styleSheet);

const PageHeader = ({
  title,
  subtitle,
  onAdd,
  tableData = [],
  extra = {},
  exportOptions = { pdf: true, excel: true },
}) => {
  // Function to handle downloading PDF
  const handleDownloadPDF = () => {
    if (tableData.length === 0) {
      alert("No data available to export");
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`${title} Report`, 14, 20);

      // Define table columns (based on provided tableData structure)
      const headers = Object.keys(tableData[0] || {});

      // Prepare table rows
      const rows = tableData.map((row) =>
        headers.map((header) => {
          let value = row[header] ?? "—";
          if (value instanceof Date) {
            value = value.toLocaleDateString();
          } else if (typeof value === "object") {
            value = JSON.stringify(value);
          } else {
            value = String(value);
          }
          return value;
        })
      );

      // Generate table using jspdf-autotable
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 30,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [60, 141, 188] },
        columnStyles: headers.reduce((acc, _, index) => {
          acc[index] = { cellWidth: 30 }; // Adjustable column width
          return acc;
        }, {}),
      });

      doc.save(`${title}.pdf`);
    } catch (error) {
      alert("Failed to generate PDF. Please try again.");
      console.error(error);
    }
  };

  // Function to handle downloading Excel
  const handleDownloadExcel = () => {
    if (tableData.length === 0) {
      alert("No data available to export");
      return;
    }

    try {
      const formattedData = tableData.map((row) => {
        const formattedRow = {};
        Object.keys(row).forEach((key) => {
          let value = row[key] ?? "—";
          if (value instanceof Date) {
            value = value.toLocaleDateString();
          } else if (typeof value === "object") {
            value = JSON.stringify(value);
          } else {
            value = String(value);
          }
          formattedRow[key] = value;
        });
        return formattedRow;
      });

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, title);
      XLSX.writeFile(workbook, `${title}.xlsx`);
    } catch (error) {
      alert("Failed to generate Excel file. Please try again.");
      console.error(error);
    }
  };

  const { viewMode, onViewToggle, showViewToggle = false } = extra;

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
                className="custom-switch"
                checkedChildren={<AppstoreOutlined />}
                unCheckedChildren={<UnorderedListOutlined />}
                checked={viewMode === "card"}
                onChange={onViewToggle}
              />
            </Tooltip>
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
