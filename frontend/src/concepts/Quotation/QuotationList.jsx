import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  useGetAllQuotationsQuery,
  useDeleteQuotationMutation,
} from "../../api/quotationApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import {
  SearchOutlined,
  EyeOutlined,
  DeleteFilled,
  FileAddOutlined,
  MoreOutlined,
  CalendarOutlined,
  EditOutlined,
  HomeOutlined,
  BookOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import QuotationProductModal from "../../components/Quotation/QuotationProductModal";
import DeleteModal from "../../components/Common/DeleteModal";
import DatesModal from "../../components/Orders/DateModal";
import {
  message,
  Input,
  Button,
  Select,
  Pagination,
  Dropdown,
  Menu,
  DatePicker,
  Table,
  Collapse,
  Card,
  Statistic,
} from "antd";
import PageHeader from "../../components/Common/PageHeader";
import moment from "moment";
import { FilePdfOutlined } from "@ant-design/icons";
import { useQuotationQuickExport } from "../../components/Quotation/hooks/useQuotationQuickExport";
import { useRef } from "react";
import { amountInWords } from "../../components/Quotation/hooks/calcHelpers";
import { Tooltip } from "antd";
import PermissionGate from "../../context/PermissionGate";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Panel } = Collapse;

const QuotationList = () => {
  const navigate = useNavigate();

  // ==================== STATE ====================
  const [viewMode, setViewMode] = useState("list"); // "list" | "book"

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);

  const hiddenRef = useRef(null);
  const { exportingId, hiddenContainerRef, exportQuotation } =
    useQuotationQuickExport();

  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDatesModal, setShowDatesModal] = useState(false);

  const [selectedQuotationId, setSelectedQuotationId] = useState(null);
  const [quotationToDelete, setQuotationToDelete] = useState(null);
  const [selectedForDates, setSelectedForDates] = useState(null);

  // ==================== DEBOUNCE SEARCH ====================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ==================== DATE RANGE ====================
  const formattedDateRange = useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) return undefined;
    return [
      dateRange[0].format("YYYY-MM-DD"),
      dateRange[1].format("YYYY-MM-DD"),
    ];
  }, [dateRange]);

  // ==================== API QUERY ====================
  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetAllQuotationsQuery({
    page: viewMode === "book" ? 1 : currentPage, // Fetch all in one go for Book mode
    limit: viewMode === "book" ? 1000 : pageSize, // Large limit for grouping
    search: debouncedSearch.trim() === "" ? undefined : debouncedSearch.trim(),
    customerId: customerFilter === "" ? undefined : customerFilter,
    status: statusFilter === "" ? undefined : statusFilter,
    dateRange: formattedDateRange,
    sortBy: "quotation_date",
    order: "desc",
  });

  const quotations = Array.isArray(response?.data) ? response?.data : [];

  // ==================== GROUP BY MONTH (Book Mode) ====================
  const monthlyGroups = useMemo(() => {
    if (viewMode !== "book") return [];

    const groups = {};

    quotations.forEach((q) => {
      const date = q.quotation_date || q.createdAt;
      if (!date) return;

      const monthKey = moment(date).format("YYYY-MM"); // e.g., "2026-05"
      const monthLabel = moment(date).format("MMMM YYYY");

      if (!groups[monthKey]) {
        groups[monthKey] = {
          key: monthKey,
          label: monthLabel,
          quotations: [],
          totalAmount: 0,
          count: 0,
        };
      }

      groups[monthKey].quotations.push(q);
      groups[monthKey].totalAmount += Number(q.finalAmount || 0);
      groups[monthKey].count += 1;
    });

    // Sort months descending
    return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
  }, [quotations, viewMode]);

  const pagination = response?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  };

  const { data: customersData } = useGetCustomersQuery({ limit: 1000 });
  const customers = customersData?.data || [];

  const [deleteQuotation, { isLoading: isDeleting }] =
    useDeleteQuotationMutation();

  // ==================== HELPERS ====================
  const getProductCount = (items) => {
    if (!items) return 0;
    if (Array.isArray(items)) return items.length;
    try {
      return JSON.parse(items).length;
    } catch {
      return 0;
    }
  };

  // ==================== HANDLERS (same as before) ====================
  const handleOpenProductModal = (id) => {
    setSelectedQuotationId(id);
    setShowProductModal(true);
  };

  const handleOpenDatesModal = (quotation) => {
    setSelectedForDates(quotation);
    setShowDatesModal(true);
  };

  const handleDeleteClick = (quotation) => {
    setQuotationToDelete(quotation);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!quotationToDelete?.quotationId) return;
    try {
      await deleteQuotation(quotationToDelete.quotationId).unwrap();
      message.success("Quotation deleted successfully");
    } catch (e) {
      message.error(e?.data?.message || "Delete failed");
    } finally {
      setShowDeleteModal(false);
      setQuotationToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCustomerFilter("");
    setStatusFilter("");
    setDateRange([null, null]);
    setCurrentPage(1);
  };
  const handleGenerateSiteMap = (q) => {
    const rawItems = q.items || [];
    if (rawItems.length === 0) {
      message.warning("No products to generate site map");
      return;
    }

    const siteMapItems = rawItems.map((item) => ({
      productId: item.productId,
      name: item.name || "Unknown",
      imageUrl: item.imageUrl || null,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
      floor_number: 1,
      productType: item.category || "Others",
    }));

    navigate("/site-map/add", {
      state: {
        fromQuotation: true,
        quotationId: q.quotationId,
        customerId: q.customerId,
        projectName: `${q.document_title || "Quotation"} - Site Map`,
        items: siteMapItems,
        totalFloors: 1,
      },
    });
  };
  const handleConvertToOrder = (q) => {
    const rawItems = q.items || [];
    if (rawItems.length === 0) {
      message.error("No products to convert");
      return;
    }

    const products = rawItems.map((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) || 0;
      const discount = Number(item.discount) || 0;
      const discountType = item.discountType || "percent";

      let finalPrice = price;
      if (discountType === "percent") {
        finalPrice = price * (1 - discount / 100);
      } else {
        finalPrice = price - discount;
      }

      return {
        id: item.productId,
        price: Number(price.toFixed(2)),
        quantity: qty,
        discount,
        discountType,
        total: Number((finalPrice * qty).toFixed(2)),
      };
    });

    navigate("/order/add", {
      state: {
        quotationData: {
          createdFor: q.customerId,
          dueDate: q.due_date || moment().add(7, "days").format("YYYY-MM-DD"),
          description: `Converted from Quotation #${
            q.reference_number || q.quotationId
          }`,
          shipTo: q.shipTo || null,
          gst: q.gst || null,
          extraDiscount: q.extraDiscount || null,
          extraDiscountType: q.extraDiscountType || "fixed",
          shipping: q.shippingAmount || 0,
          products,
          quotationId: q.quotationId,
        },
      },
    });
  };

  const handlePageChange = (page, newSize) => {
    setCurrentPage(page);
    if (newSize !== pageSize) {
      setPageSize(newSize);
      setCurrentPage(1);
    }
  };

  // ==================== COLUMNS (same as before) ====================
  const columns = [
    {
      title: "S.No.",
      key: "sno",
      width: 70,
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Title",
      dataIndex: "document_title",
      key: "title",
      render: (text, rec) => (
        <Link to={`/quotation/${rec.quotationId}`} className="fw-medium">
          {text || "Untitled"}
        </Link>
      ),
    },
    {
      title: "Ref #",
      dataIndex: "reference_number",
      key: "ref",
    },
    {
      title: "Date",
      dataIndex: "quotation_date",
      key: "date",
      render: (date) => (date ? moment(date).format("DD/MM/YYYY") : "—"),
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      key: "due",
      render: (date) => (date ? moment(date).format("DD/MM/YYYY") : "—"),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, rec) => {
        const cust = customers.find((c) => c.customerId === rec.customerId);
        return cust ? (
          <Link to={`/customer/${rec.customerId}`}>{cust.name}</Link>
        ) : (
          "—"
        );
      },
    },
    {
      title: "Products",
      key: "products",
      render: (_, rec) => (
        <Button
          type="link"
          onClick={() => handleOpenProductModal(rec.quotationId)}
          style={{ padding: 0, color: "#e31e24" }}
        >
          Quick View ({getProductCount(rec.items)})
        </Button>
      ),
    },
    {
      title: "Amount",
      dataIndex: "finalAmount",
      key: "amount",
      render: (amt) => `₹${Number(amt || 0).toFixed(2)}`,
    },

    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 180, // increased width so icons have space
      render: (_, rec) => {
        const customer = customers.find((c) => c.customerId === rec.customerId);
        const custName = customer?.name || "Dear Client";
        const custPhone = customer?.mobileNumber || customer?.phone || "—";
        const custAddress = "—"; // ← TODO: improve later

        const mainProducts = Array.isArray(rec.items) ? rec.items : [];
        const optionalProducts = []; // not in list usually
        const subtotal = Number(rec.finalAmount || 0);
        const discount = 0;
        const extraDiscount = Number(rec.extraDiscount || 0);
        const finalAmount = Number(rec.finalAmount || 0);
        const roundOff = 0;
        const amountWords = amountInWords(Math.round(finalAmount));

        const isExporting = exportingId === rec.quotationId;

        // ── THIS IS THE FIXED PART ──
        return (
          <div className="d-flex align-items-center gap-1">
            <PermissionGate api="edit" module="quotations">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() =>
                  navigate(`/quotation/${rec.quotationId}/edit`, {
                    state: { quotation: rec },
                  })
                }
              />
            </PermissionGate>

            <Tooltip title="Export PDF">
              <Button
                type="text"
                icon={<FilePdfOutlined style={{ color: "#d32f2f" }} />}
                loading={isExporting}
                disabled={isExporting}
                onClick={() =>
                  exportQuotation({
                    quotation: rec,
                    customerName: custName,
                    customerPhone: custPhone,
                    customerAddress: custAddress,
                    brandNames: "GROHE / AMERICAN STANDARD",
                    mainProducts,
                    optionalProducts,
                    displaySubtotal: subtotal,
                    displayProductDiscount: discount,
                    backendExtraDiscount: extraDiscount,
                    backendFinalAmount: finalAmount,
                    backendRoundOff: roundOff,
                    finalAmountInWords: amountWords,
                    format: "pdf",
                  })
                }
              />
            </Tooltip>

            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item key="view">
                    <Link to={`/quotation/${rec.quotationId}`}>
                      <EyeOutlined className="me-2" /> View
                    </Link>
                  </Menu.Item>

                  <Menu.Item
                    key="dates"
                    onClick={() => handleOpenDatesModal(rec)}
                  >
                    <CalendarOutlined className="me-2" /> Dates
                  </Menu.Item>

                  <Menu.Item
                    key="sitemap"
                    onClick={() => handleGenerateSiteMap(rec)}
                  >
                    <HomeOutlined className="me-2" /> Site Map
                  </Menu.Item>

                  <PermissionGate api="write" module="quotations">
                    <Menu.Item
                      key="convert"
                      onClick={() => handleConvertToOrder(rec)}
                    >
                      <FileAddOutlined className="me-2" /> Convert to Order
                    </Menu.Item>
                  </PermissionGate>

                  <PermissionGate api="delete" module="quotations">
                    <Menu.Item
                      key="delete"
                      danger
                      onClick={() => handleDeleteClick(rec)}
                    >
                      <DeleteFilled className="me-2" /> Delete
                    </Menu.Item>
                  </PermissionGate>
                </Menu>
              }
              trigger={["click"]}
            >
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </div>
        );
      },
    },
  ];
  const tableDataForExport = useMemo(() => {
    if (!Array.isArray(quotations)) return [];

    return quotations.map((q, i) => ({
      "S.No.": (currentPage - 1) * pageSize + i + 1,
      Title: q.document_title || "Untitled",
      "Ref #": q.reference_number || "—",
      Date: q.quotation_date
        ? moment(q.quotation_date).format("DD/MM/YYYY")
        : "—",
      Customer:
        customers.find((c) => c.customerId === q.customerId)?.name || "—",
      Products: getProductCount(q.items),
      Amount: `₹${Number(q.finalAmount || 0).toFixed(2)}`,
      Status: q.status || "Pending",
    }));
  }, [quotations, currentPage, pageSize, customers]);
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Quotations"
            subtitle={
              viewMode === "book"
                ? "Book View - Monthly"
                : "Manage your quotations"
            }
            onAdd={() => navigate("/quotation/add")}
            extra={
              <Button
                icon={
                  viewMode === "list" ? (
                    <BookOutlined />
                  ) : (
                    <UnorderedListOutlined />
                  )
                }
                onClick={() =>
                  setViewMode(viewMode === "list" ? "book" : "list")
                }
                type={viewMode === "book" ? "primary" : "default"}
              >
                {viewMode === "book" ? "List Mode" : "Book Mode"}
              </Button>
            }
          />

          <div className="card-body">
            {/* Filters */}
            <div className="row mb-4 g-3 align-items-center">
              <div className="col-lg-8">
                <div className="d-flex flex-wrap gap-3">
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Search title, ref#, customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    allowClear
                    style={{ width: 300 }}
                    size="large"
                  />

                  <Select
                    placeholder="Customer"
                    value={customerFilter || undefined}
                    onChange={(val) => setCustomerFilter(val || "")}
                    allowClear
                    style={{ width: 200 }}
                    size="large"
                  >
                    {customers.map((c) => (
                      <Option key={c.customerId} value={c.customerId}>
                        {c.name}
                      </Option>
                    ))}
                  </Select>

                  <RangePicker
                    value={dateRange}
                    onChange={(dates) => setDateRange(dates || [null, null])}
                    size="large"
                  />
                </div>
              </div>

              <div className="col-lg-4 text-end">
                <Button onClick={clearFilters} size="large">
                  Clear Filters
                </Button>
              </div>
            </div>

            {/* BOOK MODE */}
            {viewMode === "book" ? (
              isLoading ? (
                <div className="text-center py-5">Loading book view...</div>
              ) : monthlyGroups.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  No quotations found
                </div>
              ) : (
                <Collapse accordion defaultActiveKey={monthlyGroups[0]?.key}>
                  {monthlyGroups.map((month) => (
                    <Panel
                      header={
                        <div className="d-flex justify-content-between align-items-center w-100">
                          <span>
                            <strong>{month.label}</strong>
                          </span>
                          <div className="d-flex gap-4">
                            <Statistic
                              title="Quotations"
                              value={month.count}
                              valueStyle={{ fontSize: "16px" }}
                            />
                            <Statistic
                              title="Total Amount"
                              value={month.totalAmount}
                              precision={2}
                              prefix="₹"
                              valueStyle={{
                                fontSize: "16px",
                                color: "#3f8600",
                              }}
                            />
                          </div>
                        </div>
                      }
                      key={month.key}
                    >
                      <Table
                        columns={columns}
                        dataSource={month.quotations}
                        rowKey="quotationId"
                        pagination={false}
                        scroll={{ x: "max-content" }}
                        size="small"
                      />
                    </Panel>
                  ))}
                </Collapse>
              )
            ) : (
              /* ==================== LIST MODE (Original) ==================== */
              <>
                {/* Your existing Table + Pagination code */}
                {isLoading ? (
                  <div className="text-center py-5">
                    <div
                      className="spinner-border text-primary"
                      role="status"
                    />
                  </div>
                ) : isError ? (
                  <div className="alert alert-danger">
                    Error: {error?.data?.message || "Failed to load quotations"}
                  </div>
                ) : quotations.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    No quotations found
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <Table
                        columns={columns}
                        dataSource={quotations}
                        rowKey="quotationId"
                        pagination={false}
                        scroll={{ x: "max-content" }}
                      />
                    </div>

                    {pagination.total > 0 && (
                      <div className="mt-4 d-flex justify-content-between align-items-center">
                        <div className="text-muted small">
                          Showing {(currentPage - 1) * pageSize + 1}–
                          {Math.min(currentPage * pageSize, pagination.total)}{" "}
                          of {pagination.total} quotations
                        </div>
                        <Pagination
                          current={currentPage}
                          pageSize={pageSize}
                          total={pagination.total}
                          onChange={(page, size) => {
                            setCurrentPage(page);
                            if (size !== pageSize) setPageSize(size);
                          }}
                          showSizeChanger
                          pageSizeOptions={["10", "20", "50", "100"]}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Hidden container for export */}
        <div
          ref={hiddenContainerRef}
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            width: "210mm",
            background: "white",
          }}
        />

        {/* Modals */}
        <QuotationProductModal
          show={showProductModal}
          onHide={() => {
            setShowProductModal(false);
            setSelectedQuotationId(null);
          }}
          quotationId={selectedQuotationId}
        />
        <DatesModal
          open={showDatesModal}
          onClose={() => {
            setShowDatesModal(false);
            setSelectedForDates(null);
          }}
          dueDate={selectedForDates?.due_date}
          followupDates={selectedForDates?.followupDates || []}
        />
        <DeleteModal
          isVisible={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setQuotationToDelete(null);
          }}
          itemType="Quotation"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default QuotationList;
