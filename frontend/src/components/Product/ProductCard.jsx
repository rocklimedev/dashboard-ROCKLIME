import React, { useState } from "react";
import { Button, Tooltip, Badge, Dropdown, Spin, Input } from "antd";
import { ShoppingCartOutlined, MoreOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import pos from "../../assets/img/default.png";
import "./productlist.css";
import { toast } from "sonner";
const ProductCard = ({
  product,
  getBrandsName,
  getCategoryName,
  formatPrice,
  handleAddToCart,
  cartLoadingStates,
  menu,
}) => {
  const [quantity, setQuantity] = useState(product.quantity > 0 ? 1 : 0);

  // Safely parse images from JSON string
  const productImages = product.images ? JSON.parse(product.images) : [pos];

  // Get sellingPrice from metaDetails
  const sellingPrice =
    product.metaDetails?.find((meta) => meta.title === "sellingPrice")?.value ||
    null;

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
      setQuantity(1); // Reset to 1 if input is cleared
    }
  };

  const handleAddToCartWithQuantity = () => {
    if (quantity > 0 && sellingPrice) {
      handleAddToCart({ ...product, quantity });
    } else {
      toast.error(sellingPrice ? "Invalid quantity" : "Invalid product price");
    }
  };

  return (
    <div className="card mb-0">
      <div className="image-wrapper">
        <img
          src={productImages[0] || pos}
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
            aria-label="More options"
          />
        </Dropdown>
      </span>

      {product.quantity <= 0 && (
        <Badge count="Out of Stock" className="out-of-stock-badge" />
      )}

      <h6 className="product-name">
        <Link to={`/product/${product.productId}`}>
          {product.name || "N/A"}
        </Link>
      </h6>
      <div className="price">
        <p className="text-gray-9 mb-0">{formatPrice(sellingPrice)}</p>
        <div className="qty-item">
          <Tooltip title="Minus">
            <button
              type="button"
              className="dec"
              onClick={handleDecrement}
              disabled={product.quantity <= 0 || quantity <= 1}
              aria-label="Decrease quantity"
            >
              <i className="ti ti-minus"></i>
            </button>
          </Tooltip>

          <Input
            type="text"
            className="form-control text-center"
            value={quantity}
            onChange={handleQuantityChange}
            disabled={product.quantity <= 0}
            aria-label="Quantity"
          />

          <Tooltip title="Plus">
            <button
              type="button"
              className="inc"
              onClick={handleIncrement}
              disabled={product.quantity <= 0 || quantity >= product.quantity}
              aria-label="Increase quantity"
            >
              <i className="ti ti-plus"></i>
            </button>
          </Tooltip>
        </div>
      </div>

      <Tooltip
        title={
          product.quantity <= 0
            ? "Out of stock"
            : !sellingPrice
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
            !sellingPrice
          }
          size="large"
          aria-label="Add to cart"
        >
          {product.quantity <= 0 ? "Out of Stock" : "Add to Cart"}
        </Button>
      </Tooltip>
    </div>
  );
};

export default ProductCard;
