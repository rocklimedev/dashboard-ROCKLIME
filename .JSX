import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  useGetAllQuotationsQuery,
  useDeleteQuotationMutation,
  useCloneQuotationMutation, // ← Added
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
  CopyOutlined, // ← Added for Clone
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
  const [viewMode, setViewMode] = useState("list");
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

  // ==================== MUTATIONS ====================
  const [deleteQuotation, { isLoading: isDeleting }] =
    useDeleteQuotationMutation();
  const [cloneQuotation, { isLoading: isCloning }] =
    useCloneQuotationMutation(); // ← Added

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
    page: viewMode === "book" ? 1 : currentPage,
    limit: viewMode === "book" ? 1000 : pageSize,
    search: debouncedSearch.trim() === "" ? undefined : debouncedSearch.trim(),
    customerId: customerFilter === "" ? undefined : customerFilter,
    status: statusFilter === "" ? undefined : statusFilter,
    dateRange: formattedDateRange,
    sortBy: "quotation_date",
    order: "desc",
  });

  const quotations = Array.isArray(response?.data) ? response?.data : [];
  const pagination = response?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  };

  const { data: customersData } = useGetCustomersQuery({ limit: 1000 });
  const customers = customersData?.data || [];

  // ==================== CLONE HANDLER ====================
  const handleCloneQuotation = async (quotation) => {
    try {
      await cloneQuotation(quotation.quotationId).unwrap();
      message.success(
        `Quotation "${quotation.reference_number || quotation.document_title}" cloned successfully!`,
      );
    } catch (err) {
      message.error(err?.data?.message || "Failed to clone quotation");
    }
  };

  // ==================== HELPERS & OTHER HANDLERS ====================
  const getProductCount = (items) => {
    if (!items) return 0;
    if (Array.isArray(items)) return items.length;
    try {
      return JSON.parse(items).length;
    } catch {
      return 0;
    }
  };

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

  // ... (handleGenerateSiteMap, handleConvertToOrder, handlePageChange remain same)

  // ==================== COLUMNS ====================
  const columns = [
    // ... your existing columns (S.No, Title, Ref #, Date, etc.)

    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 200,
      render: (_, rec) => {
        const isExporting = exportingId === rec.quotationId;

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
                    /* ... your existing props */
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

                  <PermissionGate api="write" module="quotations">
                    <Menu.Item
                      key="clone"
                      icon={<CopyOutlined />}
                      onClick={() => handleCloneQuotation(rec)}
                      disabled={isCloning}
                    >
                      Clone Quotation
                    </Menu.Item>
                  </PermissionGate>

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

  // ... rest of your component (tableDataForExport, return JSX, modals, etc.)

  return (
    <div className="page-wrapper">
      {/* ... your existing JSX ... */}

      {/* Modals remain the same */}
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
  );
};

export default QuotationList;
