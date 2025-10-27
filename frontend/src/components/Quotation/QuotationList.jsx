import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  useGetAllQuotationsQuery,
  useDeleteQuotationMutation,
} from "../../api/quotationApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import {
  FaSearch,
  FaEye,
  FaTrash,
  FaFileInvoice,
  FaWhatsapp,
} from "react-icons/fa";
import { EditOutlined } from "@ant-design/icons";
import { BsThreeDotsVertical } from "react-icons/bs";
import QuotationProductModal from "./QuotationProductModal";
import DeleteModal from "../Common/DeleteModal";
import { toast } from "sonner";
import { Table, Dropdown, Menu, Button, Input, DatePicker, Select } from "antd";
import PageHeader from "../Common/PageHeader";
import DataTablePagination from "../Common/DataTablePagination";
import { useCreateInvoiceMutation } from "../../api/invoiceApi";
import CreateInvoiceFromQuotation from "../Invoices/CreateInvoiceFromQuotation";
import moment from "moment";

const { RangePicker } = DatePicker;
const { Option } = Select;

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
  const [createInvoice] = useCreateInvoiceMutation();

  const quotations = quotationsData || [];
  const customers = customersData?.data || [];
  const users = usersData?.users || [];

  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [quotationToDelete, setQuotationToDelete] = useState(null);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [activeTab, setActiveTab] = useState("All");
  const [filters, setFilters] = useState({
    finalAmount: null,
    quotationDate: null,
    customerId: null,
    dateRange: null,
  });
  const itemsPerPage = 10;

  // Helper functions (unchanged)
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

  const customerMap = useMemo(() => {
    return customers.reduce((map, customer) => {
      map[customer.customerId] = customer.name;
      return map;
    }, {});
  }, [customers]);

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

  const filteredQuotations = useMemo(() => {
    let result = groupedQuotations[activeTab] || [];

    // Apply search term filter
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

    // Apply additional filters
    if (filters.finalAmount) {
      result = result.filter(
        (q) =>
          q.finalAmount &&
          q.finalAmount.toString().includes(filters.finalAmount)
      );
    }
    if (filters.quotationDate) {
      result = result.filter(
        (q) =>
          q.quotation_date &&
          moment(q.quotation_date).format("YYYY-MM-DD") ===
            moment(filters.quotationDate).format("YYYY-MM-DD")
      );
    }
    if (filters.customerId) {
      result = result.filter((q) => q.customerId === filters.customerId);
    }
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange;
      result = result.filter(
        (q) =>
          q.quotation_date &&
          moment(q.quotation_date).isBetween(start, end, "day", "[]")
      );
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
      case "Price High":
        result = [...result].sort(
          (a, b) => (b.finalAmount || 0) - (a.finalAmount || 0)
        );
        break;
      case "Price Low":
        result = [...result].sort(
          (a, b) => (a.finalAmount || 0) - (b.finalAmount || 0)
        );
        break;
      default:
        break;
    }

    return result;
  }, [groupedQuotations, activeTab, searchTerm, sortBy, filters]);

  const currentQuotations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQuotations.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredQuotations, currentPage]);

  const handleShareOnWhatsApp = (quotation) => {
    let itemsArray = [];
    if (quotation.items && Array.isArray(quotation.items)) {
      itemsArray = quotation.items;
    } else if (quotation.products) {
      try {
        itemsArray = JSON.parse(quotation.products);
      } catch (e) {
        itemsArray = [];
      }
    }

    const items = itemsArray
      .map(
        (item, index) =>
          `  ${index + 1}. Product ID: ${item.productId}\n` +
          `     Quantity: ${item.quantity}\n` +
          `     Discount: ${item.discount}\n` +
          `     Tax: ${item.tax}\n` +
          `     Total: ₹${item.total}`
      )
      .join("\n");

    const message = `
==== QUOTATION DETAILS ====
Document Title: ${quotation?.document_title || "N/A"}
Quotation Date: ${quotation?.quotation_date || "N/A"}
Due Date: ${quotation?.due_date || "N/A"}
Reference Number: ${quotation?.reference_number || "N/A"}
Include GST: ${quotation?.include_gst ? "Yes" : "No"}
GST Value: ${quotation?.gst_value || 0}
Discount Type: ${quotation?.discountType || "N/A"}
Round Off: ₹${quotation?.roundOff || 0}

-- ITEMS --
${items || "No items found"}

Final Amount: ₹${quotation?.finalAmount || 0}

Created By: ${quotation?.signature_name || "N/A"}
Customer ID: ${quotation?.customerId || "N/A"}
Ship To: ${quotation?.shipTo || "N/A"}

View Quotation: ${window.location.origin}/quotations/${quotation.quotationId}
==========================
  `;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const columns = [
    {
      title: "S.No.",
      dataIndex: "sNo",
      key: "sNo",
      width: 70, // Fixed width for better layout control
    },
    {
      title: "Quotation Title",
      dataIndex: "quotationTitle",
      key: "quotationTitle",
      width: 150,
      render: (text, record) => (
        <Link to={`/quotations/${record.quotationId}`}>{text || "N/A"}</Link>
      ),
    },
    {
      title: "Quotation Date",
      dataIndex: "quotationDate",
      key: "quotationDate",
      width: 120,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <DatePicker
            style={{ width: "100%", marginBottom: 8 }}
            value={selectedKeys[0] ? moment(selectedKeys[0]) : null}
            onChange={(date) => setSelectedKeys(date ? [date] : [])}
            placeholder="Select Quotation Date"
          />
          <div>
            <Button
              type="primary"
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  quotationDate: selectedKeys[0]
                    ? selectedKeys[0].toDate()
                    : null,
                }));
                confirm();
              }}
              size="small"
              style={{ width: 90, marginRight: 8 }}
            >
              OK
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                setFilters((prev) => ({ ...prev, quotationDate: null }));
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </div>
        </div>
      ),
      filterIcon: (filtered) => (
        <FaSearch style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 120,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <RangePicker
            style={{ width: "100%", marginBottom: 8 }}
            value={
              selectedKeys[0]
                ? [moment(selectedKeys[0][0]), moment(selectedKeys[0][1])]
                : null
            }
            onChange={(dates) =>
              setSelectedKeys(dates ? [[dates[0], dates[1]]] : [])
            }
            placeholder={["Start Date", "End Date"]}
          />
          <div>
            <Button
              type="primary"
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  dateRange: selectedKeys[0]
                    ? [selectedKeys[0][0].toDate(), selectedKeys[0][1].toDate()]
                    : null,
                }));
                confirm();
              }}
              size="small"
              style={{ width: 90, marginRight: 8 }}
            >
              OK
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                setFilters((prev) => ({ ...prev, dateRange: null }));
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </div>
        </div>
      ),
      filterIcon: (filtered) => (
        <FaSearch style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
    },
    {
      title: "Quotation Number",
      dataIndex: "referenceNumber",
      key: "referenceNumber",
      width: 150,
    },
    {
      title: "Products",
      dataIndex: "products",
      key: "products",
      width: 120,
      render: (text, record) => (
        <button
          className="btn btn-link"
          onClick={() => handleOpenProductModal(record.products, record)} // Pass record as quotation
          style={{ color: "#e31e24" }}
          aria-label="Quick View"
        >
          Quick View ({getProductCount(record.products)})
        </button>
      ),
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      width: 150,
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Select
            style={{ width: "100%", marginBottom: 8 }}
            value={selectedKeys[0]}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            placeholder="Select Customer"
            allowClear
          >
            {customers.map((customer) => (
              <Option key={customer.customerId} value={customer.customerId}>
                {customer.name}
              </Option>
            ))}
          </Select>
          <div>
            <Button
              type="primary"
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  customerId: selectedKeys[0] || null,
                }));
                confirm();
              }}
              size="small"
              style={{ width: 90, marginRight: 8 }}
            >
              OK
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                setFilters((prev) => ({ ...prev, customerId: null }));
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </div>
        </div>
      ),
      filterIcon: (filtered) => (
        <FaSearch style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
      render: (text, record) => (
        <Link to={`/customer/${record.customerId}`}>{text}</Link>
      ),
    },
    {
      title: "Final Amount",
      dataIndex: "finalAmount",
      key: "finalAmount",
      width: 120,
      sorter: (a, b) =>
        parseFloat(a.finalAmount.replace("₹", "")) -
        parseFloat(b.finalAmount.replace("₹", "")),
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Enter Final Amount"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            style={{ width: "100%", marginBottom: 8 }}
          />
          <div>
            <Button
              type="primary"
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  finalAmount: selectedKeys[0] || null,
                }));
                confirm();
              }}
              size="small"
              style={{ width: 90, marginRight: 8 }}
            >
              OK
            </Button>
            <Button
              onClick={() => {
                clearFilters();
                setFilters((prev) => ({ ...prev, finalAmount: null }));
                confirm();
              }}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
          </div>
        </div>
      ),
      filterIcon: (filtered) => (
        <FaSearch style={{ color: filtered ? "#1890ff" : undefined }} />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100, // Fixed width to prevent cropping
      fixed: "right", // Fix the Actions column to the right for better accessibility
      render: (_, record) => (
        <div className="d-flex align-items-center">
          <span
            onClick={() =>
              navigate(`/quotations/${record.quotationId}/edit`, {
                state: { quotation: record },
              })
            }
            style={{ cursor: "pointer", marginRight: 8 }}
            title="Edit Quotation"
          >
            <EditOutlined />
          </span>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="view">
                  <Link
                    to={`/quotations/${record.quotationId}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                    title="View Quotation"
                  >
                    <FaEye style={{ marginRight: 8 }} />
                    View
                  </Link>
                </Menu.Item>
                <Menu.Item
                  key="delete"
                  onClick={() => handleDeleteClick(record)}
                  disabled={isDeleting}
                  style={{ color: "#ff4d4f" }}
                  title="Delete Quotation"
                >
                  <FaTrash style={{ marginRight: 8 }} />
                  Delete
                </Menu.Item>
                <Menu.Item
                  key="convert-to-order"
                  onClick={() => handleConvertToOrder(record)}
                  title="Convert to Order"
                >
                  <FaFileInvoice style={{ marginRight: 8 }} />
                  Convert to Order
                </Menu.Item>
                <Menu.Item
                  key="share-whatsapp"
                  onClick={() => handleShareOnWhatsApp(record)}
                  title="Share on WhatsApp"
                  style={{ color: "#25D366" }}
                >
                  <FaWhatsapp style={{ marginRight: 8 }} />
                  Share on WhatsApp
                </Menu.Item>
              </Menu>
            }
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<BsThreeDotsVertical />}
              aria-label="More actions"
            />
          </Dropdown>
        </div>
      ),
    },
  ];

  const formattedTableData = useMemo(() => {
    return currentQuotations.map((quotation, index) => ({
      key: quotation.quotationId,
      sNo: (currentPage - 1) * itemsPerPage + index + 1,
      quotationTitle: quotation.document_title || "N/A",
      quotationDate: quotation.quotation_date
        ? new Date(quotation.quotation_date).toLocaleDateString()
        : "N/A",
      dueDate: quotation.due_date
        ? new Date(quotation.due_date).toLocaleDateString()
        : "N/A",
      referenceNumber: quotation.reference_number || "N/A",
      products: quotation.products,
      customer: getCustomerName(quotation.customerId),
      customerId: quotation.customerId,
      finalAmount: `₹${quotation.finalAmount || 0}`,
      quotationId: quotation.quotationId,
    }));
  }, [currentQuotations, currentPage, customers]);

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
      setShowDeleteModal(false);
      setQuotationToDelete(null);
      refetch();
      if (currentQuotations.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (err) {
      toast.error(
        `Failed to delete quotation: ${
          err.data?.message || err.data?.error || err.message || "Unknown error"
        }`
      );
    }
  };

  const handleOpenProductModal = (products, quotation) => {
    const parsedProducts =
      typeof products === "string"
        ? JSON.parse(products || "[]")
        : products || [];
    setSelectedProducts(parsedProducts);
    setSelectedQuotation(quotation); // Set the quotation object
    setShowProductModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProducts([]);
  };

  const handleOpenInvoiceModal = (quotation) => {
    setSelectedQuotation(quotation);
    setShowInvoiceModal(true);
  };

  const handleCloseInvoiceModal = () => {
    setShowInvoiceModal(false);
    setSelectedQuotation(null);
  };

  const handleConvertToOrder = (quotation) => {
    navigate("/order/add", {
      state: {
        quotationData: {
          title: quotation.quotationTitle || "",
          createdFor: quotation.customerId || "",
          dueDate: quotation.due_date || "",
          source: quotation.referenceNumber
            ? `Quotation #${quotation.referenceNumber}`
            : "",
          description: `Converted from Quotation #${
            quotation.referenceNumber || "N/A"
          }`,
          quotationId: quotation.quotationId || "",
        },
      },
    });
  };

  const handlePageChange = ({ selected }) => {
    setCurrentPage(selected + 1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("Recently Added");
    setActiveTab("All");
    setFilters({
      finalAmount: null,
      quotationDate: null,
      customerId: null,
      dateRange: null,
    });
    setCurrentPage(1);
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
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Quotations"
            subtitle="Manage your Quotations"
            tableData={formattedTableData}
            exportOptions={{ pdf: true, excel: true }}
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
                  <Select
                    style={{ width: 200, marginLeft: 10 }}
                    value={sortBy}
                    onChange={(value) => setSortBy(value)}
                  >
                    <Option value="Recently Added">Recently Added</Option>
                    <Option value="Ascending">Reference Ascending</Option>
                    <Option value="Descending">Reference Descending</Option>
                    <Option value="Price High">Price High to Low</Option>
                    <Option value="Price Low">Price Low to High</Option>
                  </Select>
                </div>
              </div>
            </div>
            <div className="tab-content" id="pills-tabContent">
              {Object.entries(groupedQuotations).map(([status]) => (
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
                    <div
                      className="table-responsive"
                      style={{ overflowX: "auto" }}
                    >
                      <Table
                        className="table table-hover"
                        columns={columns}
                        dataSource={formattedTableData}
                        pagination={false}
                        rowKey="key"
                        scroll={{ x: "max-content" }} // Enable horizontal scrolling
                      />
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
          selectedQuotation={selectedQuotation} // Pass selectedQuotation
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
        {showInvoiceModal && selectedQuotation && (
          <CreateInvoiceFromQuotation
            quotation={selectedQuotation}
            onClose={handleCloseInvoiceModal}
            createInvoice={createInvoice}
            customerMap={customerMap}
            addressMap={{}}
          />
        )}
      </div>
    </div>
  );
};

export default QuotationList;
