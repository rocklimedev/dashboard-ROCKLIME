import React from "react";
import OrderItem from "./Orderitem"; // Ensure this is the correct import (case-sensitive)
import OrderPagination from "./OrderPagination";

const OrderList = ({
  orders,
  isLoading,
  error,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  teamDataMap,
  onEditClick,
  onHoldClick,
  onViewInvoice,
  onDeleteOrder,
  onOpenDatesModal,
  isDueDateClose,
}) => {
  return (
    <div className="budget-role-notes">
      <div className="border-bottom mb-4 pb-4">
        <h4>All Orders</h4>
      </div>

      {isLoading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">
          Error loading orders: {error.message || "Unknown error"}
        </div>
      ) : orders.length > 0 ? (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>ORDER ID</th>
                  <th>STATUS</th>
                  <th>ITEM</th>
                  <th>ORDER NUMBER</th>
                  <th>CUSTOMER NAME</th>
                  <th>SHIPPING SERVICE</th>
                  <th>TRACKING CODE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderItem
                    key={order.id}
                    order={order}
                    teamName={
                      order.assignedTo &&
                      teamDataMap &&
                      teamDataMap[order.assignedTo]
                        ? teamDataMap[order.assignedTo].teamName
                        : "Unassigned"
                    }
                    isTeamLoading={
                      order.assignedTo &&
                      teamDataMap &&
                      teamDataMap[order.assignedTo]
                        ? teamDataMap[order.assignedTo].isLoading
                        : false
                    }
                    onEditClick={onEditClick}
                    onHoldClick={onHoldClick}
                    onViewInvoice={onViewInvoice}
                    onDeleteOrder={onDeleteOrder}
                    onOpenDatesModal={onOpenDatesModal}
                    isDueDateClose={isDueDateClose}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {totalCount > pageSize && (
            <OrderPagination
              currentPage={currentPage}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={onPageChange}
            />
          )}
        </>
      ) : (
        <p>No orders found.</p>
      )}
    </div>
  );
};

export default OrderList;
