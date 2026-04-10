import React, { useState, useMemo, useCallback } from "react";
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
  Typography,
  Result,
  Pagination,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  TagsOutlined,
  ShopOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useSearchAllQuery } from "../../api/searchApi";
import { debounce } from "lodash";

const { Title, Text, Paragraph } = Typography;
const { Search: AntSearch } = Input;

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: searchResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useSearchAllQuery(
    {
      query: debouncedQuery.trim(),
      page: currentPage,
      limit: 20,
    },
    { skip: !debouncedQuery.trim() },
  );

  // Debounce search input
  const debouncedSetQuery = useCallback(
    debounce((value) => {
      const trimmed = value?.trim();
      if (trimmed) {
        setSearchParams({ q: trimmed });
        setCurrentPage(1); // Reset to first page on new search
      }
      setDebouncedQuery(trimmed || "");
    }, 350),
    [setSearchParams],
  );

  const results = searchResponse?.data || {};
  const meta = searchResponse?.meta || {};

  // Filter categories that have results
  const resultGroups = useMemo(() => {
    return Object.entries(results).filter(
      ([_, group]) => group?.items?.length > 0,
    );
  }, [results]);

  const hasResults = resultGroups.length > 0;

  const handleSearch = (value) => {
    const trimmed = value?.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed });
      setDebouncedQuery(trimmed);
      setCurrentPage(1);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const highlight = (text, term) => {
    if (!term?.trim() || typeof text !== "string") return text || "";
    try {
      const regex = new RegExp(`(${term.trim()})`, "gi");
      return text.split(regex).map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{
              backgroundColor: "#ffe58f",
              padding: "0 2px",
              borderRadius: 2,
            }}
          >
            {part}
          </mark>
        ) : (
          part
        ),
      );
    } catch {
      return text;
    }
  };

  const getIcon = (modelName, item) => {
    const commonProps = { size: 48 };

    switch (modelName.toLowerCase()) {
      case "user":
      case "customer":
        return item.photo_thumbnail || item.photo ? (
          <Avatar src={item.photo_thumbnail || item.photo} {...commonProps} />
        ) : (
          <Avatar icon={<UserOutlined />} {...commonProps} />
        );

      case "product": {
        let productImage = null;
        if (Array.isArray(item.images) && item.images.length > 0) {
          productImage = item.images[0];
        } else if (typeof item.images === "string" && item.images.trim()) {
          try {
            const parsed = JSON.parse(item.images);
            productImage =
              Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
          } catch (e) {}
        }

        return productImage ? (
          <Avatar
            src={productImage}
            shape="square"
            {...commonProps}
            style={{ objectFit: "cover" }}
          />
        ) : (
          <Avatar
            shape="square"
            icon={<ShoppingCartOutlined />}
            {...commonProps}
          />
        );
      }

      case "purchaseorder":
        return (
          <Avatar
            icon={<FileTextOutlined />}
            {...commonProps}
            style={{ backgroundColor: "#722ed1" }}
          />
        );

      case "order":
      case "invoice":
      case "quotation":
        return <Avatar icon={<FileTextOutlined />} {...commonProps} />;

      case "brand":
        return <Avatar icon={<ShopOutlined />} {...commonProps} />;

      case "category":
        return <Avatar icon={<TagsOutlined />} {...commonProps} />;

      case "vendor":
      case "team":
      case "company":
        return <Avatar icon={<TeamOutlined />} {...commonProps} />;

      default:
        return <Avatar icon={<SearchOutlined />} {...commonProps} />;
    }
  };

  const getSubtitle = (model, item) => {
    switch (model.toLowerCase()) {
      case "user":
      case "customer":
        return item.email || item.mobileNumber || null;
      case "product":
        return item.product_code || null;
      case "order":
        return item.status ? `Status: ${item.status}` : null;
      case "quotation":
        return (
          item.reference_number || (item.finalAmount && `₹${item.finalAmount}`)
        );
      case "purchaseorder":
        return item.status
          ? `Status: ${item.status}`
          : item.totalAmount
            ? `₹${item.totalAmount}`
            : null;
      case "category":
        return item.parentCategoryId ? "Sub Category" : "Main Category";
      default:
        return null;
    }
  };

  const getLinkProps = (model, item) => {
    const map = {
      user: {
        to: `/u/${item.userId || item.id}`,
        title: item.name || item.username || "User",
      },
      customer: {
        to: `/customer/${item.customerId || item.id}`,
        title: item.name || "Customer",
      },
      product: {
        to: `/product/${item.productId || item.id}`,
        title: item.name || item.product_code || "Product",
      },
      order: {
        to: `/order/${item.id || item.orderId}`,
        title: `Order #${item.orderNo || item.id}`,
      },
      quotation: {
        to: `/quotation/${item.quotationId || item.id}`,
        title: item.document_title || `Quotation #${item.reference_number}`,
      },
      brand: { to: `/store/${item.id}`, title: item.brandName || "Brand" },
      category: {
        to: `/inventory/categories-keywords?category=${item.categoryId || item.id}`,
        title: item.name || "Category",
      },
      vendor: {
        to: `/vendors/${item.id || item.vendorId}`,
        title: item.vendorName || "Vendor",
      },
      purchaseorder: {
        to: `/purchase-order/${item.id || item.poNumber}`,
        title: `PO #${item.poNumber}`,
      },
    };

    const key = model.toLowerCase();
    return map[key] || { to: "#", title: "Item" };
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <Title level={3}>Global Search</Title>
        <Paragraph type="secondary" style={{ marginBottom: 32 }}>
          Search across Users, Products, Orders, Customers, Quotations, Purchase
          Orders, and more
        </Paragraph>

        <Card style={{ marginBottom: 32, borderRadius: 12 }}>
          <AntSearch
            placeholder="Search users, products, orders, purchase orders..."
            enterButton={
              <Space>
                <SearchOutlined /> Search
              </Space>
            }
            size="large"
            allowClear
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              debouncedSetQuery(e.target.value);
            }}
            onSearch={handleSearch}
            style={{ maxWidth: 720 }}
          />
        </Card>

        {isError ? (
          <Result
            status="error"
            title="Search Failed"
            subTitle="Something went wrong while fetching results."
            extra={
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={refetch}
              >
                Retry
              </Button>
            }
          />
        ) : isLoading || isFetching ? (
          <div
            style={{
              minHeight: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Spin size="large" tip="Searching across all modules..." />
          </div>
        ) : query.trim() ? (
          hasResults ? (
            <>
              {resultGroups.map(([modelName, group]) => {
                const { items, total, totalPages, page } = group;

                return (
                  <section key={modelName} style={{ marginBottom: 48 }}>
                    <Space align="center" style={{ marginBottom: 16 }}>
                      <Title
                        level={5}
                        style={{ margin: 0, textTransform: "capitalize" }}
                      >
                        {modelName}s
                      </Title>
                      <Tag
                        color="geekblue"
                        style={{ fontSize: 14, padding: "4px 12px" }}
                      >
                        {total} found
                      </Tag>
                      {totalPages > 1 && (
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          Page {page} of {totalPages}
                        </Text>
                      )}
                    </Space>

                    <Row gutter={[16, 24]}>
                      {items.map((item) => {
                        const { to, title } = getLinkProps(modelName, item);
                        const subtitle = getSubtitle(modelName, item);

                        return (
                          <Col
                            xs={24}
                            sm={12}
                            lg={8}
                            xl={6}
                            key={
                              item.id ||
                              item.userId ||
                              item.productId ||
                              item.categoryId ||
                              Math.random()
                            }
                          >
                            <Card
                              hoverable
                              bodyStyle={{ padding: 16 }}
                              style={{ height: "100%", borderRadius: 10 }}
                            >
                              <Space
                                align="start"
                                size={16}
                                style={{ width: "100%" }}
                              >
                                {getIcon(modelName, item)}

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <Title
                                    level={5}
                                    style={{
                                      margin: "0 0 4px 0",
                                      fontSize: 16,
                                    }}
                                  >
                                    <Link
                                      to={to}
                                      style={{
                                        color: "#000",
                                        textDecoration: "none",
                                      }}
                                    >
                                      {highlight(title, debouncedQuery)}
                                    </Link>
                                  </Title>

                                  {subtitle && (
                                    <Text
                                      type="secondary"
                                      style={{ fontSize: 13 }}
                                    >
                                      {highlight(subtitle, debouncedQuery)}
                                    </Text>
                                  )}
                                </div>
                              </Space>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  </section>
                );
              })}

              {/* Global Pagination */}
              {meta.totalPages > 1 && (
                <div style={{ textAlign: "center", margin: "50px 0 30px 0" }}>
                  <Pagination
                    current={currentPage}
                    total={meta.total || 0}
                    pageSize={20}
                    onChange={handlePageChange}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total) => `Total ${total} results`}
                  />
                </div>
              )}
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div style={{ marginTop: 16 }}>
                  <Paragraph strong>No results found for "{query}"</Paragraph>
                  <Text type="secondary">
                    Try different keywords or check spelling
                  </Text>
                </div>
              }
              style={{ margin: "120px 0" }}
            />
          )
        ) : (
          <Empty
            description={
              <div style={{ marginTop: 16 }}>
                <Paragraph strong>
                  Start typing to search the entire system
                </Paragraph>
                <Text type="secondary">
                  Users • Products • Orders • Purchase Orders • Quotations •
                  Customers • Vendors...
                </Text>
              </div>
            }
            style={{ margin: "140px 0" }}
          />
        )}
      </div>
    </div>
  );
};

export default SearchPage;
