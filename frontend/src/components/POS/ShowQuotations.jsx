import React, { useState } from "react";
import ShowProducts from "./ShowProducts";
import { Link } from "react-router-dom";
import { useAddToCartMutation } from "../../api/cartApi";
import { useGetProfileQuery } from "../../api/userApi"; // Import profile query

const ShowQuotations = ({ isQuotationsLoading, quotations }) => {
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [addToCartMutation] = useAddToCartMutation(); // ✅ Fixing how the mutation is accessed
  const { data: profileData, isLoading: isProfileLoading } =
    useGetProfileQuery();

  const handleConvertToOrder = (quotation) => {
    if (!quotation || !quotation.customerId) {
      console.error("Invalid quotation data");
      return;
    }

    if (!quotation.products || quotation.products.length === 0) {
      console.error("No products found in the quotation.");
      return;
    }

    // Use fetched userId
    const userId = profileData?.user?.userId;

    const cartData = {
      customerId: quotation.customerId,
      userId, // ✅ Correctly setting userId
      items: quotation.products.map((product) => ({
        productId: product.productId,
        quantity: product.qty,
        price: product.sellingPrice,
      })),
      totalAmount: quotation.finalAmount,
    };

    addToCartMutation(cartData)
      .unwrap()
      .then(() => alert("Cart successfully updated!"))
      .catch((error) => console.error("Error adding to cart:", error));
  };

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
                  onClick={() => handleConvertToOrder(quotation)}
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
