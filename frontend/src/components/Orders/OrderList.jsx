import React, { useState } from "react";
import OrderItem from "./Orderitem";
import { useGetAllOrdersQuery } from "../../api/orderApi";
const OrderList = () => {
  const { data, error, isLoading } = useGetAllOrdersQuery();
  const [selectedTab, setSelectedTab] = useState(0);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading orders!</p>;

  const orders = data?.orders || []; // Ensure orders array exists

  return (
    <div className="tab-content" id="v-pills-tabContent2">
      <div
        className="tab-pane fade active show"
        id="v-pills-profile"
        role="tabpanel"
        aria-labelledby="v-pills-profile-tab"
      >
        <div className="border-bottom mb-4 pb-4">
          <div className="row">
            <div className="col-md-12">
              <div className="d-flex align-items-center justify-content-between flex-wrap mb-2">
                <h4>All Orders</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Render Order Items */}
        <div className="row">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div key={order.id} className="col-md-4 d-flex">
                <div className="card rounded-3 mb-4 flex-fill">
                  <OrderItem order={order} />
                </div>
              </div>
            ))
          ) : (
            <p>No orders available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderList;
