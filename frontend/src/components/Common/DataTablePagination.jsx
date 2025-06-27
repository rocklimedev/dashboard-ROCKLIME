import React, { useState } from "react";
import ReactPaginate from "react-paginate";
import "./pagination.css";
const DataTablePagination = ({ totalItems, itemNo = 20, onPageChange }) => {
  const pageCount = Math.ceil(totalItems / itemNo);
  const [currentPage, setCurrentPage] = useState(0); // Zero-based index for react-paginate

  // Calculate start and end indices for "Showing X to Y of Z"
  const startIndex = currentPage * itemNo;
  const endIndex = Math.min(startIndex + itemNo, totalItems);

  // Handle page change
  const handlePageClick = (event) => {
    const newPage = event.selected + 1; // Convert to 1-based for onPageChange
    setCurrentPage(event.selected); // Update current page (zero-based)
    onPageChange(newPage); // Pass 1-based page to parent
  };

  return (
    <div className="pagination">
      <div className="pagination-info">
        Showing {startIndex + 1} to {endIndex} of {totalItems} results
      </div>
      <ReactPaginate
        previousLabel={"❮"}
        nextLabel={"❯"}
        breakLabel={"..."}
        pageCount={pageCount}
        marginPagesDisplayed={2}
        pageRangeDisplayed={3}
        onPageChange={handlePageClick}
        forcePage={currentPage} // Sync with current page state
        containerClassName={"pagination-buttons"}
        pageClassName={"page-item"}
        pageLinkClassName={"page-link"}
        previousClassName={"page-item"}
        previousLinkClassName={"page-link"}
        nextClassName={"page-item"}
        nextLinkClassName={"page-link"}
        breakClassName={"page-item"}
        breakLinkClassName={"page-link"}
        activeClassName={"active"}
        disabledClassName={"disabled"}
      />
    </div>
  );
};

export default DataTablePagination;
