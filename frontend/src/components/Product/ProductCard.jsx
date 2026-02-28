// src/components/ProductCard.jsx
import React, { useState } from "react";
import { Button, Dropdown, Input, message } from "antd";
import {
  ShoppingCartOutlined,
  MoreOutlined,
  PlusOutlined,
  MinusOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import pos from "../../assets/img/default.png";
import "./productlist.css";
import PermissionGate from "../../context/PermissionGate";
import { useAuth } from "../../context/AuthContext";

const META_KEYS = {
  SELLING_PRICE: "9ba862ef-f993-4873-95ef-1fef10036aa5",
  COMPANY_CODE: "d11da9f9-3f2e-4536-8236-9671200cca4a",
};

const ProductCard = ({ product, handleAddToCart, cartLoadingStates, menu }) => {
  const { auth } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [isSelectingQty, setIsSelectingQty] = useState(false);

  const safeParseImages = (images) => {
    try {
      if (Array.isArray(images) && images.length > 0) return images;
      if (!images) return [pos];
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) && parsed.length ? parsed : [pos];
    } catch {
      return [pos];
    }
  };

  const productImages = safeParseImages(product.images);

  const meta = product?.meta || {};
  const rawPrice = meta[META_KEYS.SELLING_PRICE];
  const priceValue = rawPrice ? parseFloat(rawPrice) : NaN;

  // Company Code extraction
  const companyCode = meta[META_KEYS.COMPANY_CODE]
    ? String(meta[META_KEYS.COMPANY_CODE]).trim()
    : "—";

  const displayPrice = !isNaN(priceValue)
    ? `₹${priceValue.toFixed(2)}`
    : "Price not set";

  const canAddToCart = auth?.permissions?.some(
    (p) => p.action === "write" && p.module === "cart",
  );

  const canEditOrDelete = auth?.permissions?.some(
    (p) => ["edit", "delete"].includes(p.action) && p.module === "products",
  );

  const isOutOfStock = product.quantity <= 0;

  // AUTO UPDATE CART QUANTITY
  const updateCartQuantity = (newQty) => {
    if (newQty < 1) return;
    if (newQty > product.quantity) return;

    setQuantity(newQty);
    handleAddToCart(product, newQty);
  };

  const handleIncrement = () => {
    if (quantity < product.quantity) {
      updateCartQuantity(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      updateCartQuantity(quantity - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const num = parseInt(e.target.value, 10);
    if (!isNaN(num)) {
      updateCartQuantity(num);
    }
  };

  return (
    <div className="card mb-0">
      {/* IMAGE */}
      <div className="image-wrapper">
        <img
          src={productImages[0]}
          alt={product.name}
          className="product-image-card"
        />

        {isOutOfStock ? (
          <div className="status-bar out-of-stock">Out of Stock</div>
        ) : (
          <div className="status-bar in-stock">{product.quantity}</div>
        )}
      </div>

      {/* MENU */}
      {canEditOrDelete && (
        <PermissionGate api="edit|delete" module="products">
          <Dropdown overlay={menu(product)} trigger={["click"]}>
            <Button
              type="text"
              icon={<MoreOutlined />}
              className="more-options-btn"
            />
          </Dropdown>
        </PermissionGate>
      )}

      {/* NAME */}
      <h6 className="product-name">
        <Link to={`/product/${product.productId}`}>{product.name}</Link>
      </h6>

      {/* COMPANY CODE + PRICE – placed side by side, code on left */}
      <div
        className="meta-row"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 12px",
          margin: "8px 0 12px",
        }}
      >
        {/* Left: Company Code */}
        <div className="company-code">
          <span className="text-muted" style={{ fontSize: "0.9rem" }}>
            <strong style={{ color: "#1a1a1a", fontWeight: 600 }}>
              {companyCode}
            </strong>
          </span>
        </div>

        {/* Right: Price */}
        <div className="price">
          <p
            className="mb-0 fw-bold"
            style={{
              fontSize: "1.1rem",
              color: isNaN(priceValue) ? "#999" : "#d32f2f",
            }}
          >
            {displayPrice}
          </p>
        </div>
      </div>

      {/* ADD TO CART SECTION */}
      {canAddToCart && (
        <>
          {!isSelectingQty ? (
            <Button
              type="primary"
              className="cart-button"
              icon={<ShoppingCartOutlined />}
              disabled={isOutOfStock || isNaN(priceValue)}
              block
              onClick={() => {
                setIsSelectingQty(true);
                updateCartQuantity(1); // ADD TO CART IMMEDIATELY
              }}
            >
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </Button>
          ) : (
            <div
              className="amazon-qty-bar"
              style={{
                marginTop: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                background: "#f7f7f7",
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                gap: "10px",
              }}
            >
              {/* - BUTTON */}
              <button
                className="dec"
                style={{
                  width: "35px",
                  height: "35px",
                  borderRadius: "6px",
                  background: "#fff",
                  border: "1px solid #ccc",
                }}
                onClick={handleDecrement}
                disabled={quantity <= 1}
              >
                <MinusOutlined />
              </button>

              {/* QUANTITY INPUT */}
              <Input
                type="text"
                value={quantity}
                onChange={handleQuantityChange}
                style={{
                  width: "60px",
                  textAlign: "center",
                  fontWeight: "bold",
                  borderRadius: "6px",
                }}
              />

              {/* + BUTTON */}
              <button
                className="inc"
                style={{
                  width: "35px",
                  height: "35px",
                  borderRadius: "6px",
                  background: "#fff",
                  border: "1px solid #ccc",
                }}
                onClick={handleIncrement}
                disabled={quantity >= product.quantity}
              >
                <PlusOutlined />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductCard;
