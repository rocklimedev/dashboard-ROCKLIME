import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  useGetAllQuotationsQuery,
  useDeleteQuotationMutation,
} from "../../api/quotationApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { FaSearch, FaEye, FaTrash, FaEdit } from "react-icons/fa";
import QuotationProductModal from "./QuotationProductModal";
import DeleteModal from "../Common/DeleteModal";
import { toast } from "sonner";
import { Dropdown, Menu, Button } from "antd"; // Import Ant Design components
import { MoreOutlined } from "@ant-design/icons"; // Ant Design icon for the dropdown trigger
import PageHeader from "../Common/PageHeader";
import DataTablePagination from "../Common/DataTablePagination";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [activeTab, setActiveTab] = useState("All");
  const itemsPerPage = 10;

  // Define helper functions
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

  // Memoized grouped quotations for tab-based filtering
  const groupedQuotations = useMemo(
    () => ({
      All: quotations,
      Accepted: quotations.filter(
        (q) => q.status?.toLowerCase() === "accepted"
      ),
      Pending: quotations.filter((q) => q.status?.toLowerCase() === "pending"),
      Rejected: quotations.filter(
        (q) => q.status?.toLowerCase() === "rejected"
      ),
    }),
    [quotations]
  );

  // Filtered and sorted quotations
  const filteredQuotations = useMemo(() => {
    let result = groupedQuotations[activeTab] || [];

    // Apply search filter
    if (searchTerm.trim()) {
      result = result.filter((q) => {
        const customerName = getCustomerName(q.customerId);
        return (
          q.document_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.reference_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          customerName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "Ascending":
        result = [...result].sort((a, b) =>
          (a.reference_number || "").localeCompare(b.reference_number || "")
        );
        break;
      case "Descending":
        result = [...result].sort((a, b) =>
          (b.reference_number || "").localeCompare(a.reference_number || "")
        );
        break;
      case "Recently Added":
        result = [...result].sort(
          (a, b) => new Date(b.quotation_date) - new Date(a.quotation_date)
        );
        break;
      default:
        break;
    }

    return result;
  }, [groupedQuotations, activeTab, searchTerm, sortBy]);

  // Paginated quotations
  const currentQuotations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQuotations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredQuotations, currentPage]);

  // Format data for tableData prop
  const formattedTableData = useMemo(() => {
    return currentQuotations.map((quotation) => ({
      quotationId: quotation.quotationId,
      document_title: quotation.document_title || "N/A",
      quotation_date: quotation.quotation_date
        ? new Date(quotation.quotation_date).toLocaleDateString()
        : "N/A",
      due_date: quotation.due_date
        ? new Date(quotation.due_date).toLocaleDateString()
        : "N/A",
      reference_number: quotation.reference_number || "N/A",
      include_gst: quotation.include_gst ? "Yes" : "No",
      products: getProductCount(quotation.products),
      discountType: quotation.discountType || "N/A",
      roundOff: quotation.roundOff || "N/A",
      createdBy: getUserName(quotation.createdBy),
      customer: getCustomerName(quotation.customerId),
      finalAmount: `₹${quotation.finalAmount || 0}`,
    }));
  }, [currentQuotations, customers, users]);

  // Handlers
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

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected + 1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("Recently Added");
    setActiveTab("All");
    setCurrentPage(1);
    toast.success("Filters cleared!");
  };

  if (isLoading) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p>Loading quotations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="content">
        <div className="card">
          <div className="card-body">
            <div className="alert alert-danger" role="alert">
              Error fetching quotations!
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <PageHeader
          title="Quotations"
          subtitle="Manage your Quotations"
          onAdd={handleAddQuotation}
          tableData={formattedTableData} // Pass formatted data for export
        />
        <div className="card-body">
          <div className="row">
            <div className="col-lg-12">
              <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                <div className="input-icon-start position-relative">
                  <span className="input-icon-addon">
                    <FaSearch />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Quotations"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    aria-label="Search quotations"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="tab-content" id="pills-tabContent">
            {Object.entries(groupedQuotations).map(([status, list]) => (
              <div
                className={`tab-pane fade ${
                  activeTab === status ? "show active" : ""
                }`}
                id={`pills-${status}`}
                role="tabpanel"
                aria-labelledby={`tab-${status}`}
                key={status}
              >
                {currentQuotations.length === 0 ? (
                  <p className="text-muted">
                    No {status.toLowerCase()} quotations match the applied
                    filters
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Quotation Title</th>
                          <th>Quotation Date</th>
                          <th>Due Date</th>
                          <th>Reference Number</th>
                          <th>Products</th>
                          <th>Created By</th>
                          <th>Customer</th>
                          <th>Final Amount</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentQuotations.map((quotation) => (
                          <tr key={quotation.quotationId}>
                            <td>{quotation.document_title || "N/A"}</td>
                            <td>
                              {new Date(
                                quotation.quotation_date
                              ).toLocaleDateString()}
                            </td>
                            <td>
                              {new Date(
                                quotation.due_date
                              ).toLocaleDateString()}
                            </td>
                            <td>{quotation.reference_number || "N/A"}</td>
                            <td>
                              <button
                                className="btn btn-link"
                                onClick={() =>
                                  handleOpenProductModal(quotation.products)
                                }
                                style={{ color: "#e31e24" }}
                                aria-label="View products"
                              >
                                View Products (
                                {getProductCount(quotation.products)})
                              </button>
                            </td>
                            <td>{getUserName(quotation.createdBy)}</td>
                            <td>{getCustomerName(quotation.customerId)}</td>
                            <td>₹{quotation.finalAmount || 0}</td>
                            <td>
                              <Dropdown
                                overlay={
                                  <Menu>
                                    <Menu.Item key="view">
                                      <Link
                                        to={`/quotations/${quotation.quotationId}`}
                                        style={{
                                          textDecoration: "none",
                                          color: "inherit",
                                        }}
                                        title="View Quotation"
                                      >
                                        <FaEye style={{ marginRight: 8 }} />
                                        View
                                      </Link>
                                    </Menu.Item>
                                    <Menu.Item key="edit">
                                      <Link
                                        to={`/quotations/${quotation.quotationId}/edit`}
                                        style={{
                                          textDecoration: "none",
                                          color: "inherit",
                                        }}
                                        title="Edit Quotation"
                                      >
                                        <FaEdit style={{ marginRight: 8 }} />
                                        Edit
                                      </Link>
                                    </Menu.Item>
                                    <Menu.Item
                                      key="delete"
                                      onClick={() =>
                                        handleDeleteClick(quotation)
                                      }
                                      disabled={isDeleting}
                                      style={{ color: "#ff4d4f" }}
                                      title="Delete Quotation"
                                    >
                                      <FaTrash style={{ marginRight: 8 }} />
                                      Delete
                                    </Menu.Item>
                                  </Menu>
                                }
                                trigger={["click"]}
                                placement="bottomRight"
                              >
                                <Button
                                  type="text"
                                  icon={<MoreOutlined />}
                                  aria-label="More actions"
                                />
                              </Dropdown>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredQuotations.length > itemsPerPage && (
                      <div className="pagination-section mt-4">
                        <DataTablePagination
                          totalItems={filteredQuotations.length}
                          itemNo={itemsPerPage}
                          onPageChange={handlePageChange}
                          currentPage={currentPage}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
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
    </>
  );
};

export default QuotationList;
