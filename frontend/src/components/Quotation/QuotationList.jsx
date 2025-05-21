import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import {
  useGetAllQuotationsQuery,
  useDeleteQuotationMutation,
} from "../../api/quotationApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useNavigate } from "react-router-dom";
import TableHeader from "../Common/TableHeader";
import Actions from "../Common/Actions";
import ReactPaginate from "react-paginate";
import QuotationProductModal from "./QuotationProductModal";
import DeleteModal from "../Common/DeleteModal";
import { toast } from "sonner";

const QuotationList = () => {
  const navigate = useNavigate();
  const {
    data: quotationsData,
    isLoading,
    isError,
    refetch,
  } = useGetAllQuotationsQuery();
  const { data: customersData } = useGetCustomersQuery();
  const { data: usersData } = useGetAllUsersQuery();
  const [deleteQuotation, { isLoading: isDeleting }] =
    useDeleteQuotationMutation();

  const quotations = quotationsData || [];
  const customers = customersData?.data || [];
  const users = usersData?.users || [];

  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [quotationToDelete, setQuotationToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Define helper functions before formattedQuotations
  const getProductCount = (products) => {
    const parsedProducts =
      typeof products === "string"
        ? JSON.parse(products || "[]")
        : products || [];
    return parsedProducts.length;
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find((c) => c.customerId === customerId);
    return customer ? customer.name : "Unknown";
  };

  const getUserName = (createdBy) => {
    if (!users || users.length === 0 || !createdBy) return "Unknown";
    const user = users.find(
      (u) => u.userId && u.userId.trim() === createdBy.trim()
    );
    return user ? user.name : "Unknown";
  };

  // Format quotations for tableData prop
  const formattedQuotations = quotations.map((quotation) => ({
    quotationId: quotation.quotationId,
    document_title: quotation.document_title || "N/A",
    quotation_date: new Date(quotation.quotation_date).toLocaleDateString(),
    due_date: new Date(quotation.due_date).toLocaleDateString(),
    reference_number: quotation.reference_number || "N/A",
    include_gst: quotation.include_gst ? "Yes" : "No",
    products: getProductCount(quotation.products),
    discountType: quotation.discountType || "N/A",
    roundOff: quotation.roundOff || "N/A",
    createdBy: getUserName(quotation.createdBy),
    customer: getCustomerName(quotation.customerId),
    finalAmount: `₹${quotation.finalAmount || 0}`,
  }));

  if (isLoading) return <p>Loading quotations...</p>;
  if (isError) return <p>Error fetching quotations!</p>;

  const handleAddQuotation = () => navigate("/quotations/add");

  const handleDeleteClick = (quotation) => {
    setQuotationToDelete(quotation);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!quotationToDelete?.quotationId) {
      toast.error("No quotation selected for deletion");
      setShowDeleteModal(false);
      return;
    }
    try {
      await deleteQuotation(quotationToDelete.quotationId).unwrap();
      toast.success("Quotation deleted successfully!");
      setShowDeleteModal(false);
      setQuotationToDelete(null);
      refetch();
      // Adjust pagination if needed
      if (currentQuotations.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      toast.error(
        `Failed to delete quotation: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const handleOpenProductModal = (products) => {
    const parsedProducts =
      typeof products === "string"
        ? JSON.parse(products || "[]")
        : products || [];
    setSelectedProducts(parsedProducts);
    setShowProductModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProducts([]);
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentQuotations = quotations.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected + 1);
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Quotations"
          subtitle="Manage your quotations list"
          onAdd={handleAddQuotation}
          tableData={formattedQuotations}
        />
        <div className="card">
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
                  {currentQuotations.length > 0 ? (
                    currentQuotations.map((quotation) => (
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
                              handleOpenProductModal(quotation.products)
                            }
                            aria-label="View products"
                          >
                            View Products ({getProductCount(quotation.products)}
                            )
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
                            editUrl={`/quotations/${quotation.quotationId}/edit`}
                            onDelete={() => handleDeleteClick(quotation)}
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
            <ReactPaginate
              previousLabel={"Previous"}
              nextLabel={"Next"}
              breakLabel={"..."}
              pageCount={Math.ceil(quotations.length / itemsPerPage)}
              marginPagesDisplayed={2}
              pageRangeDisplayed={3}
              onPageChange={handlePageChange}
              containerClassName={"pagination justify-content-end mb-0"}
              pageClassName={"page-item"}
              pageLinkClassName={"page-link"}
              previousClassName={"page-item"}
              previousLinkClassName={"page-link"}
              nextClassName={"page-item"}
              nextLinkClassName={"page-link"}
              breakClassName={"page-item"}
              breakLinkClassName={"page-link"}
              activeClassName={"active"}
            />
          </div>
        </div>
      </div>
      <QuotationProductModal
        show={showProductModal}
        onHide={handleCloseProductModal}
        products={selectedProducts}
      />
      {showDeleteModal && (
        <DeleteModal
          item={quotationToDelete}
          itemType="Quotation"
          isVisible={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setQuotationToDelete(null);
          }}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default QuotationList;
