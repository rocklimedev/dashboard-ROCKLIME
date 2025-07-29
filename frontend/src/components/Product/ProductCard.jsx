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
    if (quantity < product.quantity) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= product.quantity) {
      setQuantity(value);
    }
  };

  const handleAddToCartWithQuantity = () => {
    if (quantity > 0) {
      handleAddToCart({ ...product, quantity });
    }
  };

  return (
    <div className="product-info card mb-0">
      <a href={`/product/${product.productId}`} className="pro-img">
        <div className="image-wrapper">
          <img
            src={product?.images?.[0] || pos}
            alt={product.name || "Product"}
            className="product-image-card"
          />
        </div>
        <span className="heart-button-wrapper">
          <Button
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
          />
        </span>
        {product.quantity <= 0 && (
          <Badge count="Out of Stock" className="out-of-stock-badge" />
        )}
      </a>
      <h6 className="cat-name">
        <Link to={`/category/${product.categoryId}`}>
          {getCategoryName(product.categoryId)}
        </Link>
      </h6>
      <h6 className="product-name">
        <Link to={`/product/${product.productId}`}>
          {product.name || "N/A"}
        </Link>
      </h6>
      <div className="d-flex align-items-center justify-content-between price">
        <p className="text-gray-9 mb-0">{formatPrice(product.sellingPrice)}</p>
        <div className="qty-item m-0">
          <Tooltip title="Minus">
            <a
              href="javascript:void(0);"
              className="dec d-flex justify-content-center align-items-center"
              onClick={handleDecrement}
            >
              <i className="ti ti-minus"></i>
            </a>
          </Tooltip>
          <Input
            type="text"
            className="form-control text-center"
            value={quantity}
            onChange={handleQuantityChange}
            disabled={product.quantity <= 0}
            style={{ width: 60 }}
          />
          <Tooltip title="Plus">
            <a
              href="javascript:void(0);"
              className="inc d-flex justify-content-center align-items-center"
              onClick={handleIncrement}
            >
              <i className="ti ti-plus"></i>
            </a>
          </Tooltip>
        </div>
      </div>
      <div className="product-actions">
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
              cartLoadingStates[product.productId] ||
              (product.quantity ?? 0) <= 0
            }
            block
            size="large"
          >
            {product.quantity <= 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </Tooltip>
        <Dropdown overlay={menu(product)} trigger={["click"]}>
          <Button
            type="text"
            icon={<MoreOutlined />}
            size="large"
            className="more-options-btn"
          />
        </Dropdown>
      </div>
    </div>
  );
};

export default ProductCard;
