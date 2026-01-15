// src/pages/Search.jsx
import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Input,
  Button,
  Card,
  Empty,
  Spin,
  Avatar,
  Space,
  Tag,
  Row,
  Col,
  Tooltip,
  Divider,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  CompressOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useSearchAllQuery } from "../../api/searchApi";

const { Search: AntSearch } = Input;

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);

  const {
    data: searchData,
    isLoading,
    isFetching,
  } = useSearchAllQuery(
    { query: query.trim(), limit: 20 },
    { skip: !query.trim() }
  );

  const results = searchData?.results || {};
  const resultGroups = useMemo(
    () =>
      Object.entries(results).filter(([_, data]) => data?.items?.length > 0),
    [results]
  );

  const hasResults = resultGroups.length > 0;

  const handleSearch = (value) => {
    const trimmed = value?.trim();
    if (!trimmed) return;
    setSearchParams({ q: trimmed });
    setQuery(trimmed);
  };

  const handleRefresh = () => {
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  // Highlight helper (same as overlay)
  const highlightText = (text, highlight) => {
    if (!highlight?.trim() || typeof text !== "string") return text || "";
    try {
      const regex = new RegExp(`(${highlight.trim()})`, "gi");
      const parts = text.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? <mark key={i}>{part}</mark> : part
      );
    } catch {
      return text;
    }
  };

  // Avatar logic (same as overlay)
  const getIconAndAvatar = (modelName, item) => {
    switch (modelName) {
      case "User":
        const userPhoto = item.photo_thumbnail || item.photo_original;
        return userPhoto ? (
          <Avatar src={userPhoto} size={48} alt={item.name || item.username} />
        ) : (
          <Avatar icon={<UserOutlined />} size={48} />
        );

      case "Product":
        let productImage = null;
        if (
          item.images &&
          Array.isArray(item.images) &&
          item.images.length > 0
        ) {
          productImage = item.images[0];
        } else if (typeof item.images === "string") {
          try {
            const parsed = JSON.parse(item.images);
            productImage =
              Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
          } catch {}
        }
        return productImage ? (
          <Avatar
            src={productImage}
            shape="square"
            size={48}
            style={{ objectFit: "cover" }}
            alt={item.name || item.product_code}
          />
        ) : (
          <Avatar icon={<ShoppingOutlined />} shape="square" size={48} />
        );

      case "Order":
      case "Invoice":
      case "Quotation":
        return <Avatar icon={<FileTextOutlined />} size={48} />;

      default:
        return <Avatar icon={<SearchOutlined />} size={48} />;
    }
  };

  // Secondary text
  const getSecondaryText = (modelName, item) => {
    switch (modelName) {
      case "User":
        return item.email || item.username || item.mobileNumber || null;
      case "Product":
        return item.product_code || (item.price ? `$${item.price}` : null);
      case "Customer":
        return item.email || item.phone || null;
      case "Order":
        return (
          item.customer_name || (item.total ? `Total: $${item.total}` : null)
        );
      case "Invoice":
        return item.amount || item.total
          ? `$${item.amount || item.total}`
          : null;
      case "Quotation":
        return item.customer_name || null;
      default:
        return null;
    }
  };

  // Link & title
  const getLinkAndTitle = (modelName, item) => {
    const base = {
      User: {
        link: `/u/${item.userId}`,
        title: item.name || item.username || item.email || "User",
      },
      Product: {
        link: `/product/${item.productId}`,
        title: item.name || item.product_code || "Product",
      },
      Customer: {
        link: `/customer/${item.customerId}`,
        title: item.name || item.companyName || "Customer",
      },
      Order: {
        link: `/order/${item.id}`,
        title: item.title || `Order #${item.orderNo || "N/A"}`,
      },
      Invoice: {
        link: `/invoice/${item.invoiceId}`,
        title: `Invoice #${item.invoiceNo || item.invoiceId || "N/A"}`,
      },
      Quotation: {
        link: `/quotation/${item.quotationId}`,
        title: item.document_title || item.reference_number || "Quotation",
      },
      Brand: { link: `/store/${item.id}`, title: item.brandName || "Brand" },
      Category: {
        link: `/inventory/categories-keywords?category=${item.categoryId}`,
        title: item.name || "Category",
      },
      Vendor: {
        link: `/vendors/${item.id}`,
        title: item.vendorName || "Vendor",
      },
      Company: {
        link: `/companies/${item.companyId}`,
        title: item.name || "Company",
      },
    };

    return base[modelName] || { link: "#", title: "Unknown Item" };
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Search Results</h4>
              <h6>Find users, products, orders, quotations and more</h6>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <Card className="mb-4 shadow-sm">
          <div className="card-body">
            <AntSearch
              placeholder="Search users, products, orders, quotations..."
              enterButton="Search"
              size="large"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onSearch={handleSearch}
              style={{ maxWidth: 800 }}
              loading={isLoading || isFetching}
            />
          </div>
        </Card>

        {/* Results */}
        <Spin spinning={isLoading || isFetching}>
          {query.trim() ? (
            hasResults ? (
              <>
                <h5 className="mb-4">
                  Showing results for "<strong>{query}</strong>"
                </h5>

                {resultGroups.map(([modelName, { items }]) => (
                  <div key={modelName} className="mb-5">
                    <h6 className="mb-3">
                      {modelName}s <Tag color="blue">({items.length})</Tag>
                    </h6>

                    <Row gutter={[16, 16]}>
                      {items.map((item) => {
                        const { link, title } = getLinkAndTitle(
                          modelName,
                          item
                        );
                        const secondary = getSecondaryText(modelName, item);

                        return (
                          <Col
                            xs={24}
                            md={12}
                            lg={8}
                            key={item.id || Math.random()}
                          >
                            <Card hoverable bodyStyle={{ padding: "16px" }}>
                              <div className="d-flex align-items-start">
                                <div className="me-3">
                                  {getIconAndAvatar(modelName, item)}
                                </div>
                                <div className="flex-grow-1">
                                  <h6 className="mb-1">
                                    <Link
                                      to={link}
                                      className="text-dark fw-medium"
                                    >
                                      {highlightText(title, query)}
                                    </Link>
                                  </h6>
                                  {secondary && (
                                    <p className="text-muted small mb-2">
                                      {secondary}
                                    </p>
                                  )}
                                  {/* Optional: add more metadata here */}
                                </div>
                              </div>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  </div>
                ))}
              </>
            ) : (
              <Empty
                description={
                  <span>
                    No results found for "<strong>{query}</strong>"
                  </span>
                }
                style={{ margin: "120px 0" }}
              />
            )
          ) : (
            <Empty
              description="Enter a search term above to see results"
              style={{ margin: "120px 0" }}
            />
          )}
        </Spin>
      </div>
    </div>
  );
};

export default SearchPage;
