// src/components/SearchOverlay.jsx
import React, { useEffect, useRef } from "react";
import { Spin, Empty, Avatar } from "antd";
import { Link } from "react-router-dom";
import {
  SearchOutlined,
  UserOutlined,
  ShoppingOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const SearchOverlay = ({ visible, loading, results, onClose, query }) => {
  const overlayRef = useRef(null);
  const highlightedIndex = useRef(-1);

  // All hooks must come first — BEFORE any early returns!
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e) => {
      const items = overlayRef.current?.querySelectorAll(".search-result-item");
      if (!items || items.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        highlightedIndex.current =
          (highlightedIndex.current + 1) % items.length;
        items[highlightedIndex.current].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        highlightedIndex.current =
          (highlightedIndex.current - 1 + items.length) % items.length;
        items[highlightedIndex.current].focus();
      } else if (e.key === "Enter" && highlightedIndex.current >= 0) {
        e.preventDefault();
        items[highlightedIndex.current].click();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  // Now it's safe to early return
  if (!visible) return null;

  const resultGroups = results
    ? Object.entries(results).filter(([_, data]) => data.items?.length > 0)
    : [];

  const hasResults = resultGroups.length > 0;

  // Simple text highlighter
  const highlightText = (text, highlight) => {
    if (!highlight?.trim()) return text;
    const regex = new RegExp(`(${highlight.trim()})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };

  const getIconAndAvatar = (modelName, item) => {
    switch (modelName) {
      case "User":
        return item.photo_thumbnail || item.profileImage ? (
          <Avatar src={item.photo_thumbnail || item.profileImage} size={36} />
        ) : (
          <Avatar icon={<UserOutlined />} size={36} />
        );
      case "Product":
        return item.image || item.thumbnail ? (
          <Avatar src={item.image || item.thumbnail} shape="square" size={36} />
        ) : (
          <Avatar icon={<ShoppingOutlined />} shape="square" size={36} />
        );
      case "Order":
      case "Invoice":
      case "Quotation":
        return <Avatar icon={<FileTextOutlined />} size={36} />;
      default:
        return <Avatar icon={<SearchOutlined />} size={36} />;
    }
  };

  const getSecondaryText = (modelName, item) => {
    switch (modelName) {
      case "User":
        return item.email || item.username;
      case "Product":
        return item.product_code || (item.price ? `$${item.price}` : null);
      case "Customer":
        return item.email || item.phone;
      case "Order":
        return item.customer_name || `Total: $${item.total}`;
      case "Invoice":
        return `Amount: $${item.amount || item.total}`;
      case "Quotation":
        return item.customer_name;
      default:
        return null;
    }
  };

  const getLinkAndTitle = (modelName, item) => {
    const base = {
      User: {
        link: `/u/${item.userId}`,
        title: item.name || item.username || item.email,
      },
      Product: {
        link: `/product/${item.productId}`,
        title: item.name || item.product_code,
      },
      Customer: {
        link: `/customer/${item.customerId}`,
        title: item.name || item.companyName,
      },
      Order: {
        link: `/order/${item.id}`,
        title: item.title || `Order #${item.id}`,
      },
      Invoice: {
        link: `/invoice/${item.invoiceId}`,
        title: `Invoice #${item.invoiceNo || item.invoiceId}`,
      },
      Quotation: {
        link: `/quotation/${item.quotationId}`,
        title: item.document_title || item.reference_number,
      },
      Brand: { link: `/store/${item.id}`, title: item.brandName },
      Category: { link: `/categories/${item.categoryId}`, title: item.name },
      Vendor: { link: `/vendors/${item.id}`, title: item.vendorName },
      Company: { link: `/companies/${item.companyId}`, title: item.name },
    };

    return base[modelName] || { link: "#", title: "Unknown Item" };
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
              "Type to search..."
            )}
          </span>
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
                <SearchOutlined style={{ fontSize: 48, color: "#ccc" }} />
                <div className="mt-4">
                  Start typing to search across users, products, orders,
                  invoices...
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
              />
            ) : (
              <>
                {resultGroups.map(([modelName, { items }]) => (
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
                        Math.random();

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
                              <div className="result-meta">{secondary}</div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default SearchOverlay;
