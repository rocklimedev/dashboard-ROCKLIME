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
import { debounce } from "lodash"; // ← add lodash or implement your own

const { Title, Text, Paragraph } = Typography;
const { Search: AntSearch } = Input;

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  const {
    data: searchData,
    isLoading,
    isFetching,
    isError,
  } = useSearchAllQuery(
    { query: debouncedQuery.trim(), limit: 20 },
    { skip: !debouncedQuery.trim() },
  );

  // Debounce search input (prevents too many API calls while typing)
  const debouncedSetQuery = useCallback(
    debounce((value) => {
      const trimmed = value?.trim();
      if (trimmed) {
        setSearchParams({ q: trimmed });
      }
      setDebouncedQuery(trimmed);
    }, 350),
    [setSearchParams],
  );

  const results = searchData?.results || {};
  const resultGroups = useMemo(
    () => Object.entries(results).filter(([_, v]) => v?.items?.length > 0),
    [results],
  );

  const hasResults = resultGroups.length > 0;

  const handleSearch = (value) => {
    const trimmed = value?.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed });
      setDebouncedQuery(trimmed);
    }
  };

  const highlight = (text, term) => {
    if (!term?.trim() || typeof text !== "string") return text || "";
    try {
      const regex = new RegExp(`(${term.trim()})`, "gi");
      return text.split(regex).map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            style={{ backgroundColor: "#ffe58f", padding: "0 2px" }}
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
        } else if (typeof item.images === "string") {
          try {
            const parsed = JSON.parse(item.images);
            productImage =
              Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
          } catch (e) {
            // invalid JSON → ignore
          }
        }

        return productImage ? (
          <Avatar
            src={productImage}
            shape="square"
            {...commonProps}
            style={{ objectFit: "cover" }}
            alt={item.name || item.product_code}
          />
        ) : (
          <Avatar
            shape="square"
            icon={<ShoppingCartOutlined />}
            {...commonProps}
          />
        );
      }
      case "order":
      case "invoice":
      case "quotation":
        return <Avatar icon={<FileTextOutlined />} {...commonProps} />;

      case "brand":
        return <Avatar icon={<ShopOutlined />} {...commonProps} />;

      case "category":
        return <Avatar icon={<TagsOutlined />} {...commonProps} />;

      case "vendor":
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
        return item.email || item.mobileNumber || item.phone || null;
      case "product":
        return item.product_code || (item.price && `$${item.price}`);
      case "order":
        return item.customer_name || (item.total && `Total: $${item.total}`);
      case "invoice":
        return item.amount || item.total
          ? `$${item.amount || item.total}`
          : null;
      case "quotation":
        return item.customer_name || item.reference_number || null;
      default:
        return null;
    }
  };

  const getLinkProps = (model, item) => {
    const map = {
      user: {
        to: `/u/${item.userId || item.id}`,
        title: item.name || item.username || item.email || "User",
      },
      customer: {
        to: `/customer/${item.customerId || item.id}`,
        title: item.name || item.companyName || "Customer",
      },
      product: {
        to: `/product/${item.productId || item.id}`,
        title: item.name || item.product_code || "Product",
      },
      order: {
        to: `/order/${item.id || item.orderId}`,
        title: `Order #${item.orderNo || item.id || "—"}`,
      },
      invoice: {
        to: `/invoice/${item.invoiceId || item.id}`,
        title: `Invoice #${item.invoiceNo || item.id || "—"}`,
      },
      quotation: {
        to: `/quotation/${item.quotationId || item.id}`,
        title: item.document_title || item.reference_number || "Quotation",
      },
      brand: { to: `/store/${item.id}`, title: item.brandName || "Brand" },
      category: {
        to: `/inventory/categories-keywords?category=${item.categoryId || item.id}`,
        title: item.name || "Category",
      },
      vendor: { to: `/vendors/${item.id}`, title: item.vendorName || "Vendor" },
      company: {
        to: `/companies/${item.companyId || item.id}`,
        title: item.name || "Company",
      },
    };

    const key = model.toLowerCase();
    return map[key] || { to: "#", title: "Unknown" };
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <Title level={3} style={{ marginBottom: 8 }}>
          Search
        </Title>
        <Paragraph type="secondary" style={{ marginBottom: 32 }}>
          Find users, products, orders, customers, quotations and more
        </Paragraph>

        <Card style={{ marginBottom: 32, borderRadius: 12 }}>
          <AntSearch
            placeholder="Search users, products, orders, invoices..."
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
            title="Something went wrong"
            subTitle="We couldn't load search results. Please try again."
            extra={
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => window.location.reload()}
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
            <Spin size="large" tip="Searching..." />
          </div>
        ) : query.trim() ? (
          hasResults ? (
            resultGroups.map(([modelName, { items }]) => (
              <section key={modelName} style={{ marginBottom: 48 }}>
                <Space align="center" style={{ marginBottom: 16 }}>
                  <Title level={5} style={{ margin: 0 }}>
                    {modelName}s
                  </Title>
                  <Tag
                    color="geekblue"
                    style={{ fontSize: 14, padding: "4px 12px" }}
                  >
                    {items.length}
                  </Tag>
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
                        key={item.id || `${modelName}-${Math.random()}`}
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
                                style={{ margin: "0 0 4px 0", fontSize: 16 }}
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
                                <Text type="secondary" style={{ fontSize: 13 }}>
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
            ))
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div style={{ marginTop: 16 }}>
                  <Paragraph strong>No results found for "{query}"</Paragraph>
                  <Text type="secondary">
                    Try different keywords or check your spelling
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
                <Paragraph strong>Start typing to search</Paragraph>
                <Text type="secondary">
                  Users, products, orders, quotations, customers...
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
