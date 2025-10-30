// src/components/ProductCard.jsx
import React, { useState } from "react";
import { Button, Tooltip, Badge, Dropdown, Spin, Input } from "antd";
import {
  ShoppingCartOutlined,
  MoreOutlined,
  PlusOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import pos from "../../assets/img/default.png";
import "./productlist.css";
import { toast } from "sonner";

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
  const { auth, isLoadingPermissions } = useAuth(); // HOOK AT TOP LEVEL

  /* --------------------------------------------------------------
     1. IMAGE PARSING
     -------------------------------------------------------------- */
  const parseImages = (images) => {
    try {
      if (typeof images === "string" && images.trim() !== "") {
        return JSON.parse(images);
      }
      return [pos];
    } catch {
      return [pos];
    }
  };
  const productImages = product.images ? parseImages(product.images) : [pos];

  /* --------------------------------------------------------------
     2. PRICE
     -------------------------------------------------------------- */
  const sellingPriceMeta = product.metaDetails?.find(
    (meta) => meta.slug === "sellingPrice"
  );
  const sellingPrice = sellingPriceMeta
    ? parseFloat(sellingPriceMeta.value)
    : null;
  const displayPrice =
    sellingPrice !== null && !isNaN(sellingPrice)
      ? `₹${sellingPrice.toFixed(2)}`
      : "Price not available";

  /* --------------------------------------------------------------
     3. QUANTITY HANDLERS
     -------------------------------------------------------------- */
  const handleIncrement = () => {
    if (quantity < product.quantity) setQuantity(quantity + 1);
  };
  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= product.quantity) {
      setQuantity(value);
    } else if (e.target.value === "") {
      setQuantity(1);
    }
  };

  const handleAddToCartWithQuantity = () => {
    if (quantity > 0 && sellingPrice !== null && !isNaN(sellingPrice)) {
      handleAddToCart({ ...product, quantity });
    } else {
      toast.error(
        sellingPrice !== null && !isNaN(sellingPrice)
          ? "Invalid quantity"
          : "Invalid product price"
      );
    }
  };

  /* --------------------------------------------------------------
     4. PERMISSION CHECKS (TOP-LEVEL)
     -------------------------------------------------------------- */
  const permissions = auth?.permissions ?? [];

  const hasAddToCartPermission = permissions.some(
    (p) => p.action === "write" && p.module === "cart"
  );

  const hasProductActionPermission = permissions.some(
    (p) => ["edit", "delete"].includes(p.action) && p.module === "products"
  );

  return (
    <div className="card mb-0">
      {/* ---------- IMAGE + STOCK ---------- */}
      <div className="image-wrapper">
        <img
          src={productImages[0] || pos}
          alt={product.name || "Product"}
          className="product-image-card"
        />
        {product.quantity > 0 ? (
          <div className="status-bar in-stock">{`${product.quantity} in stock`}</div>
        ) : (
          <div className="status-bar out-of-stock">Out of Stock</div>
        )}
      </div>

      {/* ---------- THREE-DOT MENU ---------- */}
      {hasProductActionPermission && (
        <Dropdown overlay={menu(product)} trigger={["click"]}>
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="large"
            className="more-options-btn"
            aria-label="More options"
          />
        </Dropdown>
      )}

      {/* ---------- OUT-OF-STOCK BADGE ---------- */}
      {product.quantity <= 0 && (
        <Badge count="Out of Stock" className="out-of-stock-badge" />
      )}

      {/* ---------- PRODUCT NAME ---------- */}
      <h6 className="product-name">
        <Link to={`/product/${product.productId}`}>
          {product.name || "N/A"}
        </Link>
      </h6>

      {/* ---------- PRICE + QUANTITY ---------- */}
      <div className="price">
        <p className="text-gray-9 mb-0">{displayPrice}</p>

        <div className="qty-item">
          <Tooltip title="Minus">
            <button
              type="button"
              className="dec"
              onClick={handleDecrement}
              disabled={product.quantity <= 0 || quantity <= 1}
            >
              <MinusOutlined />
            </button>
          </Tooltip>

          <Input
            type="text"
            className="form-control text-center"
            value={quantity}
            onChange={handleQuantityChange}
            disabled={product.quantity <= 0}
          />

          <Tooltip title="Plus">
            <button
              type="button"
              className="inc"
              onClick={handleIncrement}
              disabled={product.quantity <= 0 || quantity >= product.quantity}
            >
              <PlusOutlined />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* ---------- ADD-TO-CART BUTTON ---------- */}
      {hasAddToCartPermission && (
        <Tooltip
          title={
            product.quantity <= 0
              ? "Out of stock"
              : sellingPrice === null || isNaN(sellingPrice)
              ? "Invalid price"
              : "Add to cart"
          }
        >
          <Button
            className="cart-button"
            icon={
              cartLoadingStates[product.productId] ? (
                <Spin size="small" />
              ) : (
                <ShoppingCartOutlined />
              )
            }
            onClick={handleAddToCartWithQuantity}
            disabled={
              cartLoadingStates[product.productId] ||
              product.quantity <= 0 ||
              sellingPrice === null ||
              isNaN(sellingPrice)
            }
            size="large"
          >
            {product.quantity <= 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </Tooltip>
      )}
    </div>
  );
};

export default ProductCard;
