// src/components/SearchOverlay.jsx
import React from "react";
import { Spin, Empty } from "antd";
import { Link } from "react-router-dom";

const SearchOverlay = ({ visible, loading, results, onClose, query }) => {
  if (!visible) return null;

  const resultGroups = results
    ? Object.entries(results).filter(([_, data]) => data.items?.length > 0)
    : [];

  const hasResults = resultGroups.length > 0;

  const getLinkAndTitle = (modelName, item) => {
    switch (modelName) {
      case "User":
        return {
          link: `/u/${item.userId}`,
          title: item.name || item.username || item.email,
        };
      case "Product":
        return {
          link: `/product/${item.productId}`,
          title: item.name || item.product_code,
        };
      case "Customer":
        return {
          link: `/customer/${item.customerId}`,
          title: item.name || item.companyName,
        };
      case "Order":
        return {
          link: `/order/${item.id}`,
          title: item.title || `Order #${item.id}`,
        };
      case "Invoice":
        return { link: `/invoice/${item.invoiceId}`, title: item.invoiceNo };
      case "Quotation":
        return {
          link: `/quotation/${item.quotationId}`,
          title: item.document_title || item.reference_number,
        };
      case "Brand":
        return {
          link: `/store/${item.id}`,
          title: item.brandName,
        };
      case "Category":
        return { link: `/categories/${item.categoryId}`, title: item.name };
      case "Vendor":
        return { link: `/vendors/${item.id}`, title: item.vendorName };
      case "Company":
        return { link: `/companies/${item.companyId}`, title: item.name };
      default:
        return { link: "#", title: JSON.stringify(item) };
    }
  };

  return (
    <div className="search-overlay-backdrop" onClick={onClose}>
      <div
        className="search-overlay-content"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="search-overlay-header">
          <span className="search-query-text">
            {query ? `Results for "${query}"` : "Search results"}
          </span>
        </div>

        <Spin spinning={loading}>
          <div className="search-results-wrapper">
            {" "}
            {/* Add this wrapper */}
            {loading ? (
              <div className="search-loading text-center py-5">
                Searching...
              </div>
            ) : !hasResults && query ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No results found"
              />
            ) : !query ? (
              <div className="text-center text-muted py-5">
                Start typing to search across users, products, orders,
                invoices...
              </div>
            ) : (
              <>
                {resultGroups.map(([modelName, { items }]) => (
                  <div key={modelName} className="search-result-group">
                    <div className="search-group-title">
                      {modelName}s ({items.length})
                    </div>
                    {items.map((item) => {
                      const { link, title } = getLinkAndTitle(modelName, item);
                      const key =
                        item.userId ||
                        item.productId ||
                        item.id ||
                        item.invoiceId ||
                        item.quotationId ||
                        item.categoryId ||
                        item.companyId;

                      return (
                        <Link
                          key={key}
                          to={link}
                          className="search-result-item"
                          onClick={onClose}
                        >
                          <span className="result-title">{title}</span>
                          {item.email && (
                            <span className="result-meta">{item.email}</span>
                          )}
                          {item.invoiceNo && (
                            <span className="result-meta">
                              #{item.invoiceNo}
                            </span>
                          )}
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
