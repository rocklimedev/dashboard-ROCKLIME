// src/components/SearchOverlay.jsx
import React, { useEffect, useRef } from "react";
import { Spin, Empty, Avatar, Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import {
  SearchOutlined,
  UserOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  DownOutlined,
} from "@ant-design/icons";

const SearchOverlay = ({ visible, loading, results, onClose, query }) => {
  const overlayRef = useRef(null);
  const highlightedIndex = useRef(-1);
  const navigate = useNavigate();

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e) => {
      const items = overlayRef.current?.querySelectorAll(".search-result-item");
      if (!items || items.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        highlightedIndex.current =
          (highlightedIndex.current + 1) % items.length;
        items[highlightedIndex.current]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        highlightedIndex.current =
          (highlightedIndex.current - 1 + items.length) % items.length;
        items[highlightedIndex.current]?.focus();
      } else if (e.key === "Enter" && highlightedIndex.current >= 0) {
        e.preventDefault();
        items[highlightedIndex.current]?.click();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  // Get filtered groups with at least 1 item
  const resultGroups = results
    ? Object.entries(results).filter(([_, data]) => data.items?.length > 0)
    : [];

  // Prioritize "Product" → always first if present
  const prioritizedGroups = [...resultGroups].sort((a, b) => {
    if (a[0] === "Product") return -1;
    if (b[0] === "Product") return 1;
    return 0;
  });

  const hasResults = prioritizedGroups.length > 0;

  // Safe text highlighter
  const highlightText = (text, highlight) => {
    if (!highlight?.trim() || typeof text !== "string") return text || "";
    try {
      const regex = new RegExp(`(${highlight.trim()})`, "gi");
      const parts = text.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? <mark key={i}>{part}</mark> : part,
      );
    } catch {
      return text;
    }
  };

  // Avatar / Icon logic
  const getIconAndAvatar = (modelName, item) => {
    switch (modelName) {
      case "User":
        const userPhoto = item.photo_thumbnail || item.photo_original;
        return userPhoto ? (
          <Avatar src={userPhoto} size={40} alt={item.name || item.username} />
        ) : (
          <Avatar icon={<UserOutlined />} size={40} />
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
            size={40}
            style={{ objectFit: "cover" }}
            alt={item.name || item.product_code}
          />
        ) : (
          <Avatar icon={<ShoppingOutlined />} shape="square" size={40} />
        );

      case "Order":
      case "Invoice":
      case "Quotation":
        return <Avatar icon={<FileTextOutlined />} size={40} />;

      default:
        return <Avatar icon={<SearchOutlined />} size={40} />;
    }
  };

  // Secondary info
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

  // Navigate to full search page
  const handleViewAllResults = () => {
    onClose();
    if (query?.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate("/search");
    }
  };

  return (
    <div className="search-overlay-backdrop" onClick={onClose}>
      <div
        className="search-overlay-content"
        onClick={(e) => e.stopPropagation()}
        ref={overlayRef}
      >
        <div className="search-overlay-header">
          <span className="search-query-text">
            {query ? (
              <>
                Results for "<strong>{query}</strong>"
              </>
            ) : (
              "Type to search users, products, orders, invoices..."
            )}
          </span>

          {query?.trim() && hasResults && (
            <Button
              type="link"
              onClick={handleViewAllResults}
              className="view-all-link"
            >
              View all results <DownOutlined />
            </Button>
          )}
        </div>

        <Spin spinning={loading}>
          <div className="search-results-wrapper">
            {loading ? (
              <div className="search-loading text-center py-6">
                <Spin size="large" />
                <div className="mt-3 text-muted">Searching...</div>
              </div>
            ) : !query ? (
              <div className="text-center text-muted py-8">
                <SearchOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />
                <div className="mt-4">
                  Start typing to search across users, products, orders,
                  invoices, quotations...
                </div>
              </div>
            ) : !hasResults ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    No results found for "<strong>{query}</strong>"
                  </span>
                }
                style={{ margin: "60px 0" }}
              />
            ) : (
              prioritizedGroups.map(([modelName, { items }]) => (
                <div key={modelName} className="search-result-group">
                  <div className="search-group-title">
                    {modelName}s{" "}
                    <span className="result-count">({items.length})</span>
                  </div>

                  {items.map((item) => {
                    const { link, title } = getLinkAndTitle(modelName, item);
                    const secondary = getSecondaryText(modelName, item);
                    const key =
                      item.userId ||
                      item.productId ||
                      item.id ||
                      item.invoiceId ||
                      item.quotationId ||
                      item.categoryId ||
                      item.companyId ||
                      Math.random().toString();

                    return (
                      <Link
                        key={key}
                        to={link}
                        className="search-result-item d-flex align-items-center"
                        onClick={onClose}
                        tabIndex={0}
                      >
                        <div className="result-avatar me-3">
                          {getIconAndAvatar(modelName, item)}
                        </div>

                        <div className="result-content flex-grow-1">
                          <div className="result-title">
                            {highlightText(title, query)}
                          </div>
                          {secondary && (
                            <div className="result-meta text-muted small">
                              {highlightText(secondary, query)}
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default SearchOverlay;
