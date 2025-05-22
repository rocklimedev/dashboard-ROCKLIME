import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  useGetProductByIdQuery,
  useGetAllProductsByCategoryQuery, // Correct hook
} from "../../api/productApi";
import { useGetCategoryByIdQuery } from "../../api/categoryApi";
import { useGetParentCategoryByIdQuery } from "../../api/parentCategoryApi";
import { useGetBrandByIdQuery } from "../../api/brandsApi";
import JsBarcode from "jsbarcode";
import { toast } from "react-toastify";
import Loader from "../../components/Common/Loader";
import noimage from "../../assets/img/default.png";
import "./productdetails.css";

const ProductDetails = () => {
  const { id } = useParams();
  const {
    data: product,
    error: productError,
    isLoading: isProductLoading,
    refetch: refetchProduct,
  } = useGetProductByIdQuery(id);
  const { data: categoryData, isLoading: isCategoryLoading } =
    useGetCategoryByIdQuery(product?.categoryId, {
      skip: !product?.categoryId,
    });
  const { data: parentCategoryData, isLoading: isParentCategoryLoading } =
    useGetParentCategoryByIdQuery(categoryData?.category?.parentCategoryId, {
      skip: !categoryData?.category?.parentCategoryId,
    });
  const {
    data: brandData,
    isLoading: isBrandLoading,
    error: brandError,
  } = useGetBrandByIdQuery(product?.brandId, { skip: !product?.brandId });
  const {
    data: recommendedProducts,
    isLoading: isRecommendedLoading,
    error: recommendedError,
  } = useGetAllProductsByCategoryQuery(product?.categoryId, {
    skip: !product?.categoryId,
  });

  const [barcodeData, setBarcodeData] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [zoomStyle, setZoomStyle] = useState({});
  const barcodeRef = useRef(null);
  const mainImageRef = useRef(null);

  // Parse images from product.images
  const getParsedImages = (imageField) => {
    if (!imageField) return [];
    try {
      if (typeof imageField === "string") {
        const parsed = JSON.parse(imageField);
        if (Array.isArray(parsed))
          return parsed.filter((img) => img && typeof img === "string");
        if (typeof parsed === "string" && parsed.startsWith("http"))
          return [parsed];
      }
      if (Array.isArray(imageField)) {
        return imageField.filter((img) => img && typeof img === "string");
      }
      return [];
    } catch (err) {
      if (typeof imageField === "string" && imageField.startsWith("http")) {
        return [imageField];
      }
      return [];
    }
  };

  // Generate barcode
  const generateBarcode = (code) => {
    if (code && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, code, {
          format: "CODE128",
          lineColor: "#000",
          width: 2,
          height: 40,
          displayValue: true,
        });
      } catch (error) {
        toast.error("Failed to generate barcode.");
      }
    }
  };

  // Print barcode
  const handlePrint = () => {
    if (barcodeRef.current) {
      const canvas = barcodeRef.current;
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <body onload="window.print();window.close()">
            <img src="${canvas.toDataURL()}" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast.error("No barcode available to print.");
    }
  };

  // Add to cart handler
  const handleAddToCart = () => {
    toast.success(`${product.name} (Quantity: ${quantity}) added to cart!`);
    // Implement cart logic here
  };

  // Buy now handler
  const handleBuyNow = () => {
    toast.success(
      `Proceeding to checkout for ${product.name} (Quantity: ${quantity})`
    );
    // Implement checkout logic here
  };

  // Image zoom handler
  const handleMouseMove = (e) => {
    const { left, top, width, height } =
      mainImageRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const xPercent = (x / width) * 100;
    const yPercent = (y / height) * 100;

    setZoomStyle({
      transformOrigin: `${xPercent}% ${yPercent}%`,
      transform: "scale(2)",
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({});
  };

  // Set barcode and handle errors
  useEffect(() => {
    if (product?.product_code) {
      setBarcodeData(product.product_code);
    }
    if (brandError) {
      toast.error("Failed to load brand information.");
    }
    if (recommendedError) {
      toast.error(
        recommendedError.status === 401 || recommendedError.status === 403
          ? "Unauthorized to view recommended products."
          : recommendedError.status === 404
          ? "No recommended products found."
          : "Failed to load recommended products."
      );
    }
  }, [product, brandError, recommendedError]);

  // Generate barcode when barcodeData changes
  useEffect(() => {
    if (barcodeData) {
      generateBarcode(barcodeData);
    }
  }, [barcodeData]);

  if (
    isProductLoading ||
    isCategoryLoading ||
    isParentCategoryLoading ||
    isBrandLoading
  ) {
    return <Loader loading={true} />;
  }

  if (productError) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p className="error-message">
            Error: {productError.message || "Failed to load product"}
          </p>
          <button
            className="btn-retry"
            onClick={refetchProduct}
            aria-label="Retry loading product"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p className="error-message">Product not found.</p>
        </div>
      </div>
    );
  }

  const images = getParsedImages(product.images);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="product-container">
          {/* Left Side - Product Images */}
          <div className="product-gallery">
            <div className="main-image-wrapper" ref={mainImageRef}>
              <img
                src={images[selectedImage] || noimage}
                alt={product.name || "Product Image"}
                className="main-image"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={zoomStyle}
                onError={(e) => (e.target.src = noimage)}
              />
            </div>
            <div className="thumbnail-gallery">
              {images.length > 0 ? (
                images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className={`thumbnail ${
                      selectedImage === idx ? "active" : ""
                    }`}
                    onClick={() => setSelectedImage(idx)}
                    onError={(e) => (e.target.src = noimage)}
                    tabIndex={0}
                    onKeyPress={(e) =>
                      e.key === "Enter" && setSelectedImage(idx)
                    }
                  />
                ))
              ) : (
                <img
                  src={noimage}
                  alt="No Image"
                  className="thumbnail"
                  tabIndex={0}
                />
              )}
            </div>
          </div>

          {/* Middle - Product Details */}
          <div className="product-info">
            <h1 className="product-title">{product.name || "N/A"}</h1>
            <p className="brand">Brand: {brandData?.brandName || "N/A"}</p>
            <p className="price">
              {product.sellingPrice
                ? `₹${Number(product.sellingPrice).toFixed(2)}`
                : "N/A"}
            </p>
            <p className="tax">
              Tax:{" "}
              {product.tax ? `${Number(product.tax).toFixed(2)}%` : "0.00%"}
            </p>
            <p className="stock">
              {product.quantity > 0
                ? `In Stock: ${product.quantity}`
                : "Out of Stock"}
            </p>
            <p className="description">
              {product.description || "No description available"}
            </p>
            <div className="barcode-section">
              <svg ref={barcodeRef} aria-hidden="true" />
              <button
                className="btn btn-print"
                onClick={handlePrint}
                aria-label="Print barcode"
                disabled={!barcodeData}
              >
                Print Barcode
              </button>
            </div>
            <ul className="product-details-list">
              <li>
                <strong>Category:</strong>{" "}
                {parentCategoryData?.data?.name ||
                  categoryData?.category?.name ||
                  "N/A"}
              </li>
              <li>
                <strong>Sub Category:</strong>{" "}
                {categoryData?.category?.name || "None"}
              </li>
              <li>
                <strong>Product Code:</strong> {product.product_code || "N/A"}
              </li>
              <li>
                <strong>Product Group:</strong> {product.productGroup || "N/A"}
              </li>
              <li>
                <strong>Product Segment:</strong>{" "}
                {product.product_segment || "N/A"}
              </li>
              <li>
                <strong>Alert Quantity:</strong> {product.alert_quantity || "0"}
              </li>
            </ul>
          </div>

          {/* Right Side - Action Panel */}
          <div className="action-panel">
            <div className="action-panel-inner">
              <div className="quantity-selector">
                <label htmlFor="quantity">Quantity:</label>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  min="1"
                  max={product.quantity || 1}
                  className="quantity-input"
                  aria-label="Select quantity"
                />
              </div>
              <button
                className="btn btn-add-to-cart"
                onClick={handleAddToCart}
                disabled={product.quantity <= 0}
                aria-label="Add to cart"
              >
                Add to Cart
              </button>
              <button
                className="btn btn-buy-now"
                onClick={handleBuyNow}
                disabled={product.quantity <= 0}
                aria-label="Buy now"
              >
                Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Recommended Products Section */}
        <div className="recommended-products">
          <h2>Recommended Products</h2>
          {isRecommendedLoading ? (
            <Loader loading={true} />
          ) : recommendedProducts?.length > 0 ? (
            <div className="recommended-grid">
              {recommendedProducts
                .filter(
                  (recProduct) => recProduct.productId !== product.productId
                )
                .slice(0, 4)
                .map((recProduct) => (
                  <div
                    key={recProduct.productId}
                    className="recommended-product"
                  >
                    <a
                      href={`/product/${recProduct.productId}`}
                      aria-label={`View ${recProduct.name}`}
                    >
                      <img
                        src={getParsedImages(recProduct.images)[0] || noimage}
                        alt={recProduct.name}
                        className="recommended-image"
                        onError={(e) => (e.target.src = noimage)}
                      />
                      <h5>{recProduct.name}</h5>
                      <p>₹{Number(recProduct.sellingPrice).toFixed(2)}</p>
                    </a>
                  </div>
                ))}
            </div>
          ) : (
            <p>No recommended products available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
