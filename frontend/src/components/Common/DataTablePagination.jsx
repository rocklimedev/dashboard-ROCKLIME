import React, { useState } from "react";
import ReactPaginate from "react-paginate";

const DataTablePagination = ({ data, itemsPerPage, onPageChange }) => {
  const pageCount = Math.ceil(data.length / itemsPerPage);

  return (
    <ReactPaginate
      previousLabel={"Previous"}
      nextLabel={"Next"}
      breakLabel={"..."}
      pageCount={pageCount}
      marginPagesDisplayed={2}
      pageRangeDisplayed={5}
      onPageChange={({ selected }) => onPageChange(selected)}
      containerClassName={"pagination"}
      activeClassName={"active"}
    />
  );
};

export default DataTablePagination;
