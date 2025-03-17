import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllUsersQuery, useGetProfileQuery } from "../../api/userApi";
import { useNavigate } from "react-router-dom";
import TableHeader from "../Common/TableHeader";
import Actions from "../Common/Actions";
import QuotationProductModal from "./QuotationProductModal";

const QuotationList = () => {
  const navigate = useNavigate();
  const {
    data: quotationsData,
    isLoading,
    isError,
  } = useGetAllQuotationsQuery();
  const { data: customersData } = useGetCustomersQuery();
  const { data: usersData } = useGetAllUsersQuery();

  const quotations = quotationsData || [];
  const customers = customersData?.data || [];
  const users = usersData?.users || [];

  const [showModal, setShowModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  if (isLoading) return <p>Loading quotations...</p>;
  if (isError) return <p>Error fetching quotations!</p>;

  const handleAddQuotation = () => navigate("/quotations/add");

  const handleOpenModal = (products) => {
    setSelectedProducts(products || []);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProducts([]);
  };

  // Map Customer ID to Name
  const getCustomerName = (customerId) => {
    const customer = customers.find((c) => c.customerId === customerId);
    return customer ? customer.name : "Unknown";
  };

  // Map User ID to Name
  const getUserName = (createdBy) => {
    if (!users || users.length === 0 || !createdBy) return "Unknown";
    const user = users.find(
      (u) => u.userId && u.userId.trim() === createdBy.trim()
    );
    return user ? user.name : "Unknown";
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Quotations"
          subtitle="Manage your quotations list"
          onAdd={handleAddQuotation}
        />
        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set">
              <div className="search-input">
                <span className="btn-searchset">
                  <i className="ti ti-search fs-14 feather-search"></i>
                </span>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Quotation Title</th>
                    <th>Quotation Date</th>
                    <th>Due Date</th>
                    <th>Reference Number</th>
                    <th>Include GST</th>
                    <th>Products</th>
                    <th>Discount Type</th>
                    <th>Round Off</th>
                    <th>Created By</th>
                    <th>Customer</th>
                    <th>Final Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.length > 0 ? (
                    quotations.map((quotation) => (
                      <tr key={quotation.quotationId}>
                        <td>{quotation.document_title}</td>
                        <td>
                          {new Date(
                            quotation.quotation_date
                          ).toLocaleDateString()}
                        </td>
                        <td>
                          {new Date(quotation.due_date).toLocaleDateString()}
                        </td>
                        <td>{quotation.reference_number}</td>
                        <td>{quotation.include_gst ? "Yes" : "No"}</td>
                        <td>
                          <button
                            className="btn btn-link"
                            onClick={() =>
                              handleOpenModal(quotation.products || [])
                            }
                          >
                            View Products ({quotation.products?.length || 0})
                          </button>
                        </td>
                        <td>{quotation.discountType}</td>
                        <td>{quotation.roundOff}</td>
                        <td>{getUserName(quotation.createdBy)}</td>
                        <td>{getCustomerName(quotation.customerId)}</td>
                        <td>₹{quotation.finalAmount}</td>
                        <td>
                          <Actions
                            viewUrl={`/quotations/${quotation.quotationId}`}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="12" className="text-center">
                        No quotations available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <QuotationProductModal
        show={showModal}
        onHide={handleCloseModal}
        products={selectedProducts}
      />
    </div>
  );
};

export default QuotationList;
