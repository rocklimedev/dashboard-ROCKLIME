import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useGetProductByIdQuery,
  useGetAllProductsByCategoryQuery,
} from "../../api/productApi";
import { useGetCategoryByIdQuery } from "../../api/categoryApi";
import { useGetParentCategoryByIdQuery } from "../../api/parentCategoryApi";
import { useGetBrandByIdQuery } from "../../api/brandsApi";
import JsBarcode from "jsbarcode";
import { toast } from "react-toastify";
import { Breadcrumb, Button, InputNumber, Rate, Spin, Tabs } from "antd";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { ShoppingCartOutlined } from "@ant-design/icons";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
} from "react-share";
import ProductCard from "./ProductCard";
import "./productdetails.css";
import "swiper/css";
import "swiper/css/navigation";
import "react-lazy-load-image-component/src/effects/blur.css";
import noimage from "../../assets/img/default.png";
import { Menu } from "antd";

const ProductDetails = () => {
  const { id } = useParams();
  const {
    data: product,
    error: productError,
    isLoading: isProductLoading,
    refetch: refetchProduct,
  } = useGetProductByIdQuery(id);
  console.log(product);
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
  const [quantity, setQuantity] = useState(1);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const barcodeRef = useRef(null);
  const swiperRef = useRef(null);

  // Parse images
  const getParsedImages = (imageField) => {
    if (!imageField) return [noimage];
    try {
      if (typeof imageField === "string") {
        const parsed = JSON.parse(imageField);
        return Array.isArray(parsed)
          ? parsed.filter((img) => img && typeof img === "string")
          : parsed.startsWith("http")
          ? [parsed]
          : [noimage];
      }
      return Array.isArray(imageField)
        ? imageField.filter((img) => img && typeof img === "string")
        : [noimage];
    } catch {
      return typeof imageField === "string" && imageField.startsWith("http")
        ? [imageField]
        : [noimage];
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
            <img src="${canvas.toDataURL()}" alt="Product Barcode" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast.error("No barcode available to print.");
    }
  };

  // Add to cart handler
  const handleAddToCart = async (product) => {
    setIsAddingToCart(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    } catch {
      toast.error("Failed to add to cart.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle thumbnail click
  const handleThumbnailClick = (index) => {
    setActiveSlide(index);
    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slideTo(index);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (value) => {
    if (value >= 1 && value <= (product?.quantity || 1)) {
      setQuantity(value);
    }
  };
  // Helper to get selling price from meta array
  const getSellingPrice = (meta) => {
    if (!Array.isArray(meta)) return null;
    const spObj = meta.find((m) => m.title === "sellingPrice");
    return spObj ? Number(spObj.value) : null;
  };

  // Only calculate sellingPrice if product exists
  const sellingPrice = product ? getSellingPrice(product.meta) : null;
  // Dummy functions for ProductCard (replace with actual implementations)
  const getBrandsName = (brandId) => brandData?.brandName || "Not Branded";
  const getCategoryName = (categoryId) =>
    categoryData?.category?.name || "Uncategorized";
  const formatPrice = (price) =>
    price !== null && !isNaN(Number(price))
      ? `₹${Number(price).toFixed(2)}`
      : "N/A";
  const handleToggleFeatured = (product) => {
    toast.info(`Toggled featured status for ${product.name}`);
  };
  const menu = (product) => (
    <Menu>
      <Menu.Item key="view">
        <Link to={`/product/${product.productId}`}>View</Link>
      </Menu.Item>
    </Menu>
  );

  // Effect for barcode and error handling
  useEffect(() => {
    if (product?.product_code) {
      setBarcodeData(product.product_code);
      generateBarcode(product.product_code);
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

  if (
    isProductLoading ||
    isCategoryLoading ||
    isParentCategoryLoading ||
    isBrandLoading
  ) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (productError) {
    return (
      <div className="main__product product">
        <div className="container">
          <div className="product__inner">
            <div className="product__wrapper">
              <p className="error-text">
                Error: {productError.message || "Failed to load product"}
              </p>
              <Button
                type="primary"
                onClick={refetchProduct}
                className="btn btn-primary"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="main__product product">
        <div className="container">
          <div className="product__inner">
            <div className="product__wrapper">
              <p className="error-text">Product not found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="main__product product">
        <div className="container">
          <div className="product__inner">
            <div className="product__wrapper">
              <p className="error-text">Product not found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const images = getParsedImages(product.images);
  const shareUrl = `${window.location.origin}/product/${product.productId}`;
  const shareTitle = `Check out ${product.name} on our store!`;

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Breadcrumbs */}
        <div className="main__breadcrumbs breadcrumbs">
          <Breadcrumb
            className="breadcrumbs__list"
            items={[
              {
                title: (
                  <Link to="/" className="breadcrumbs__list-link">
                    Home
                  </Link>
                ),
              },
              {
                title: (
                  <Link
                    to="/inventory/products"
                    className="breadcrumbs__list-link"
                  >
                    Shop
                  </Link>
                ),
              },
              {
                title: (
                  <span className="breadcrumbs__list-text">
                    {product.name || "N/A"}
                  </span>
                ),
              },
            ]}
          />
        </div>

        {/* Product Section */}
        <div className="main__product product">
          <div className="product__inner">
            {/* Product Gallery */}
            <div className="product__wrapper">
              <div className="product__swiper product-swiper swiper">
                <Swiper
                  modules={[Navigation, Autoplay]}
                  navigation={{
                    prevEl: ".product-swiper__prev",
                    nextEl: ".product-swiper__next",
                  }}
                  autoplay={{ delay: 5000, disableOnInteraction: true }}
                  spaceBetween={10}
                  slidesPerView={1}
                  onSwiper={(swiper) => (swiperRef.current = swiper)}
                  onSlideChange={(swiper) => setActiveSlide(swiper.activeIndex)}
                >
                  {images.map((img, idx) => (
                    <SwiperSlide
                      key={idx}
                      className="product-slide swiper-slide"
                    >
                      <LazyLoadImage
                        src={img}
                        alt={`Product Image ${idx + 1} for ${product.name}`}
                        effect="blur"
                        placeholderSrc={noimage}
                        className="product-slide__img"
                        onError={(e) => (e.target.src = noimage)}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <div className="product-swiper__prev">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </div>
                <div className="product-swiper__next">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
              <div className="product__images product-images">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`product-images__img ${
                      activeSlide === idx ? "product-images__img--active" : ""
                    }`}
                    onClick={() => handleThumbnailClick(idx)}
                  >
                    <LazyLoadImage
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="product-images__img-image"
                      onError={(e) => (e.target.src = noimage)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Content */}
            <div className="product__content product-content">
              <h1 className="product-content__title">
                {product.name || "N/A"}
              </h1>
              <div className="product-content__price">
                {product?.mrp && product.mrp !== sellingPrice && (
                  <span className="product-content__price-del">
                    ₹{Number(product.mrp).toFixed(2)}
                  </span>
                )}
                <span className="product-content__price-current">
                  {sellingPrice !== null
                    ? `₹${sellingPrice.toFixed(2)}`
                    : "N/A"}
                </span>
              </div>
              <p className="product-content__text">
                {product.description || "No description available"}
              </p>
              <div className="product-content__quantity product-content-quantity">
                <div className="product-content-quantity__box product-content-quantity-box">
                  <span className="product-content-quantity-box__text">
                    Quantity:
                  </span>
                  <div className="product-content-quantity-box__row">
                    <button
                      className="product-content-quantity-box__row-btn"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                      </svg>
                    </button>
                    <input
                      type="number"
                      className="product-content-quantity-box__row-input"
                      value={quantity}
                      onChange={(e) =>
                        handleQuantityChange(Number(e.target.value))
                      }
                      min={1}
                      max={product.quantity || 1}
                    />
                    <button
                      className="product-content-quantity-box__row-btn"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= (product.quantity || 1)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 5v14m-7-7h14" />
                      </svg>
                    </button>
                  </div>
                </div>
                <Button
                  className="product-content-quantity__btn"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => handleAddToCart(product)}
                  disabled={product.quantity <= 0 || isAddingToCart}
                  loading={isAddingToCart}
                >
                  Add to Cart
                </Button>
              </div>
              <div className="barcode-section">
                <svg
                  ref={barcodeRef}
                  aria-label={`Barcode for ${product.name}`}
                />
                <button
                  className="btn btn-print"
                  onClick={handlePrint}
                  disabled={!barcodeData}
                >
                  Print Barcode
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Info Tabs */}
        <div className="main__product-info product-info">
          <div className="container">
            <Tabs
              defaultActiveKey="1"
              className="tabs"
              items={[
                {
                  key: "1",
                  label: <span className="tabs__btn">Description</span>,
                  children: (
                    <div className="product-info__inner">
                      <h4 className="blog-section-box-content__title">
                        Description
                      </h4>
                      <p className="blog-section-box-content__text">
                        {product.description || "No description available"}
                      </p>
                    </div>
                  ),
                },
                {
                  key: "2",
                  label: (
                    <span className="tabs__btn">Additional Information</span>
                  ),
                  children: (
                    <div className="product-info__inner">
                      <h4 className="blog-section-box-content__title">
                        Additional Information
                      </h4>
                      <p className="blog-section-box-content__text">
                        <ul className="blog-section-box-content__list">
                          <li className="blog-section-box-content__list-item">
                            Product Code: {product.product_code || "N/A"}
                          </li>
                          <li className="blog-section-box-content__list-item">
                            Product Group: {product.productGroup || "N/A"}
                          </li>
                          <li className="blog-section-box-content__list-item">
                            Product Segment: {product.product_segment || "N/A"}
                          </li>

                          <li className="product-content__list-item">
                            <span>SKU:</span> {product.product_code || "N/A"}
                          </li>
                          <li className="product-content__list-item">
                            <span>Category:</span>{" "}
                            {parentCategoryData?.data?.name ||
                              categoryData?.category?.name ||
                              "N/A"}
                          </li>
                          <li className="product-content__list-item">
                            <span>Brand:</span> {brandData?.brandName || "N/A"}
                          </li>
                        </ul>
                      </p>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>

        {/* Related Products Section */}
        <div className="main__shop-section shop-section">
          <div className="container">
            <div className="shop-section__top shop-section-top">
              <h3 className="shop-section-top__title">Related Products</h3>
              <div className="shop-section__buttons swiper-buttons">
                <div className="shop-section__buttons-prev">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </div>
                <div className="shop-section__buttons-next">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            </div>
            {isRecommendedLoading ? (
              <div className="loading-container">
                <Spin size="large" />
              </div>
            ) : recommendedProducts?.length > 1 ? (
              <Swiper
                modules={[Navigation]}
                navigation={{
                  prevEl: ".shop-section__buttons-prev",
                  nextEl: ".shop-section__buttons-next",
                }}
                spaceBetween={20}
                slidesPerView={3}
                breakpoints={{
                  0: { slidesPerView: 1 },
                  640: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
                className="shop-section__swiper shop-section-swiper swiper"
              >
                {recommendedProducts
                  .filter(
                    (recProduct) => recProduct.productId !== product.productId
                  )
                  .slice(0, 4)
                  .map((recProduct) => (
                    <SwiperSlide
                      key={recProduct.productId}
                      className="shop-section-swiper__slide shop-section-slide swiper-slide"
                    >
                      <ProductCard
                        product={recProduct}
                        getBrandsName={getBrandsName}
                        getCategoryName={getCategoryName}
                        formatPrice={formatPrice}
                        handleAddToCart={handleAddToCart}
                        handleToggleFeatured={handleToggleFeatured}
                        cartLoadingStates={{}}
                        featuredLoadingStates={{}}
                        menu={menu}
                      />
                    </SwiperSlide>
                  ))}
              </Swiper>
            ) : (
              <p className="blog-section-box-content__text">
                No related products available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
