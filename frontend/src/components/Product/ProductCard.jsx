// src/components/ProductCard.jsx
import React, { useState } from "react";
import { Button, Tooltip, Badge, Dropdown, Input } from "antd";
import {
  ShoppingCartOutlined,
  MoreOutlined,
  PlusOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import pos from "../../assets/img/default.png";
import "./productlist.css";
import { message } from "antd";
import PermissionGate from "../../context/PermissionGate";
import { useAuth } from "../../context/AuthContext";

const ProductCard = ({
  product,
  getBrandsName,
  getCategoryName,
  handleAddToCart,
  cartLoadingStates, // Kept for potential future use, but not used in UI
  menu,
}) => {
  const [quantity, setQuantity] = useState(product.quantity > 0 ? 1 : 0);
  const { auth } = useAuth();

  // Safe image parsing – handles array or JSON string
  const safeParseImages = (images) => {
    if (Array.isArray(images) && images.length) return images;
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

  // Extract selling price from metaDetails
  const sellingPriceMeta = Array.isArray(product.metaDetails)
    ? product.metaDetails.find((m) => m.slug === "sellingPrice")
    : null;

  const sellingPrice = sellingPriceMeta
    ? parseFloat(sellingPriceMeta.value)
    : null;

  const displayPrice =
    sellingPrice !== null && !isNaN(sellingPrice)
      ? `₹${sellingPrice.toFixed(2)}`
      : "Price not set";

  // Quantity controls
  const handleIncrement = () => {
    if (quantity < product.quantity) setQuantity(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleQuantityChange = (e) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value, 10);
    if (value === "" || (value >= 1 && value <= product.quantity)) {
      setQuantity(value || 1);
    }
  };

  const handleAddToCartWithQuantity = () => {
    if (quantity > 0 && sellingPrice !== null && !isNaN(sellingPrice)) {
      handleAddToCart({ productId: product.productId, quantity });
    } else {
      message.error("Invalid quantity or price");
    }
  };

  // Permissions
  const permissions = auth?.permissions ?? [];
  const canAddToCart = permissions.some(
    (p) => p.action === "write" && p.module === "cart"
  );

  const canEditOrDelete = permissions.some(
    (p) => ["edit", "delete"].includes(p.action) && p.module === "products"
  );

  const isOutOfStock = product.quantity <= 0;
  const hasValidPrice = sellingPrice !== null && !isNaN(sellingPrice);

  return (
    <div className="card mb-0">
      {/* Image + Stock Status */}
      <div className="image-wrapper">
        <img
          src={productImages[0] || pos}
          alt={product.name || "Product"}
          className="product-image-card"
        />
        {isOutOfStock ? (
          <div className="status-bar out-of-stock">Out of Stock</div>
        ) : (
          <div className="status-bar in-stock">{`${product.quantity}`}</div>
        )}
      </div>

      {/* More Options Menu */}
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

      {/* Out of Stock Badge */}
      {isOutOfStock && (
        <Badge count="Out of Stock" className="out-of-stock-badge" />
      )}

      {/* Product Name */}
      <h6 className="product-name">
        <Link to={`/product/${product.productId}`}>
          {product.name || "Unnamed Product"}
        </Link>
      </h6>

      {/* Price + Quantity Selector */}
      <div className="price">
        <p className="text-gray-9 mb-0">{displayPrice}</p>

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
            style={{ width: 50 }}
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

      {/* Add to Cart Button */}
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
            disabled={isOutOfStock || !hasValidPrice}
            size="large"
            block
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
        </Tooltip>
      )}
    </div>
  );
};

export default ProductCard;
