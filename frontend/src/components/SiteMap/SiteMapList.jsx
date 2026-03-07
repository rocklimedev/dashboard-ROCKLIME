// src/components/SiteMap/SiteMapList.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  useGetSiteMapsByCustomerQuery,
  useDeleteSiteMapMutation,
  useGenerateQuotationFromSiteMapMutation,
} from "../../api/siteMapApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import {
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  HomeOutlined,
  WhatsAppOutlined,
  MoreOutlined,
  FileAddFilled,
} from "@ant-design/icons";
import { EditOutlined } from "@ant-design/icons";
import {
  message,
  Table,
  Dropdown,
  Menu,
  Button,
  Input,
  Select,
  Pagination,
  Tag,
  Card,
  Space,
  Typography,
} from "antd";
import PageHeader from "../Common/PageHeader";
import DeleteModal from "../Common/DeleteModal";
import PermissionGate from "../../context/PermissionGate";
import moment from "moment";

const { Text, Title } = Typography;
const { Option } = Select;

const SiteMapList = () => {
  const navigate = useNavigate();

  // RTK Queries
  const { data: customersData } = useGetCustomersQuery({ limit: 500 });
  const [deleteSiteMap, { isLoading: isDeleting }] = useDeleteSiteMapMutation();
  const [generateQuotation] = useGenerateQuotationFromSiteMapMutation();

  const customers = customersData?.data || [];

  // State
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [siteMapToDelete, setSiteMapToDelete] = useState(null);

  // Fetch site maps only when customer is selected
  const {
    data: customerSiteMaps,
    isFetching,
    refetch,
  } = useGetSiteMapsByCustomerQuery(selectedCustomerId, {
    skip: !selectedCustomerId,
  });

  const siteMapsForCustomer = customerSiteMaps?.data || [];

  // Filtering & Sorting
  const filteredSiteMaps = useMemo(() => {
    let result = siteMapsForCustomer;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(term) ||
          s.siteSizeInBHK?.toLowerCase().includes(term),
      );
    }

    // Sort newest first (shallow copy to avoid mutating original)
    return [...result].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [siteMapsForCustomer, searchTerm]);

  const currentSiteMaps = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSiteMaps.slice(start, start + pageSize);
  }, [filteredSiteMaps, currentPage, pageSize]);

  const getCustomerName = (customerId) => {
    const cust = customers.find((c) => c.customerId === customerId);
    return cust ? cust.name : "Unknown";
  };

  const handleGenerateQuotation = async (siteMap) => {
    try {
      const res = await generateQuotation(siteMap.id).unwrap();
      message.success("Quotation generated successfully!");
      navigate(`/quotation/${res.quotationId}`);
    } catch (err) {
      message.error(err.data?.message || "Failed to generate quotation");
    }
  };

  const handleOpenAddSiteMap = () => {
    if (!selectedCustomerId) {
      message.warning("Please select a customer first.");
      return;
    }
    navigate(`/site-map/add?customerId=${selectedCustomerId}`);
  };

  const handleDeleteClick = (siteMap) => {
    setSiteMapToDelete(siteMap);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!siteMapToDelete?.id) return;
    try {
      await deleteSiteMap(siteMapToDelete.id).unwrap();
      message.success("Site Map deleted");
      setShowDeleteModal(false);
      refetch();
    } catch (err) {
      message.error(err.data?.message || "Delete failed");
    }
  };

  const handleShareOnWhatsApp = (siteMap) => {
    const total = siteMap.summaries?.overall?.totalAmount || 0;
    const itemsCount = siteMap.items?.length || 0;
    const msg = `
*New Site Map Created* ✨
🏠 *Project*: ${siteMap.name}
👤 *Customer*: ${getCustomerName(siteMap.customerId)}
📏 *Size*: ${siteMap.siteSizeInBHK || "N/A"}
🏢 *Floors*: ${siteMap.totalFloors}
📦 *Products*: ${itemsCount}
💰 *Estimated Value*: ₹${total.toLocaleString("en-IN")}
View Site Map: ${window.location.origin}/site-map/${siteMap.id}
    `.trim();

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const columns = [
    {
      title: "S.No.",
      width: 70,
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Project Name",
      render: (_, record) => (
        <Link to={`/site-map/${record.id}`} style={{ fontWeight: 600 }}>
          {record.name || "Untitled Project"}
        </Link>
      ),
    },
    {
      title: "Customer",
      render: (_, record) => (
        <Link to={`/customer/${record.customerId}`}>
          {getCustomerName(record.customerId)}
        </Link>
      ),
    },
    {
      title: "Size",
      dataIndex: "siteSizeInBHK",
      render: (text) => text || "—",
    },
    {
      title: "Floors",
      dataIndex: "totalFloors",
      render: (floors) => `${floors} floor${floors > 1 ? "s" : ""}`,
    },
    {
      title: "Items",
      render: (_, record) => record.items?.length || 0,
    },
    {
      title: "Value",
      render: (_, record) => {
        const amount = record.summaries?.overall?.totalAmount || 0;
        return <strong>₹{amount.toLocaleString("en-IN")}</strong>;
      },
    },
    {
      title: "Status",
      render: (_, record) => (
        <Tag color={record.status === "converted" ? "green" : "orange"}>
          {record.status?.toUpperCase() || "DRAFT"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      render: (date) => moment(date).format("DD MMM YYYY"),
    },
    {
      title: "Actions",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="view">
                <Link to={`/site-map/${record.id}`}>
                  <EyeOutlined style={{ marginRight: 8 }} /> View
                </Link>
              </Menu.Item>
              <Menu.Item key="edit">
                <Link to={`/site-map/${record.id}/edit`}>
                  <EditOutlined style={{ marginRight: 8 }} /> Edit
                </Link>
              </Menu.Item>
              {record.status !== "converted" && (
                <Menu.Item
                  key="generate"
                  onClick={() => handleGenerateQuotation(record)}
                >
                  <FileAddFilled style={{ marginRight: 8 }} /> Generate
                  Quotation
                </Menu.Item>
              )}
              <Menu.Item
                key="whatsapp"
                onClick={() => handleShareOnWhatsApp(record)}
              >
                <WhatsAppOutlined
                  style={{ marginRight: 8, color: "#25D366" }}
                />{" "}
                Share on WhatsApp
              </Menu.Item>
              <Menu.Item
                key="delete"
                danger
                onClick={() => handleDeleteClick(record)}
              >
                <DeleteOutlined style={{ marginRight: 8 }} /> Delete
              </Menu.Item>
            </Menu>
          }
          trigger={["click"]}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // When no customer selected → show selection screen
  if (!selectedCustomerId) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <PageHeader
            title="Site Maps"
            subtitle="Floor-wise product planning for projects"
            onAdd={handleOpenAddSiteMap}
          />
          <Card>
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <HomeOutlined
                style={{ fontSize: 64, color: "#e31e24", marginBottom: 24 }}
              />
              <Title level={3}>Select a Customer to View Site Maps</Title>
              <Text type="secondary">
                Choose a customer to see their existing site plans or create a
                new one
              </Text>
              <div style={{ maxWidth: 500, margin: "30px auto" }}>
                <Select
                  showSearch
                  size="large"
                  placeholder="🔍 Search customer by name or phone..."
                  style={{ width: "100%" }}
                  onChange={setSelectedCustomerId}
                  optionFilterProp="label"
                  filterOption={(input, option) =>
                    (option.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {customers.map((c) => (
                    <Option
                      key={c.customerId}
                      value={c.customerId}
                      label={`${c.name}${c.phone ? ` (${c.phone})` : ""}`}
                    >
                      <div>
                        <strong>{c.name}</strong>
                        {c.phone && (
                          <div style={{ color: "#666", fontSize: "0.9em" }}>
                            {c.phone}
                          </div>
                        )}
                      </div>
                    </Option>
                  ))}
                </Select>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Main view with selected customer
  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Site Maps"
          subtitle={`Projects for ${getCustomerName(selectedCustomerId)}`}
          onAdd={handleOpenAddSiteMap}
        />

        <Card>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search site maps by name or size..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ width: 300 }}
              />

              <Select
                showSearch
                allowClear
                placeholder="Change customer"
                style={{ width: 340 }}
                value={selectedCustomerId}
                onChange={(value) => {
                  setSelectedCustomerId(value || "");
                  setCurrentPage(1);
                  setSearchTerm("");
                }}
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {customers.map((c) => (
                  <Option
                    key={c.customerId}
                    value={c.customerId}
                    label={`${c.name}${c.phone ? ` (${c.phone})` : ""}`}
                  >
                    <div>
                      <strong>{c.name}</strong>
                      {c.phone && (
                        <div style={{ color: "#666", fontSize: "0.9em" }}>
                          {c.phone}
                        </div>
                      )}
                    </div>
                  </Option>
                ))}
              </Select>

              <Text strong>
                Total: {filteredSiteMaps.length} Site Map
                {filteredSiteMaps.length !== 1 ? "s" : ""}
              </Text>
            </div>

            <Table
              columns={columns}
              dataSource={currentSiteMaps}
              pagination={false}
              loading={isFetching}
              rowKey="id"
              scroll={{ x: 1200 }}
            />

            {filteredSiteMaps.length > pageSize && (
              <div className="d-flex justify-content-end mt-4">
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredSiteMaps.length}
                  onChange={(page, size) => {
                    setCurrentPage(page);
                    if (size) setPageSize(size);
                  }}
                  showSizeChanger
                  pageSizeOptions={["10", "20", "50"]}
                />
              </div>
            )}

            {filteredSiteMaps.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <HomeOutlined
                  style={{ fontSize: 48, color: "#d9d9d9", marginBottom: 16 }}
                />
                <Text type="secondary" block>
                  No site maps found for this customer
                </Text>
                <Button
                  type="primary"
                  size="large"
                  style={{ marginTop: 16, backgroundColor: "#333333" }}
                  onClick={() =>
                    navigate(`/site-map/add?customerId=${selectedCustomerId}`)
                  }
                >
                  Create First Site Map
                </Button>
              </div>
            )}
          </div>
        </Card>

        <DeleteModal
          isVisible={showDeleteModal}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
          item={siteMapToDelete}
          itemType="Site Map"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default SiteMapList;
