import React, { useState } from "react";
import ShowProducts from "./ShowProducts";
import { Link } from "react-router-dom";

const ShowQuotations = ({
  isQuotationsLoading,
  quotations,
  onConvertToOrder,
}) => {
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  console.log("onConvertToOrder:", onConvertToOrder); // Debugging

  return (
    <div className="order-body">
      {isQuotationsLoading ? (
        <p>Loading quotations...</p>
      ) : quotations?.length ? (
        quotations.map((quotation) => (
          <div key={quotation.quotationId} className="card bg-light mb-3">
            <div className="card-body">
              <span className="badge bg-dark fs-12 mb-2">
                Quotation Title: #{quotation.document_title}
              </span>
              <span className="badge bg-dark fs-12 mb-2">
                Due Date: {quotation.due_date}
              </span>
              <div className="row g-3">
                <div className="col-md-6">
                  <p className="fs-15 mb-1">
                    <span className="fs-14 fw-bold text-gray-9">
                      Created By:
                    </span>{" "}
                    {quotation.createdBy}
                  </p>
                  <p className="fs-15 mb-1">
                    <span className="fs-14 fw-bold text-gray-9">For:</span>{" "}
                    {quotation.customerId}
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="fs-15">
                    <span className="fs-14 fw-bold text-gray-9">Total:</span> ₹
                    {quotation.finalAmount}
                  </p>
                  <p className="fs-15">
                    <span className="fs-14 fw-bold text-gray-9">Date:</span>{" "}
                    {quotation.quotation_date || "N/A"}
                  </p>
                </div>
              </div>
              <div className="bg-info-transparent p-1 rounded text-center my-3">
                <p className="text-info fw-medium">
                  Confirm the requirements before any action.
                </p>
              </div>
              <div className="d-flex align-items-center justify-content-center flex-wrap gap-2">
                <Link
                  className="btn btn-md btn-orange"
                  to={`/quotations/${quotation.quotationId}`}
                  target="_blank"
                >
                  Open Quotation
                </Link>

                <button
                  className="btn btn-md btn-black"
                  onClick={() => onConvertToOrder(quotation)} // Pass selected quotation to parent
                >
                  Convert to Order
                </button>

                <button
                  className="btn btn-md btn-teal"
                  data-bs-toggle="modal"
                  data-bs-target="#products"
                  onClick={() => setSelectedQuotation(quotation)}
                >
                  View Products
                </button>
                <button className="btn btn-md btn-indigo">Print</button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p>No quotations available</p>
      )}

      {/* ShowProducts Modal */}
      {selectedQuotation && (
        <ShowProducts
          quotation={selectedQuotation}
          onClose={() => setSelectedQuotation(null)}
        />
      )}
    </div>
  );
};

export default ShowQuotations;
