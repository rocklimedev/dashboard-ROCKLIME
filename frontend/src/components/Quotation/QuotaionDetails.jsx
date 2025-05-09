import React from "react";
import { useParams } from "react-router-dom";
import {
  useGetQuotationByIdQuery,
  useExportQuotationMutation,
} from "../../api/quotationApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import { useGetUserByIdQuery } from "../../api/userApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { toast } from "react-toastify";
import logo from "../../assets/img/logo.png";

const QuotationsDetails = () => {
  const { id } = useParams();
  const { data: quotation, error, isLoading } = useGetQuotationByIdQuery(id);
  const { data: usersData } = useGetAllUsersQuery();
  const { data: customersData } = useGetCustomersQuery();
  const users = usersData?.users || [];
  const customers = customersData?.data || [];
  const { data: customer } = useGetCustomerByIdQuery(quotation?.customerId, {
    skip: !quotation?.customerId,
  });
  const [exportQuotation] = useExportQuotationMutation();
  const { data: user } = useGetUserByIdQuery(quotation?.createdBy, {
    skip: !quotation?.createdBy,
  });

  const handleDownload = async () => {
    try {
      if (!id) {
        toast.error("Quotation ID is missing.");
        return;
      }

      const blob = await exportQuotation(id).unwrap();

      if (!blob) {
        toast.error("Invalid export data.");
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quotation_${id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Quotation downloaded successfully!");
    } catch (error) {
      toast.error("Failed to export quotation.");
    }
  };

  const getUserName = (createdBy) => {
    if (!users || users.length === 0 || !createdBy) return "Unknown";
    const user = users.find(
      (u) => u.userId && u.userId.trim() === createdBy.trim()
    );
    return user ? user.name : "Unknown";
  };

  const getCustomerName = (customerId) => {
    if (!customers || customers.length === 0 || !customerId) return "Unknown";
    const customer = customers.find((c) => c.customerId === customerId);
    return customer ? customer.name : "Unknown";
  };

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p>Loading quotation details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p className="text-danger">Error loading quotation details.</p>
        </div>
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p>Quotation not found.</p>
        </div>
      </div>
    );
  }

  // Ensure products is an array, fallback to empty array if undefined or not an array
  const products = Array.isArray(quotation.products) ? quotation.products : [];

  // Calculate subtotal (sum of product totals)
  const subtotal = products.reduce(
    (sum, product) => sum + Number(product.total || 0),
    0
  );

  // Calculate GST amount
  const gstAmount =
    quotation.include_gst && quotation.gst_value
      ? (subtotal * Number(quotation.gst_value)) / 100
      : 0;

  // Calculate final total (subtotal + GST)
  const finalTotal = subtotal + gstAmount;

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Header with Logo and Quotation Info */}
        <div className="page-header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <img
              src={logo}
              alt="Company Logo"
              style={{ width: "50px", marginRight: "20px" }}
            />
            <h4 className="mb-0">Quotation Details</h4>
          </div>
          <a href="/quotations/list" className="btn btn-primary">
            <i data-feather="arrow-left" className="me-2"></i>Back to Quotations
          </a>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="row align-items-center mb-3 border-bottom pb-3">
              <div className="col-md-6">
                <h5 className="text-gray mb-1">
                  Created by: {getUserName(quotation.createdBy)}
                </h5>
                <p className="mb-1">
                  Reference: {quotation.reference_number || "N/A"}
                </p>
              </div>
              <div className="col-md-6 text-end">
                <h5 className="text-gray mb-1">
                  Quotation: #{quotation.document_title || "N/A"}
                </h5>
                <p className="mb-1">
                  Created Date:{" "}
                  {quotation.quotation_date
                    ? new Date(quotation.quotation_date).toLocaleDateString()
                    : "N/A"}
                </p>
                <p>
                  Due Date:{" "}
                  {quotation.due_date
                    ? new Date(quotation.due_date).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="row border-bottom mb-3 pb-3">
              <div className="col-md-6">
                <h4>From: CHABBRA MARBEL</h4>
                <p>NATIONAL MARKET, Near Peeragarhi...</p>
              </div>
              <div className="col-md-6 text-end">
                <h4>To: {getCustomerName(quotation.customerId)}</h4>
                <p>
                  {customer?.address
                    ? customer.address
                    : "Address not available"}
                </p>
              </div>
            </div>

            {/* Products Table */}
            {products.length > 0 ? (
              <table
                className="table table-bordered"
                aria-label="Quotation products"
              >
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => (
                    <tr key={index}>
                      <td>{product.name || "N/A"}</td>
                      <td>{product.qty || product.quantity || "N/A"}</td>
                      <td>
                        {product.sellingPrice
                          ? `₹${Number(product.sellingPrice).toFixed(2)}`
                          : "N/A"}
                      </td>
                      <td>
                        {product.discount
                          ? `${
                              product.discountType === "percent"
                                ? `${product.discount}%`
                                : `₹${Number(product.discount).toFixed(2)}`
                            }`
                          : "N/A"}
                      </td>
                      <td>
                        {product.tax
                          ? `${Number(product.tax).toFixed(2)}%`
                          : "0%"}
                      </td>
                      <td>
                        {product.total
                          ? `₹${Number(product.total).toFixed(2)}`
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-muted">
                No products available for this quotation.
              </p>
            )}

            <div className="text-end mt-3">
              <h5>Subtotal: ₹{subtotal.toFixed(2)}</h5>
              {quotation.include_gst && quotation.gst_value && (
                <p>
                  GST ({quotation.gst_value}%): ₹{gstAmount.toFixed(2)}
                </p>
              )}
              <h4>Total: ₹{finalTotal.toFixed(2)}</h4>
              {quotation.roundOff && (
                <p>Round Off: ₹{Number(quotation.roundOff).toFixed(2)}</p>
              )}
              {quotation.signature_name && (
                <p>Signed by: {quotation.signature_name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-center align-items-center mb-4">
          <button
            onClick={handleDownload}
            className="btn btn-primary d-flex justify-content-center align-items-center me-2"
            aria-label="Download quotation"
          >
            <i className="ti ti-printer me-2"></i>Download Quotation
          </button>
          <button
            className="btn btn-secondary d-flex justify-content-center align-items-center border"
            onClick={() =>
              toast.info("Clone functionality not implemented yet.")
            }
            aria-label="Clone quotation"
          >
            <i className="ti ti-copy me-2"></i>Clone Quotation
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotationsDetails;
