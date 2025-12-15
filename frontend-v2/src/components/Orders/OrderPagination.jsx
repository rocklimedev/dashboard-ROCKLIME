import React from "react";
import ReactPaginate from "react-paginate";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

const OrderPagination = ({ pageCount, onPageChange }) => {
  return (
    <div className="row custom-pagination mt-3">
      <div className="col-md-12 d-flex justify-content-end">
        <ReactPaginate
          previousLabel={<LeftOutlined />}
          nextLabel={<RightOutlined />}
          breakLabel={"..."}
          pageCount={pageCount}
          marginPagesDisplayed={2}
          pageRangeDisplayed={3}
          onPageChange={onPageChange}
          containerClassName={"pagination d-flex align-items-center"}
          pageClassName={"page-item"}
          pageLinkClassName={"page-link"}
          previousClassName={"page-item"}
          previousLinkClassName={"page-link"}
          nextClassName={"page-item"}
          nextLinkClassName={"page-link"}
          activeClassName={"active"}
        />
      </div>
    </div>
  );
};

export default OrderPagination;
