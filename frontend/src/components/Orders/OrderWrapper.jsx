import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import OrderPagination from "./OrderPagination";
import OrderList from "./OrderList";
import OrderFilter from "./OrderFilter";
import AddNewOrder from "./AddNewOrder";
import OrderItem from "./Orderitem";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import DataTablePagination from "../Common/DataTablePagination";
const OrderWrapper = () => {
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ page: 1, limit: 6 });

  const { data, error, isLoading } = useGetAllOrdersQuery(filters);

  const orders = data?.orders || [];
  const totalCount = data?.totalCount || 0;

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

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
          <OrderFilter setFilters={setFilters} />
          <div className="col-xl-9 budget-role-notes">
            <div className="tab-content">
              <div className="tab-pane fade active show">
                <div className="border-bottom mb-4 pb-4">
                  <h4>All Orders</h4>
                </div>

                {isLoading ? (
                  <p>Loading...</p>
                ) : error ? (
                  <p>Error loading orders!</p>
                ) : orders.length > 0 ? (
                  <div className="row">
                    {orders.map((order) => (
                      <div key={order.id} className="col-md-4 d-flex">
                        <div className="card rounded-3 mb-4 flex-fill">
                          <OrderItem order={order} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No orders found.</p>
                )}

                {/* Pagination */}
                <DataTablePagination
                  totalItems={totalCount}
                  itemNo={filters.limit}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && <AddNewOrder onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default OrderWrapper;
