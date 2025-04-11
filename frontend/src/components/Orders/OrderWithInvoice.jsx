import React from "react";
import { useParams } from "react-router-dom";
import { useGetInvoiceByIdQuery } from "../../api/invoiceApi";
import { useGetOrderDetailsQuery } from "../../api/orderApi";
const OrderWithInvoice = () => {
  const { id } = useParams(); // Order ID from route
  const {
    data,
    isLoading: orderLoading,
    error: orderError,
  } = useGetOrderDetailsQuery(id);
  const order = data?.order || [];
  const invoiceId = order?.invoiceId;
  const {
    data: invoice,
    isLoading: invoiceLoading,
    error: invoiceError,
  } = useGetInvoiceByIdQuery(invoiceId, { skip: !invoiceId });

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
              <button className="btn btn-primary">
                <i className="ti ti-circle-plus me-1"></i>Add New Order
              </button>
            </div>
          </div>
        </div>
        <div className="row">
          {/* Order Details */}
          <div className="col-md-6">
            <div className="card border rounded-3 shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Order Details</h5>
              </div>
              <div className="card-body">
                {orderLoading ? (
                  <p>Loading Order...</p>
                ) : orderError ? (
                  <p className="text-danger">Error fetching order details</p>
                ) : order ? (
                  <>
                    <p>
                      <strong>Title:</strong> {order.title}
                    </p>
                    <p>
                      <strong>Status:</strong> {order.status}
                    </p>
                    <p>
                      <strong>Due Date:</strong> {order.dueDate}
                    </p>
                    <p>
                      <strong>Description:</strong> {order.description}
                    </p>
                    <p>
                      <strong>Assigned To:</strong> {order.assignedTo}
                    </p>
                    <p>
                      <strong>Pipeline:</strong> {order.pipeline}
                    </p>
                    <p>
                      <strong>Source:</strong> {order.source}
                    </p>
                    <p>
                      <strong>Priority:</strong> {order.priority}
                    </p>
                  </>
                ) : (
                  <p>No order found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="col-md-6">
            <div className="card border rounded-3 shadow-sm">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">Invoice Details</h5>
              </div>
              <div className="card-body">
                {invoiceLoading ? (
                  <p>Loading Invoice...</p>
                ) : invoiceError ? (
                  <p className="text-danger">Error fetching invoice</p>
                ) : invoice ? (
                  <>
                    <p>
                      <strong>Invoice Number:</strong> {invoice.invoiceNumber}
                    </p>
                    <p>
                      <strong>Date:</strong> {invoice.date}
                    </p>
                    <p>
                      <strong>Amount:</strong> ₹{invoice.amount}
                    </p>
                    <p>
                      <strong>Status:</strong> {invoice.status}
                    </p>
                    <p>
                      <strong>Payment Mode:</strong> {invoice.paymentMode}
                    </p>
                  </>
                ) : (
                  <p>No invoice available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderWithInvoice;
