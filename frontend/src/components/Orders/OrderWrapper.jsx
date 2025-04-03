import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import OrderPagination from "./OrderPagination";
import OrderList from "./OrderList";
import OrderFilter from "./OrderFilter";
import AddNewOrder from "./AddNewOrder";

const OrderWrapper = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="page-wrapper notes-page-wrapper">
      <div className="content">
        <div className="page-header page-add-notes border-0 flex-sm-row flex-column">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Orders</h4>
              <h6 className="mb-0">Manage your orders</h6>
            </div>
          </div>
          <div className="d-flex flex-sm-row flex-column align-items-sm-center align-items-start">
            <div className="page-btn">
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary"
              >
                <i className="ti ti-circle-plus me-1"></i>Add New Order
              </button>
            </div>
          </div>
        </div>

        <div className="row">
          <OrderFilter />
          <div className="col-xl-9 budget-role-notes">
            <OrderList />
            <OrderPagination
              pageCount={10}
              onPageChange={(selected) => console.log(selected)}
            />
          </div>
        </div>
      </div>

      {showModal && <AddNewOrder onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default OrderWrapper;
