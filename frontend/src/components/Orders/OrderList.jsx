import React, { useState } from "react";
import OrderItem from "./Orderitem";
import { useGetAllOrdersQuery } from "../../api/orderApi";

const OrderList = () => {
  const { data, error, isLoading } = useGetAllOrdersQuery();
  const [selectedTab, setSelectedTab] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalDates, setModalDates] = useState([]); // State to hold order dates

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading orders!</p>;

  const orders = data?.orders || [];

  // Function to handle opening the modal and displaying order dates
  const handleOpenModal = (orderDates) => {
    setModalDates(orderDates);
    setShowModal(true);
  };

  // Function to calculate if a date is close
  const isDateClose = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const differenceInDays = (due - today) / (1000 * 3600 * 24); // Difference in days
    return differenceInDays <= 2; // You can change this threshold as needed (e.g., 2 days)
  };

  return (
    <>
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
              orders.map((order) => {
                const orderDates = order.due_dates || []; // Assume `due_dates` is an array of dates in each order

                return (
                  <div key={order.id} className="col-md-4 d-flex">
                    <div className="card rounded-3 mb-4 flex-fill">
                      <OrderItem order={order} />
                      {/* Button to open modal */}
                      <button
                        className={`btn btn-primary mt-2 ${
                          orderDates.some((date) => isDateClose(date))
                            ? "btn-danger" // Change to red if close dates exist
                            : ""
                        }`}
                        onClick={() => handleOpenModal(orderDates)}
                      >
                        View Due Dates
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p>No orders available.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          id="datesModal"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Order Due Dates</h5>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                  onClick={() => setShowModal(false)}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <ul>
                  {modalDates.length > 0 ? (
                    modalDates.map((date, index) => (
                      <li key={index}>
                        {date}{" "}
                        {isDateClose(date) && (
                          <span className="text-danger">(Due soon)</span>
                        )}
                      </li>
                    ))
                  ) : (
                    <p>No due dates available.</p>
                  )}
                </ul>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrderList;
