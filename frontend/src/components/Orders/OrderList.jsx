import React from "react";
import OrderItem from "./OrderItem"; // Ensure correct case
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
                  <th>TITLE</th>
                  <th>STATUS</th>
                  <th>CUSTOMER</th>
                  <th>PRIORITY</th>
                  <th>DUE DATE</th>
                  <th>TEAM</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderItem
                    key={order.id}
                    order={order}
                    teamName={
                      order.TeamId && teamDataMap && teamDataMap[order.TeamId]
                        ? teamDataMap[order.TeamId].teamName
                        : "Unassigned"
                    }
                    isTeamLoading={
                      order.TeamId && teamDataMap && teamDataMap[order.TeamId]
                        ? teamDataMap[order.TeamId].isLoading
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
