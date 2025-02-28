import React from "react";
import {
  AiOutlinePlusCircle,
  AiOutlineFilePdf,
  AiOutlineFileExcel,
} from "react-icons/ai";
import { FcCollapse } from "react-icons/fc";

const PageHeader = ({ title, subtitle, onAdd }) => {
  // Function to handle downloading PDF
  const handleDownloadPDF = () => {
    const pdfContent = "This is a sample PDF content.";
    const blob = new Blob([pdfContent], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to handle downloading Excel
  const handleDownloadExcel = () => {
    const excelContent =
      "data:text/csv;charset=utf-8,Column1,Column2\nValue1,Value2";
    const encodedUri = encodeURI(excelContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `${title}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to handle collapsing
  const handleCollapse = () => {
    const element = document.getElementById("collapse-header");
    if (element) {
      element.classList.toggle("collapsed");
    }
  };

  return (
    <div className="page-header">
      <div className="add-item d-flex">
        <div className="page-title">
          <h4 className="fw-bold">{title}</h4>
          {subtitle && <h6>{subtitle}</h6>}
        </div>
      </div>
      <ul className="table-top-head">
        <li title="Download PDF" onClick={handleDownloadPDF}>
          <a data-bs-toggle="tooltip" data-bs-placement="top" title="Pdf">
            <AiOutlineFilePdf
              size={22}
              className="text-red-500 hover:text-red-700"
            />
          </a>
        </li>
        <li title="Download Excel" onClick={handleDownloadExcel}>
          <a data-bs-toggle="tooltip" data-bs-placement="top" title="Excel">
            <AiOutlineFileExcel
              size={22}
              className="text-green-500 hover:text-green-700"
            />
          </a>
        </li>
        <li title="Collapse" onClick={handleCollapse}>
          <a
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="Collapse"
            id="collapse-header"
          >
            <FcCollapse
              size={22}
              className="text-gray-500 hover:text-gray-700"
            />
          </a>
        </li>
      </ul>
      <div className="page-btn">
        {onAdd && (
          <button
            onClick={onAdd}
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#add-category"
          >
            <AiOutlinePlusCircle size={20} />
            Add {title}
          </button>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
