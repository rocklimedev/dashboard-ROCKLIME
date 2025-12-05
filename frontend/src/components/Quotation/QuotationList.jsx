import React, { useState, useMemo, useEffect } from "react";
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
import { EditOutlined, HomeOutlined } from "@ant-design/icons";
import { BsThreeDotsVertical } from "react-icons/bs";

import QuotationProductModal from "./QuotationProductModal";
import DeleteModal from "../Common/DeleteModal";
import { message } from "antd";
import {
  Table,
  Dropdown,
  Menu,
  Button,
  Input,
  DatePicker,
  Select,
  Pagination,
} from "antd";
import PageHeader from "../Common/PageHeader";
import CreateInvoiceFromQuotation from "../Invoices/CreateInvoiceFromQuotation";
import moment from "moment";
import PermissionGate from "../../context/PermissionGate";
import { useAuth } from "../../context/AuthContext";

const { RangePicker } = DatePicker;
const { Option } = Select;

/* -------------------------------------------------------------------------- */
/*                               QuotationList                                */
/* -------------------------------------------------------------------------- */
const QuotationList = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();

  /* ------------------------------ RTK Queries ----------------------------- */
  const {
    data: quotationsData,
    isLoading,
    isError,
    refetch,
  } = useGetAllQuotationsQuery({ sort: "quotation_date", order: "desc" });
  const { data: customersData } = useGetCustomersQuery();
  const { data: usersData } = useGetAllUsersQuery();
  const [deleteQuotation, { isLoading: isDeleting }] =
    useDeleteQuotationMutation();

  const quotations = quotationsData || [];
  const customers = customersData?.data || [];
  const users = usersData?.users || [];

  /* ------------------------------- State --------------------------------- */
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [quotationToDelete, setQuotationToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("Recently Added");
  const [activeTab, setActiveTab] = useState("All");

  const [filters, setFilters] = useState({
    finalAmount: null,
    quotationDate: null,
    customerId: null,
    dateRange: null,
  });

  /* -------------------------- Reset on mount --------------------------- */
  useEffect(() => {
    setSortBy("Recently Added");
    setSearchTerm("");
    setActiveTab("All");
    setFilters({
      finalAmount: null,
      quotationDate: null,
      customerId: null,
      dateRange: null,
    });
    setCurrentPage(1);
    setPageSize(10);
  }, []);

  /* --------------------------- Helper functions -------------------------- */
  const getProductCount = (products) => {
    const parsed =
      typeof products === "string"
        ? JSON.parse(products || "[]")
        : products || [];
    return parsed.length;
  };

  const getCustomerName = (customerId) => {
    const cust = customers.find((c) => c.customerId === customerId);
    return cust ? cust.name : "Unknown";
  };

  const customerMap = useMemo(() => {
    return customers.reduce((map, c) => {
      map[c.customerId] = c.name;
      return map;
    }, {});
  }, [customers]);

  /* -------------------------- Grouped Quotations ------------------------- */
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

  /* ----------------------------- Filtering & Sorting ----------------------------- */
  const filteredQuotations = useMemo(() => {
    let result = groupedQuotations[activeTab] || [];

    // Search
    if (searchTerm.trim()) {
      result = result.filter((q) => {
        const custName = getCustomerName(q.customerId);
        return (
          q.document_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.reference_number
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          custName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Filters
    if (filters.finalAmount) {
      result = result.filter((q) =>
        q.finalAmount?.toString().includes(filters.finalAmount)
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
    if (filters.dateRange?.length === 2) {
      const [start, end] = filters.dateRange;
      result = result.filter(
        (q) =>
          q.quotation_date &&
          moment(q.quotation_date).isBetween(start, end, "day", "[]")
      );
    }

    // Sorting
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
        result = [...result].sort((a, b) => {
          const da = a.quotation_date
            ? new Date(a.quotation_date)
            : new Date(0);
          const db = b.quotation_date
            ? new Date(b.quotation_date)
            : new Date(0);
          return db - da;
        });
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
    const start = (currentPage - 1) * pageSize;
    return filteredQuotations.slice(start, start + pageSize);
  }, [filteredQuotations, currentPage, pageSize]);

  /* -------------------------- WhatsApp & SiteMap -------------------------- */
  const handleShareOnWhatsApp = (quotation) => {
    let itemsArray = [];
    if (quotation.items && Array.isArray(quotation.items)) {
      itemsArray = quotation.items;
    } else if (quotation.products) {
      try {
        itemsArray = JSON.parse(quotation.products);
      } catch (_) {
        itemsArray = [];
      }
    }

    const items = itemsArray
      .map(
        (it, i) =>
          `  ${i + 1}. Product ID: ${it.productId}\n` +
          `     Qty: ${it.quantity}\n` +
          `     Disc: ${it.discount}\n` +
          `     Tax: ${it.tax}\n` +
          `     Total: ₹${it.total}`
      )
      .join("\n");

    const msg = `
==== QUOTATION DETAILS ====
Title: ${quotation?.document_title || "N/A"}
Date: ${quotation?.quotation_date || "N/A"}
Due: ${quotation?.due_date || "N/A"}
Ref#: ${quotation?.reference_number || "N/A"}
GST: ${quotation?.include_gst ? "Yes" : "No"}
GST Val: ${quotation?.gst_value || 0}
Disc Type: ${quotation?.discountType || "N/A"}
Round Off: ₹${quotation?.roundOff || 0}

-- ITEMS --
${items || "No items"}

Final: ₹${quotation?.finalAmount || 0}
Created By: ${quotation?.signature_name || "N/A"}
Customer: ${quotation?.customerId || "N/A"}
Ship To: ${quotation?.shipTo || "N/A"}

View: ${window.location.origin}/quotation/${quotation.quotationId}
==========================`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };
  const handleGenerateSiteMap = (quotation) => {
    // Parse products (new API uses `items`, old uses `products` string)
    let rawItems = [];

    if (
      quotation.items &&
      Array.isArray(quotation.items) &&
      quotation.items.length > 0
    ) {
      rawItems = quotation.items;
    } else if (quotation.products) {
      try {
        rawItems =
          typeof quotation.products === "string"
            ? JSON.parse(quotation.products)
            : quotation.products;
      } catch (e) {
        console.error("Failed to parse products", e);
        rawItems = [];
      }
    }

    if (rawItems.length === 0) {
      message.warning(
        "This quotation has no products to convert into a site map."
      );
      return;
    }

    // Transform into SiteMap items format
    const siteMapItems = rawItems.map((item) => ({
      productId: item.productId || item.id,
      name: item.name || "Unknown Product",
      imageUrl: item.imageUrl || null,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      floor_number: 1, // Default to Ground Floor – user can change later
      productType: item.category || "Others",
    }));

    // Navigate to AddSiteMap with pre-filled data
    navigate("/site-map/add", {
      state: {
        fromQuotation: true,
        quotationId: quotation.quotationId,
        customerId: quotation.customerId,
        projectName: `${quotation.document_title || "Quotation"} - Site Map`,
        items: siteMapItems,
        totalFloors: 1,
      },
    });
  };
  /* ------------------------------ Columns ------------------------------ */
  const columns = [
    { title: "S.No.", dataIndex: "sNo", key: "sNo", width: 70 },
    {
      title: "Quotation Title",
      dataIndex: "quotationTitle",
      key: "quotationTitle",
      width: 150,
      render: (text, rec) => (
        <Link to={`/quotation/${rec.quotationId}`}>{text || "N/A"}</Link>
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
            onChange={(d) => setSelectedKeys(d ? [d] : [])}
            placeholder="Select Date"
          />
          <div>
            <Button
              type="primary"
              size="small"
              style={{ width: 90, marginRight: 8 }}
              onClick={() => {
                setFilters((p) => ({
                  ...p,
                  quotationDate: selectedKeys[0]
                    ? selectedKeys[0].toDate()
                    : null,
                }));
                confirm();
              }}
            >
              OK
            </Button>
            <Button
              size="small"
              style={{ width: 90 }}
              onClick={() => {
                clearFilters();
                setFilters((p) => ({ ...p, quotationDate: null }));
                confirm();
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      ),
      filterIcon: (f) => (
        <FaSearch style={{ color: f ? "#1890ff" : undefined }} />
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
            onChange={(d) => setSelectedKeys(d ? [[d[0], d[1]]] : [])}
            placeholder={["Start", "End"]}
          />
          <div>
            <Button
              type="primary"
              size="small"
              style={{ width: 90, marginRight: 8 }}
              onClick={() => {
                setFilters((p) => ({
                  ...p,
                  dateRange: selectedKeys[0]
                    ? [selectedKeys[0][0].toDate(), selectedKeys[0][1].toDate()]
                    : null,
                }));
                confirm();
              }}
            >
              OK
            </Button>
            <Button
              size="small"
              style={{ width: 90 }}
              onClick={() => {
                clearFilters();
                setFilters((p) => ({ ...p, dateRange: null }));
                confirm();
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      ),
      filterIcon: (f) => (
        <FaSearch style={{ color: f ? "#1890ff" : undefined }} />
      ),
    },
    {
      title: "Quotation Number",
      dataIndex: "referenceNumber",
      key: "referenceNumber",
      width: 150,
    },
    // Inside the columns definition (Products column)
    {
      title: "Products",
      dataIndex: "products",
      key: "products",
      width: 120,
      render: (_, rec) => (
        <button
          className="btn btn-link"
          onClick={() => handleOpenProductModal(rec)} // <-- pass whole row
          style={{ color: "#e31e24" }}
        >
          Quick View ({getProductCount(rec.products)})
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
            onChange={(v) => setSelectedKeys(v ? [v] : [])}
            placeholder="Select Customer"
            allowClear
          >
            {customers.map((c) => (
              <Option key={c.customerId} value={c.customerId}>
                {c.name}
              </Option>
            ))}
          </Select>
          <div>
            <Button
              type="primary"
              size="small"
              style={{ width: 90, marginRight: 8 }}
              onClick={() => {
                setFilters((p) => ({
                  ...p,
                  customerId: selectedKeys[0] || null,
                }));
                confirm();
              }}
            >
              OK
            </Button>
            <Button
              size="small"
              style={{ width: 90 }}
              onClick={() => {
                clearFilters();
                setFilters((p) => ({ ...p, customerId: null }));
                confirm();
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      ),
      filterIcon: (f) => (
        <FaSearch style={{ color: f ? "#1890ff" : undefined }} />
      ),
      render: (text, rec) => (
        <Link to={`/customer/${rec.customerId}`}>{text}</Link>
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
            placeholder="Enter Amount"
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            style={{ width: "100%", marginBottom: 8 }}
          />
          <div>
            <Button
              type="primary"
              size="small"
              style={{ width: 90, marginRight: 8 }}
              onClick={() => {
                setFilters((p) => ({
                  ...p,
                  finalAmount: selectedKeys[0] || null,
                }));
                confirm();
              }}
            >
              OK
            </Button>
            <Button
              size="small"
              style={{ width: 90 }}
              onClick={() => {
                clearFilters();
                setFilters((p) => ({ ...p, finalAmount: null }));
                confirm();
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      ),
      filterIcon: (f) => (
        <FaSearch style={{ color: f ? "#1890ff" : undefined }} />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, rec) => (
        <div className="d-flex align-items-center">
          <PermissionGate api="edit" module="quotations">
            <span
              onClick={() =>
                navigate(`/quotation/${rec.quotationId}/edit`, {
                  state: { quotation: rec },
                })
              }
              style={{ cursor: "pointer", marginRight: 8 }}
              title="Edit Quotation"
            >
              <EditOutlined />
            </span>
          </PermissionGate>

          <Dropdown
            overlay={
              <Menu>
                <PermissionGate api="view" module="quotations">
                  <Menu.Item key="view">
                    <Link
                      to={`/quotation/${rec.quotationId}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <FaEye style={{ marginRight: 8 }} />
                      View
                    </Link>
                  </Menu.Item>
                </PermissionGate>

                <PermissionGate api="delete" module="quotations">
                  <Menu.Item
                    key="delete"
                    onClick={() => handleDeleteClick(rec)}
                    disabled={isDeleting}
                    style={{ color: "#ff4d4f" }}
                  >
                    <FaTrash style={{ marginRight: 8 }} />
                    Delete
                  </Menu.Item>
                </PermissionGate>
                {/* Inside the <Menu> of the Actions Dropdown */}

                <Menu.Item
                  key="generate-sitemap"
                  onClick={() => handleGenerateSiteMap(rec)} // ← NEW
                  style={{ color: "#722ed1" }}
                >
                  <HomeOutlined style={{ marginRight: 8 }} />
                  Generate Site Map
                </Menu.Item>

                <PermissionGate api="write" module="quotations">
                  <Menu.Item
                    key="convert"
                    onClick={() => handleConvertToOrder(rec)}
                  >
                    <FaFileInvoice style={{ marginRight: 8 }} />
                    Convert to Order
                  </Menu.Item>
                </PermissionGate>

                <Menu.Item
                  key="whatsapp"
                  onClick={() => handleShareOnWhatsApp(rec)}
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
            <Button type="text" icon={<BsThreeDotsVertical />} />
          </Dropdown>
        </div>
      ),
    },
  ];

  /* -------------------------- Table Data --------------------------- */
  const formattedTableData = useMemo(() => {
    return currentQuotations.map((q, i) => ({
      key: q.quotationId,
      sNo: (currentPage - 1) * pageSize + i + 1,
      quotationTitle: q.document_title || "N/A",
      quotationDate: q.quotation_date
        ? new Date(q.quotation_date).toLocaleDateString()
        : "N/A",
      dueDate: q.due_date ? new Date(q.due_date).toLocaleDateString() : "N/A",
      referenceNumber: q.reference_number || "N/A",
      products: q.products,
      customer: getCustomerName(q.customerId),
      customerId: q.customerId,
      finalAmount: `₹${q.finalAmount || 0}`,
      quotationId: q.quotationId,
    }));
  }, [currentQuotations, currentPage, pageSize]);
  const handleConvertToOrder = (q) => {
    let rawItems = [];

    // Prefer items array (cleaner, from latest API)
    if (q.items && Array.isArray(q.items) && q.items.length > 0) {
      rawItems = q.items;
    } else if (q.products) {
      try {
        rawItems =
          typeof q.products === "string" ? JSON.parse(q.products) : q.products;
      } catch (e) {
        console.error("Failed to parse products", e);
        rawItems = [];
      }
    }

    if (rawItems.length === 0) {
      message.error("No products found in quotation");
      return;
    }

    // Ensure clean transformation
    const products = rawItems.map((item) => {
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const discount = Number(item.discount) || 0;
      const discountType = item.discountType || "percent";

      let finalPrice = price;
      if (discountType === "percent") {
        finalPrice = price * (1 - discount / 100);
      } else {
        finalPrice = price - discount;
      }

      const total = Number((finalPrice * quantity).toFixed(2));

      return {
        id: item.productId,
        price: Number(price.toFixed(2)),
        quantity,
        discount,
        discountType,
        total,
      };
    });

    // Double-check every product has required fields
    const invalidProduct = products.find(
      (p) => !p.id || isNaN(p.price) || isNaN(p.total) || p.quantity < 1
    );

    if (invalidProduct) {
      console.error("Invalid product:", invalidProduct);
      message.error("One or more products have invalid data");
      return;
    }

    navigate("/order/add", {
      state: {
        quotationData: {
          createdFor: q.customerId || "",
          dueDate: q.due_date || moment().add(7, "days").format("YYYY-MM-DD"),
          description: `Converted from Quotation #${
            q.reference_number || q.quotationId
          }\n${q.document_title || ""}`.trim(),
          shipTo: q.shipTo || null,
          gst: q.gst ? parseFloat(q.gst) : null,
          extraDiscount: q.extraDiscount ? parseFloat(q.extraDiscount) : null,
          extraDiscountType: q.extraDiscountType || "fixed",
          shipping: q.shippingAmount ? parseFloat(q.shippingAmount) : 0,
          products, // ← This is now 100% valid
          quotationId: q.quotationId,
        },
      },
    });
  };

  /* --------------------------- Handlers --------------------------- */
  const handlePageChange = (page, newPageSize) => {
    setCurrentPage(page);
    if (newPageSize !== pageSize) setPageSize(newPageSize);
  };

  const handleDeleteClick = (q) => {
    setQuotationToDelete(q);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!quotationToDelete?.quotationId) return;
    try {
      await deleteQuotation(quotationToDelete.quotationId).unwrap();
      message.success("Quotation deleted successfully");
      refetch();
      if (currentQuotations.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } catch (e) {
      message.error("Delete failed");
    } finally {
      setShowDeleteModal(false);
      setQuotationToDelete(null);
    }
  };
  const handleOpenProductModal = (quotation) => {
    setSelectedQuotation(quotation); // whole object as fallback
    setShowProductModal(true);
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

  /* ------------------------------- Render ------------------------------- */
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
            {/* Search & Sort */}
            <div className="row mb-3">
              <div className="col-12">
                <div className="d-flex align-items-center justify-content-lg-end flex-wrap gap-2">
                  <div className="position-relative">
                    <span className="input-icon-addon">
                      <FaSearch />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search Quotations"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>

                  <Select
                    style={{ width: 200 }}
                    value={sortBy}
                    onChange={(v) => {
                      setSortBy(v);
                      setCurrentPage(1);
                    }}
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

            {/* Table */}
            <div className="table-responsive">
              <Table
                columns={columns}
                dataSource={formattedTableData}
                pagination={false}
                rowKey="key"
                scroll={{ x: "max-content" }}
              />

              {filteredQuotations.length > pageSize && (
                <div className="d-flex justify-content-end mt-4">
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={filteredQuotations.length}
                    onChange={handlePageChange}
                    showSizeChanger
                    pageSizeOptions={["10", "20", "50", "100"]}
                    showQuickJumper
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <QuotationProductModal
          show={showProductModal}
          onHide={() => {
            setShowProductModal(false);
            setSelectedQuotation(null);
          }}
          quotationId={selectedQuotation?.quotationId}
          fallbackQuotation={selectedQuotation}
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
    </div>
  );
};

export default QuotationList;
