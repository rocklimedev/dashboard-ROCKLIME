import React from "react";
import Alert from "./Alert";
import Recents from "./Recents";
import Stats from "./Stats";
import Stats2 from "./Stats2";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetProfileQuery } from "../../api/userApi";

const PageWrapper = () => {
  const { data: profile, isLoading: loadingProfile } = useGetProfileQuery();
  const { data, isLoading: loadingOrders } = useGetAllOrdersQuery();
  const orders = data?.orders || [];
  console.log(orders);
  const username = profile?.user?.name || "Admin";

  const today = new Date().toISOString().split("T")[0];
  const todaysOrders = orders.filter((order) => {
    const rawDate = order.createdAt;
    if (!rawDate || isNaN(new Date(rawDate))) return false;

    const orderDate = new Date(rawDate).toISOString().split("T")[0];
    return orderDate === today;
  });

  console.log(todaysOrders);
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-2">
          <div className="mb-3">
            <h1 className="mb-1">
              Welcome, {loadingProfile ? "..." : username}
            </h1>
            <p className="fw-medium">
              You have{" "}
              <span className="text-primary fw-bold">
                {loadingOrders ? "..." : todaysOrders.length}
              </span>{" "}
              Order{!loadingOrders && todaysOrders.length !== 1 && "s"} Today
            </p>
          </div>
        </div>

        <Alert />
        <Recents />
        <Stats />
        <Stats2 />
      </div>
    </div>
  );
};

export default PageWrapper;
