import React, { useEffect, useRef, useState } from "react";
import { Spin, Empty, Avatar, Button, message } from "antd";
import { Link, useNavigate } from "react-router-dom";
import {
  SearchOutlined,
  UserOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  DownOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";

// Cart & User APIs
import { useAddProductToCartMutation } from "../../api/cartApi";
import { useGetProfileQuery } from "../../api/userApi";

const SearchOverlay = ({ visible, loading, results, onClose, query }) => {
  const overlayRef = useRef(null);
  const highlightedIndex = useRef(-1);
  const navigate = useNavigate();

  // ==================== CART FUNCTIONALITY ====================
  const { data: user } = useGetProfileQuery();
  const userId = user?.user?.userId;
  const [addToCart, { isLoading: isCartLoadingGlobal }] =
    useAddProductToCartMutation();
  const [cartLoadingStates, setCartLoadingStates] = useState({});

  // Keyboard navigation (unchanged)
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

  // Add to Cart Handler
  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      return message.error("Please login first");
    }
    if (!product?.productId) {
      return message.error("Invalid product");
    }

    const productKey = product.productId;
    setCartLoadingStates((prev) => ({ ...prev, [productKey]: true }));

    try {
      await addToCart({
        userId,
        productId: product.productId,
        quantity: 1,
      }).unwrap();

      message.success(`Added ${product.name || "item"} to cart`);
    } catch (err) {
      message.error(err?.data?.message || "Failed to add to cart");
    } finally {
      setCartLoadingStates((prev) => ({ ...prev, [productKey]: false }));
    }
  };

  if (!visible) return null;

  // Get groups that have at least one result
  const resultGroups = results
    ? Object.entries(results).filter(([_, group]) => group?.items?.length > 0)
    : [];

  // Prioritize important categories (unchanged)
  const prioritizedGroups = [...resultGroups].sort((a, b) => {
    const order = [
      "Product",
      "PurchaseOrder",
      "Order",
      "Quotation",
      "Category",
    ];
    const indexA = order.indexOf(a[0]);
    const indexB = order.indexOf(b[0]);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return 0;
  });

  const hasResults = prioritizedGroups.length > 0;

  // Safe text highlighter (unchanged)
  const highlightText = (text, highlight) => {
    if (!highlight?.trim() || typeof text !== "string") return text || "";
    try {
      const regex = new RegExp(`(${highlight.trim()})`, "gi");
      return text
        .split(regex)
        .map((part, i) =>
          regex.test(part) ? <mark key={i}>{part}</mark> : part,
        );
    } catch {
      return text;
    }
  };

  // All other functions (getIconAndAvatar, getSecondaryText, getLinkAndTitle) remain unchanged
  const getIconAndAvatar = (modelName, item) => {
    switch (modelName) {
      case "User":
        const userPhoto =
          item.photo_thumbnail || item.photo_original || item.photo;
        return userPhoto ? (
          <Avatar src={userPhoto} size={40} alt={item.name || item.username} />
        ) : (
          <Avatar icon={<UserOutlined />} size={40} />
        );

      case "Product":
        let productImage = null;
        if (Array.isArray(item.images) && item.images.length > 0) {
          productImage = item.images[0];
        } else if (typeof item.images === "string" && item.images.trim()) {
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

      case "PurchaseOrder":
        return (
          <Avatar
            icon={<FileTextOutlined />}
            size={40}
            style={{ backgroundColor: "#722ed1" }}
          />
        );

      case "Order":
      case "Invoice":
      case "Quotation":
        return <Avatar icon={<FileTextOutlined />} size={40} />;

      case "Brand":
      case "Vendor":
        return <Avatar icon={<ShoppingOutlined />} size={40} />;

      case "Category":
        return <Avatar icon={<SearchOutlined />} size={40} />;

      default:
        return <Avatar icon={<SearchOutlined />} size={40} />;
    }
  };

  // Secondary info
  const getSecondaryText = (modelName, item) => {
    switch (modelName) {
      case "User":
        return item.email || item.mobileNumber || item.username;
      case "Product":
        return item.product_code;
      case "Customer":
        return item.email || item.mobileNumber;
      case "Order":
        return item.status ? `Status: ${item.status}` : null;
      case "PurchaseOrder":
        return item.status
          ? `Status: ${item.status}`
          : item.totalAmount
            ? `₹${item.totalAmount}`
            : null;
      case "Quotation":
        return (
          item.reference_number || (item.finalAmount && `₹${item.finalAmount}`)
        );
      case "Category":
        return item.parentCategoryId ? "Sub Category" : "Main Category";
      default:
        return null;
    }
  };

  // Link & title
  const getLinkAndTitle = (modelName, item) => {
    const base = {
      User: {
        link: `/u/${item.userId || item.id}`,
        title: item.name || item.username || item.email || "User",
      },
      Product: {
        link: `/product/${item.productId || item.id}`,
        title: item.name || item.product_code || "Product",
      },
      Customer: {
        link: `/customer/${item.customerId || item.id}`,
        title: item.name || "Customer",
      },
      Order: {
        link: `/order/${item.id || item.orderId}`,
        title: `Order #${item.orderNo || item.id}`,
      },
      PurchaseOrder: {
        link: `/purchase-order/${item.id || item.poNumber}`,
        title: `PO #${item.poNumber}`,
      },
      Invoice: {
        link: `/invoice/${item.invoiceId || item.id}`,
        title: `Invoice #${item.invoiceNo || item.id}`,
      },
      Quotation: {
        link: `/quotation/${item.quotationId || item.id}`,
        title: item.document_title || item.reference_number || "Quotation",
      },
      Brand: {
        link: `/store/${item.id}`,
        title: item.brandName || "Brand",
      },
      Category: {
        link: `/inventory/categories-keywords?category=${item.categoryId || item.id}`,
        title: item.name || "Category",
      },
      Vendor: {
        link: `/vendors/${item.id || item.vendorId}`,
        title: item.vendorName || "Vendor",
      },
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
        <Spin spinning={loading}>
          <div className="search-results-wrapper">
            {loading ? (
              <div className="search-loading text-center py-6">
                <Spin size="large" />
                <div className="mt-3 text-muted">
                  Searching across all modules...
                </div>
              </div>
            ) : !query?.trim() ? (
              <div className="text-center text-muted py-8">
                <SearchOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />
                <div className="mt-4">
                  Start typing to search users, products, orders, purchase
                  orders, quotations...
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
              prioritizedGroups.map(([modelName, group]) => {
                const { items, total } = group;

                return (
                  <div key={modelName} className="search-result-group">
                    <div className="search-group-title">
                      {modelName}s{" "}
                      <span className="result-count">
                        (
                        {total > items.length
                          ? `${items.length} of ${total}`
                          : items.length}
                        )
                      </span>
                    </div>

                    {items.map((item) => {
                      const { link, title } = getLinkAndTitle(modelName, item);
                      const secondary = getSecondaryText(modelName, item);
                      const isProduct = modelName === "Product";
                      const isAdding = cartLoadingStates[item.productId];

                      const key =
                        item.userId ||
                        item.productId ||
                        item.id ||
                        item.poNumber ||
                        item.quotationId ||
                        item.categoryId ||
                        Math.random().toString();

                      return (
                        <div
                          key={key}
                          className="search-result-item-wrapper d-flex align-items-center"
                        >
                          <Link
                            to={link}
                            className="search-result-item flex-grow-1 d-flex align-items-center"
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

                          {/* Add to Cart Button - Only for Products */}
                          {isProduct && (
                            <Button
                              type="primary"
                              size="small"
                              icon={<ShoppingCartOutlined />}
                              loading={isAdding}
                              disabled={isCartLoadingGlobal}
                              onClick={(e) => handleAddToCart(e, item)}
                              style={{
                                backgroundColor: "#e31e24",
                                borderColor: "#e31e24",
                              }}
                              className="me-3"
                            >
                              Add
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default SearchOverlay;
