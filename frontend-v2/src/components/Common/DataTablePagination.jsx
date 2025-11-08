import React from "react";
import ReactPaginate from "react-paginate";
import "./pagination.css";

const DataTablePagination = ({
  totalItems,
  itemNo = 20,
  onPageChange,
  currentPage,
}) => {
  const pageCount = Math.ceil(totalItems / itemNo);

  // Calculate start and end indices for "Showing X to Y of Z"
  const startIndex = (currentPage - 1) * itemNo; // Adjust for 1-based currentPage
  const endIndex = Math.min(startIndex + itemNo, totalItems);

  // Handle page change
  const handlePageClick = (event) => {
    const newPage = event.selected + 1; // Convert to 1-based for onPageChange
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
        forcePage={currentPage - 1} // Convert 1-based to 0-based for ReactPaginate
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
