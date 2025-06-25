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
import {
  Breadcrumb,
  Button,
  InputNumber,
  Rate,
  Spin,
  Tabs,
  Row,
  Col,
  Card,
} from "antd";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "antd/dist/reset.css";
import noimage from "../../assets/img/default.png";
import "./newproduct.css";

const NewProductDetails = () => {
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
  const [quantity, setQuantity] = useState(1);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const barcodeRef = useRef(null);
  const swiperRef = useRef(null);

  // Parse images with simplified logic
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

  // Add to cart handler with loading state
  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`${product.name} (Quantity: ${quantity}) added to cart!`);
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
    if (value >= 1 && value <= (product.quantity || 1)) {
      setQuantity(value);
    }
  };

  // Set barcode and handle errors
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
      <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
    );
  }

  if (productError) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <p>Error: {productError.message || "Failed to load product"}</p>
        <Button type="primary" onClick={refetchProduct}>
          Retry
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: "50px", textAlign: "center" }}>
        <p>Product not found.</p>
      </div>
    );
  }

  const images = getParsedImages(product.images);

  return (
    <div className="page-wrapper">
      <div className="content container">
        {/* Breadcrumbs */}
        <div className="main__breadcrumbs breadcrumbs">
          <Breadcrumb
            items={[
              {
                title: <Link to="/">Home</Link>,
                className: "breadcrumbs__list-link",
              },
              {
                title: <Link to="/shop">Shop</Link>,
                className: "breadcrumbs__list-link",
              },
              {
                title: product.name || "N/A",
                className: "breadcrumbs__list-text",
              },
            ]}
            className="breadcrumbs__list"
          />
        </div>

        {/* Product Section */}
        <section className="main__product product">
          <div className="product__inner">
            <Row gutter={[40, 40]} className="product__wrap">
              {/* Product Gallery */}
              <Col xs={24} md={12} className="product__wrapper">
                <div className="product-image-card">
                  <Swiper
                    modules={[Navigation]}
                    navigation={{
                      prevEl: ".product-swiper__prev",
                      nextEl: ".product-swiper__next",
                    }}
                    className="product__swiper product-swiper swiper"
                    spaceBetween={10}
                    slidesPerView={1}
                    onSwiper={(swiper) => (swiperRef.current = swiper)}
                    onSlideChange={(swiper) =>
                      setActiveSlide(swiper.activeIndex)
                    }
                  >
                    {images.map((img, idx) => (
                      <SwiperSlide
                        key={idx}
                        className="product-swiper__slide product-slide swiper-slide"
                      >
                        <img
                          src={img}
                          alt={`Product Image ${idx + 1} for ${product.name}`}
                          className="product-slide__img"
                          onError={(e) => (e.target.src = noimage)}
                        />
                        <div className="hand-overlay"></div>
                      </SwiperSlide>
                    ))}
                    <div
                      className="product-swiper__prev"
                      role="button"
                      aria-label="Previous slide"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M9 6H2.5M5.5 9L2.85355 6.35355C2.65829 6.15829 2.65829 5.84171 2.85355 5.64645L5.5 3"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div
                      className="product-swiper__next"
                      role="button"
                      aria-label="Next slide"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2.5 6H9M6.5 3L9.14645 5.64645C9.34171 5.84171 9.34171 6.15829 9.14645 6.35355L6.5 9"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </Swiper>
                  <div className="product__images product-images">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`product-images__img ${
                          activeSlide === idx
                            ? "product-images__img--active"
                            : ""
                        }`}
                        onClick={() => handleThumbnailClick(idx)}
                        role="button"
                        aria-label={`View image ${idx + 1}`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 1} for ${product.name}`}
                          className="product-images__img-image"
                          onError={(e) => (e.target.src = noimage)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Col>

              {/* Product Content */}
              <Col xs={24} md={12} className="product__content product-content">
                <div className="product-content__box product-content-box">
                  <Rate
                    value={5}
                    disabled
                    className="product-content-box__stars stars"
                    style={{ fontSize: 14 }}
                  />
                  <span className="product-content-box__text">2 reviews</span>
                </div>
                <h1 className="product-content__title">
                  {product.name || "N/A"}
                </h1>
                <div className="product-content__price">
                  {product.mrp && product.mrp !== product.sellingPrice && (
                    <span className="product-content__price-del">
                      ₹{Number(product.mrp).toFixed(2)}
                    </span>
                  )}
                  <span className="product-content__price-current">
                    ₹{Number(product.sellingPrice).toFixed(2) || "N/A"}
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
                        aria-label="Decrease quantity"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 9H14"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                      <InputNumber
                        min={1}
                        max={product.quantity || 1}
                        value={quantity}
                        onChange={handleQuantityChange}
                        className="product-content-quantity-box__row-input"
                        aria-label="Quantity"
                      />
                      <button
                        className="product-content-quantity-box__row-btn"
                        onClick={() => handleQuantityChange(quantity + 1)}
                        disabled={quantity >= (product.quantity || 1)}
                        aria-label="Increase quantity"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M4 9H14M9 4V14"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <Button
                    className="add-to-cart-button"
                    onClick={handleAddToCart}
                    disabled={product.quantity <= 0 || isAddingToCart}
                    loading={isAddingToCart}
                  >
                    Add to Cart +
                  </Button>
                </div>
                <div className="barcode-section">
                  <svg
                    ref={barcodeRef}
                    aria-label={`Barcode for ${product.name}`}
                    role="img"
                  />
                  <Button
                    className="btn btn-print"
                    onClick={handlePrint}
                    disabled={!barcodeData}
                  >
                    Print Barcode
                  </Button>
                </div>
                <ul className="product-content__list">
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
                    <span>Tags:</span> {brandData?.brandName || "N/A"}
                  </li>
                </ul>
              </Col>
            </Row>
          </div>
        </section>

        {/* Product Info Tabs */}
        <section className="main__product-info product-info">
          <Tabs
            defaultActiveKey="1"
            className="product-info__tabs tabs"
            items={[
              {
                key: "1",
                label: "Description",
                className: "tabs__btn",
                children: (
                  <div className="product-info__inner">
                    <h2 className="blog-section-box-content__title">
                      Description
                    </h2>
                    <p className="blog-section-box-content__text">
                      {product.description || "No description available"}
                    </p>
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
                    </ul>
                  </div>
                ),
              },
              {
                key: "2",
                label: "Additional Information",
                className: "tabs__btn",
                children: (
                  <div className="product-info__inner">
                    <h2 className="blog-section-box-content__title">
                      Additional Information
                    </h2>
                    <p className="blog-section-box-content__text">
                      {product.additionalInfo ||
                        "No additional information available."}
                    </p>
                  </div>
                ),
              },
              {
                key: "3",
                label: (
                  <span>
                    Reviews <span>(2)</span>
                  </span>
                ),
                className: "tabs__btn",
                children: (
                  <div className="product-info__inner">
                    <h2 className="blog-section-box-content__title">Reviews</h2>
                    <p className="blog-section-box-content__text">
                      No reviews yet. Be the first to review this product!
                    </p>
                  </div>
                ),
              },
            ]}
          />
        </section>

        {/* Related Products Section */}
        <section className="main__shop-section shop-section">
          <div className="shop-section__top shop-section-top">
            <h2 className="shop-section-top__title">Related Products</h2>
            <div className="shop-section__buttons swiper-buttons">
              <div
                className="shop-section__buttons-prev"
                role="button"
                aria-label="Previous related product"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M9 6H2.5M5.5 9L2.85355 6.35355C2.65829 6.15829 2.65829 5.84171 2.85355 5.64645L5.5 3"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div
                className="shop-section__buttons-next"
                role="button"
                aria-label="Next related product"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.5 6H9M6.5 3L9.14645 5.64645C9.34171 5.84171 9.34171 6.15829 9.14645 6.35355L6.5 9"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
          {isRecommendedLoading ? (
            <Spin size="large" />
          ) : recommendedProducts?.length > 1 ? (
            <Swiper
              modules={[Navigation]}
              navigation={{
                prevEl: ".shop-section__buttons-prev",
                nextEl: ".shop-section__buttons-next",
              }}
              className="shop-section__swiper shop-section-swiper swiper"
              spaceBetween={20}
              slidesPerView={3}
              breakpoints={{
                0: { slidesPerView: 1 },
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
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
                    <Card
                      className="shop__card card"
                      cover={
                        <div className="card-box__poster">
                          <img
                            src={getParsedImages(recProduct.images)[0]}
                            alt={recProduct.name}
                            className="card-box__poster-img"
                            onError={(e) => (e.target.src = noimage)}
                          />
                          {recProduct.mrp &&
                            recProduct.mrp !== recProduct.sellingPrice && (
                              <span className="card-box__poster-suptext">
                                Sale
                              </span>
                            )}
                        </div>
                      }
                      actions={[
                        <Button
                          className="card__link"
                          onClick={() =>
                            toast.success(`${recProduct.name} added to cart!`)
                          }
                        >
                          Add to Cart
                        </Button>,
                      ]}
                    >
                      <Card.Meta
                        title={
                          <Link
                            to={`/product/${recProduct.productId}`}
                            className="card__title"
                          >
                            {recProduct.name}
                          </Link>
                        }
                        description={
                          <div className="card__subtext">
                            <p>{categoryData?.category?.name || "N/A"}</p>
                            <div className="card__price card-price">
                              {recProduct.mrp &&
                                recProduct.mrp !== recProduct.sellingPrice && (
                                  <span className="card-price__past">
                                    ₹{Number(recProduct.mrp).toFixed(2)}
                                  </span>
                                )}
                              <span className="card-price__current">
                                ₹{Number(recProduct.sellingPrice).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </SwiperSlide>
                ))}
            </Swiper>
          ) : (
            <p className="blog-section-box-content__text">
              No related products available.
            </p>
          )}
        </section>
      </div>
    </div>
  );
};

export default NewProductDetails;
