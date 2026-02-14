// src/components/ProductCard.jsx
import React, { useState } from "react";
import { Button, Tooltip, Badge, Dropdown, Input, message } from "antd";
import {
  ShoppingCartOutlined,
  MoreOutlined,
  PlusOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import pos from "../../assets/img/default.png";
import "../../pages/Products/productlist.css";
import PermissionGate from "../../context/PermissionGate";
import { useAuth } from "../../context/AuthContext";

// Known meta UUIDs — keep in sync with ProductsList / backend
const META_KEYS = {
  SELLING_PRICE: "9ba862ef-f993-4873-95ef-1fef10036aa5",
  COMPANY_CODE: "d11da9f9-3f2e-4536-8236-9671200cca4a", // model/company code
};

const ProductCard = ({
  product,
  getBrandsName,
  getCategoryName,
  handleAddToCart,
  cartLoadingStates,
  menu,
}) => {
  const [quantity, setQuantity] = useState(product.quantity > 0 ? 1 : 0);
  const { auth } = useAuth();

  // ── Image handling ───────────────────────────────────────
  const safeParseImages = (images) => {
    if (Array.isArray(images) && images.length > 0) return images;
    if (typeof images === "string" && images.trim()) {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) && parsed.length ? parsed : [pos];
      } catch {
        return [pos];
      }
    }
    return [pos];
  };

  const productImages = safeParseImages(product.images);

  // ── Price & Code from flat meta object (same as ProductsList) ──
  const meta = product?.meta || {};

  const rawPrice = meta[META_KEYS.SELLING_PRICE];
  const priceValue = rawPrice ? parseFloat(rawPrice) : NaN;
  const displayPrice = !isNaN(priceValue)
    ? `₹${priceValue.toFixed(2)}`
    : "Price not set";

  const companyCode =
    String(meta[META_KEYS.COMPANY_CODE] || "").trim() || "N/A";

  // ── Quantity logic ───────────────────────────────────────
  const handleIncrement = () => {
    if (quantity < product.quantity) setQuantity(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleQuantityChange = (e) => {
    const val = e.target.value.trim();
    if (val === "") {
      setQuantity("");
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= product.quantity) {
      setQuantity(num);
    }
  };

  const handleAddToCartWithQuantity = () => {
    if (isNaN(priceValue)) {
      message.error("Cannot add — price is not set");
      return;
    }
    if (quantity < 1 || quantity > product.quantity) {
      message.error("Invalid quantity");
      return;
    }
    handleAddToCart(product, quantity);
  };

  // ── Permissions & states ─────────────────────────────────
  const permissions = auth?.permissions ?? [];
  const canAddToCart = permissions.some(
    (p) => p.action === "write" && p.module === "cart",
  );
  const canEditOrDelete = permissions.some(
    (p) => ["edit", "delete"].includes(p.action) && p.module === "products",
  );

  const isOutOfStock = product.quantity <= 0;
  const hasValidPrice = !isNaN(priceValue);

  return (
    <div className="card mb-0">
      {/* Image + Stock badge */}
      <div className="image-wrapper">
        <img
          src={productImages[0] || pos}
          alt={product.name || "Product"}
          className="product-image-card"
        />
        {isOutOfStock ? (
          <div className="status-bar out-of-stock">Out of Stock</div>
        ) : (
          <div className="status-bar in-stock">{product.quantity}</div>
        )}
      </div>

      {/* More options dropdown */}
      {canEditOrDelete && (
        <PermissionGate api="edit|delete" module="products">
          <Dropdown overlay={menu(product)} trigger={["click"]}>
            <Button
              type="text"
              icon={<MoreOutlined />}
              size="large"
              className="more-options-btn"
            />
          </Dropdown>
        </PermissionGate>
      )}

      {/* Out of stock badge (alternative position) */}
      {isOutOfStock && (
        <Badge count="Out of Stock" className="out-of-stock-badge" />
      )}

      {/* Name */}
      <h6 className="product-name">
        <Link to={`/product/${product.productId}`}>
          {product.name || "Unnamed Product"}
        </Link>
      </h6>

      {/* Price + Quantity selector */}
      <div className="price">
        <p className="text-gray-9 mb-0 fw-bold">{displayPrice}</p>

        <div className="qty-item">
          <Tooltip title="Decrease">
            <button
              type="button"
              className="dec"
              onClick={handleDecrement}
              disabled={isOutOfStock || quantity <= 1}
            >
              <MinusOutlined />
            </button>
          </Tooltip>

          <Input
            type="text"
            className="form-control text-center"
            value={quantity}
            onChange={handleQuantityChange}
            disabled={isOutOfStock}
            style={{ width: 60, textAlign: "center" }}
          />

          <Tooltip title="Increase">
            <button
              type="button"
              className="inc"
              onClick={handleIncrement}
              disabled={isOutOfStock || quantity >= product.quantity}
            >
              <PlusOutlined />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Add to Cart */}
      {canAddToCart && (
        <Tooltip
          title={
            isOutOfStock
              ? "Out of stock"
              : !hasValidPrice
                ? "Price not set"
                : "Add to cart"
          }
        >
          <Button
            type="primary"
            className="cart-button"
            icon={<ShoppingCartOutlined />}
            onClick={handleAddToCartWithQuantity}
            disabled={
              isOutOfStock ||
              !hasValidPrice ||
              cartLoadingStates[product.productId]
            }
            size="large"
            block
            loading={cartLoadingStates[product.productId]}
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
        </Tooltip>
      )}
    </div>
  );
};

export default ProductCard;
