import React from "react";
import { useParams } from "react-router-dom";
import {
  useGetQuotationByIdQuery,
  useExportQuotationMutation,
} from "../../api/quotationApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import { useGetUserByIdQuery } from "../../api/userApi";
import img from "../../assets/img/avatar/avatar-1.jpg";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { toast } from "react-toastify";

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
  console.log(customer?.address ?? "Address not available");
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
      console.error("Export failed:", error);
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
    const customer = customers.find((c) => c.customerId === customerId);
    return customer ? customer.name : "Unknown";
  };
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading quotation details.</p>;
  if (!quotation) return <p>Quotation not found.</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header d-flex justify-content-between">
          <h4> Created by: {getUserName(quotation.createdBy)}</h4>
          <a href="/quotations/list" className="btn btn-primary">
            <i data-feather="arrow-left" className="me-2"></i>Back to Quotations
          </a>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="row align-items-center mb-3 border-bottom pb-3">
              <div className="col-md-6"></div>
              <div className="col-md-6 text-end">
                <h5 className="text-gray mb-1">
                  Quotation: #{quotation.document_title}
                </h5>
                <p className="mb-1">Created Date: {quotation.quotation_date}</p>
                <p>Due Date: {quotation.due_date}</p>
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

            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {quotation.products.map((product, index) => (
                  <tr key={index}>
                    <td>{product.name}</td>
                    <td>{product.quantity}</td>
                    <td>{product.sellingPrice}</td>
                    <td>{product.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-end mt-3">
              <h5>Subtotal: ₹{quotation.finalAmount}</h5>
              {quotation.include_gst && (
                <p>
                  GST ({quotation.gst_value}%): ₹
                  {(quotation.finalAmount * quotation.gst_value) / 100}
                </p>
              )}
              <h4>Total: ₹{quotation.finalAmount}</h4>
            </div>
          </div>
        </div>
        <div class="d-flex justify-content-center align-items-center mb-4">
          <button
            onClick={() => handleDownload(quotation.id)}
            class="btn btn-primary d-flex justify-content-center align-items-center me-2"
          >
            <i class="ti ti-printer me-2"></i>Download Quotation
          </button>
          <a
            href="#"
            class="btn btn-secondary d-flex justify-content-center align-items-center border"
          >
            <i class="ti ti-copy me-2"></i>Clone Quotation
          </a>
        </div>
      </div>
    </div>
  );
};

export default QuotationsDetails;
