import React, { useState } from "react";
import { Button, Tooltip, Badge, Dropdown, Spin, Input } from "antd";
import {
  ShoppingCartOutlined,
  HeartOutlined,
  HeartFilled,
  MoreOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import pos from "../../assets/img/default.png";
import "./productlist.css";

const ProductCard = ({
  product,
  getBrandsName,
  getCategoryName,
  formatPrice,
  handleAddToCart,
  handleToggleFeatured,
  cartLoadingStates,
  featuredLoadingStates,
  menu,
}) => {
  const [quantity, setQuantity] = useState(product.quantity > 0 ? 1 : 0);

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
    }
  };

  const handleAddToCartWithQuantity = () => {
    if (quantity > 0) handleAddToCart({ ...product, quantity });
  };

  return (
    <div className="product-info card mb-0">
      <div className="image-wrapper">
        <img
          src={product?.images?.[0] || pos}
          alt={product.name || "Product"}
          className="product-image-card"
        />
      </div>

      <span className="heart-button-wrapper">
        <Dropdown overlay={menu(product)} trigger={["click"]}>
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="large"
            className="more-options-btn"
          />
        </Dropdown>
      </span>
      {/* <Button
          type="text"
          icon={
            featuredLoadingStates[product.productId] ? (
              <Spin size="small" />
            ) : product.isFeatured ? (
              <HeartFilled style={{ color: "#ff4d4f" }} />
            ) : (
              <HeartOutlined style={{ color: "#ff4d4f" }} />
            )
          }
          onClick={(e) => {
            e.preventDefault();
            handleToggleFeatured(product);
          }}
          className="heart-button"
          disabled={featuredLoadingStates[product.productId]}
        /> */}

      {product.quantity <= 0 && (
        <Badge count="Out of Stock" className="out-of-stock-badge" />
      )}

      <h6 className="product-name">
        <Link to={`/product/${product.productId}`}>
          {product.name || "N/A"}
        </Link>
      </h6>
      <div className="price">
        <p className="text-gray-9 mb-0">{formatPrice(product.sellingPrice)}</p>
        {/* Qty */}
        <div className="qty-item">
          <Tooltip title="Minus">
            <button type="button" className="dec" onClick={handleDecrement}>
              <i className="ti ti-minus"></i>
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
            <button type="button" className="inc" onClick={handleIncrement}>
              <i className="ti ti-plus"></i>
            </button>
          </Tooltip>
        </div>

        {/* Actions in one row */}
      </div>

      <Tooltip title={product.quantity <= 0 ? "Out of stock" : ""}>
        <Button
          style={{ color: "#c72c41" }}
          icon={
            cartLoadingStates[product.productId] ? (
              <Spin size="small" />
            ) : (
              <ShoppingCartOutlined />
            )
          }
          onClick={handleAddToCartWithQuantity}
          disabled={
            cartLoadingStates[product.productId] || (product.quantity ?? 0) <= 0
          }
          size="large"
          className="add-to-cart-btn"
        >
          {product.quantity <= 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
      </Tooltip>
    </div>
  );
};

export default ProductCard;
