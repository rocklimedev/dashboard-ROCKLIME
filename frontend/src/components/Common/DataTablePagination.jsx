import React, { useState } from "react";
import ReactPaginate from "react-paginate";

const DataTablePagination = ({ totalItems, itemNo = 20, onPageChange }) => {
  const pageCount = Math.ceil(totalItems / itemNo);

  const handlePageClick = (event) => {
    onPageChange(event.selected + 1); // `selected` is zero-based
  };

  return (
    <ReactPaginate
      previousLabel={"Previous"}
      nextLabel={"Next"}
      breakLabel={"..."}
      pageCount={pageCount}
      marginPagesDisplayed={2}
      pageRangeDisplayed={3}
      onPageChange={handlePageClick}
      containerClassName={"pagination justify-content-end mb-0"}
      pageClassName={"page-item"}
      pageLinkClassName={"page-link"}
      previousClassName={"page-item"}
      previousLinkClassName={"page-link"}
      nextClassName={"page-item"}
      nextLinkClassName={"page-link"}
      breakClassName={"page-item"}
      breakLinkClassName={"page-link"}
      activeClassName={"active"}
    />
  );
};

export default DataTablePagination;
