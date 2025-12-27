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
  cartLoadingStates,
  menu,
}) => {
  const [quantity, setQuantity] = useState(product.quantity > 0 ? 1 : 0);
  const { auth } = useAuth();

  // Safe image parsing
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

  // Known UUIDs from your data
  const SELLING_PRICE_UUID = "9ba862ef-f993-4873-95ef-1fef10036aa5";
  const COMPANY_CODE_UUID = "d11da9f9-3f2e-4536-8236-9671200cca4a";

  // Try to get from metaDetails first
  const sellingPriceEntry = product.metaDetails?.find(
    (m) => m.slug?.toLowerCase() === "sellingprice"
  );
  const companyCodeEntry = product.metaDetails?.find(
    (m) => m.slug?.toLowerCase() === "companycode"
  );

  // Fallback: if value is UUID (wrong), get real value from raw meta
  const getRealValue = (entry, fallbackUuid) => {
    if (!entry) return null;
    const val = entry.value;
    if (typeof val === "string" && val.length === 36 && val.includes("-")) {
      return product.meta?.[fallbackUuid] || val;
    }
    return val;
  };

  const realPriceValue = getRealValue(sellingPriceEntry, SELLING_PRICE_UUID);
  const realCodeValue = getRealValue(companyCodeEntry, COMPANY_CODE_UUID);

  const displayPrice =
    realPriceValue && !isNaN(parseFloat(realPriceValue))
      ? `₹${parseFloat(realPriceValue).toFixed(2)}`
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
    if (!realPriceValue || isNaN(parseFloat(realPriceValue))) {
      message.error("Invalid price");
      return;
    }
    if (quantity <= 0 || quantity > product.quantity) {
      message.error("Invalid quantity");
      return;
    }
    handleAddToCart(product, quantity); // Pass quantity
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
  const hasValidPrice = realPriceValue && !isNaN(parseFloat(realPriceValue));

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
