import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  useGetProductByIdQuery,
  useGetAllProductsByCategoryQuery,
} from "../../api/productApi";
import { useGetCategoryByIdQuery } from "../../api/categoryApi";
import { useGetParentCategoryByIdQuery } from "../../api/parentCategoryApi";
import { useGetBrandByIdQuery } from "../../api/brandsApi";
import JsBarcode from "jsbarcode";
import { toast } from "react-toastify";
import Loader from "../../components/Common/Loader";
import noimage from "../../assets/img/default.png";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
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
  const [quantity, setQuantity] = useState(1);
  const barcodeRef = useRef(null);

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

  // Quantity handlers
  const handleQuantityChange = (delta) => {
    const newQuantity = Math.max(
      1,
      Math.min(product.quantity || 1, quantity + delta)
    );
    setQuantity(newQuantity);
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
    <>
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumbs */}
          <div className="main__breadcrumbs breadcrumbs">
            <div className="container">
              <ul className="breadcrumbs__list">
                <li className="breadcrumbs__list-item">
                  <a className="breadcrumbs__list-link" href="/">
                    Home
                  </a>
                </li>
                <li className="breadcrumbs__list-item">
                  <a className="breadcrumbs__list-link" href="/shop">
                    Shop
                  </a>
                </li>
                <li className="breadcrumbs__list-item">
                  <p className="breadcrumbs__list-text">
                    {product.name || "N/A"}
                  </p>
                </li>
              </ul>
            </div>
          </div>

          {/* Product Section */}
          <section className="main__product product">
            <div className="container">
              <div className="product__inner">
                <div className="product__wrap">
                  {/* Product Gallery */}
                  <div className="product__wrapper">
                    <Swiper
                      modules={[Navigation]}
                      navigation={{
                        prevEl: ".product-swiper__prev",
                        nextEl: ".product-swiper__next",
                      }}
                      className="product__swiper product-swiper swiper"
                      spaceBetween={10}
                      slidesPerView={1}
                    >
                      <div className="swiper-wrapper">
                        {images.length > 0 ? (
                          images.map((img, idx) => (
                            <SwiperSlide
                              key={idx}
                              className="product-swiper__slide product-slide swiper-slide"
                              id={idx}
                            >
                              <img
                                className="product-slide__img"
                                src={img}
                                alt={`Product Image ${idx + 1}`}
                                onError={(e) => (e.target.src = noimage)}
                              />
                            </SwiperSlide>
                          ))
                        ) : (
                          <SwiperSlide
                            className="product-swiper__slide product-slide swiper-slide"
                            id="0"
                          >
                            <img
                              className="product-slide__img"
                              src={noimage}
                              alt="No Image"
                            />
                          </SwiperSlide>
                        )}
                      </div>
                    </Swiper>
                    <div className="product-swiper__prev">
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
                    <div className="product-swiper__next">
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
                    <div className="product__images product-images">
                      {images.length > 0 ? (
                        images.map((img, idx) => (
                          <a
                            key={idx}
                            className={`product-images__img ${
                              idx === 0 ? "product-images__img--active" : ""
                            }`}
                            data-fancybox="gallery"
                            href={img}
                            id={idx}
                          >
                            <p className="product-images__img-text">sale</p>
                            <button className="product-images__img-btn">
                              <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M21 21L15 15M21 21V16.2M21 21H16.2"
                                  stroke="#0E1218"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M3 16.2V21M3 21H7.8M3 21L9 15"
                                  stroke="#0E1218"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M21 7.8V3M21 3H16.2M21 3L15 9"
                                  stroke="#0E1218"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M3 7.8V3M3 3H7.8M3 3L9 9"
                                  stroke="#0E1218"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            <img
                              className="product-images__img-image"
                              src={img}
                              alt={`Thumbnail ${idx + 1}`}
                              onError={(e) => (e.target.src = noimage)}
                            />
                          </a>
                        ))
                      ) : (
                        <a
                          className="product-images__img product-images__img--active"
                          data-fancybox="gallery"
                          href={noimage}
                          id="0"
                        >
                          <p className="product-images__img-text">sale</p>
                          <img
                            className="product-images__img-image"
                            src={noimage}
                            alt="No Image"
                          />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Product Content */}
                  <div className="product__content product-content">
                    <div className="product-content__box product-content-box">
                      <div className="product-content-box__stars stars">
                        {[...Array(5)].map((_, idx) => (
                          <div key={idx} className="stars__star stars-star">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M11.9687 4.60317C11.8902 4.36018 11.6746 4.1876 11.4197 4.16462L7.95614 3.85013L6.58656 0.644511C6.48558 0.40958 6.25559 0.257507 6.00006 melhoria 0.257507C5.74453 0.257507 5.51454 0.40958 5.41356 0.64506L4.04399 3.85013L0.579908 4.16462C0.325385 4.18815 0.110414 4.36018 0.0314019 4.60317C-0.0476102 4.84616 0.0253592 5.11267 0.2179 5.28068L2.83592 7.5767L2.06392 10.9773C2.00744 11.2274 2.10448 11.4858 2.31195 11.6358C2.42346 11.7164 2.55393 11.7574 2.68549 11.7574C2.79893 11.7574 2.91145 11.7268 3.01244 11.6664L6.00006 9.88077L8.98659 11.6664C9.20513 11.7978 9.48062 11.7858 9.68762 11.6358C9.89518 11.4854 9.99214 11.2268 9.93565 10.9773L9.16366 7.5767L11.7817 5.28113C11.9742 5.11267 12.0477 4.84661 11.9687 4.60317Z"
                                fill="#F9D442"
                              />
                            </svg>
                          </div>
                        ))}
                      </div>
                      <p className="product-content-box__text">2 reviews</p>
                    </div>
                    <h2 className="product-content__title">
                      {product.name || "N/A"}
                    </h2>
                    <div className="product-content__price">
                      {product.mrp && product.mrp !== product.sellingPrice && (
                        <del className="product-content__price-del">
                          ₹{Number(product.mrp).toFixed(2)}
                        </del>
                      )}
                      <ins className="product-content__price-current">
                        ₹{Number(product.sellingPrice).toFixed(2) || "N/A"}
                      </ins>
                    </div>
                    <p className="product-content__text">
                      {product.description || "No description available"}
                    </p>
                    <form className="product-content__quantity product-content-quantity">
                      <div className="product-content-quantity__box product-content-quantity-box">
                        <p className="product-content-quantity-box__text">
                          Quantity:
                        </p>
                        <div className="product-content-quantity-box__row">
                          <button
                            className="product-content-quantity-box__row-btn product-content-quantity-box__row-btn--minus"
                            type="button"
                            onClick={() => handleQuantityChange(-1)}
                            aria-label="Decrease quantity"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M3.3335 8H12.6668"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                          <input
                            className="product-content-quantity-box__row-input"
                            type="text"
                            value={quantity}
                            readOnly
                            aria-label="Quantity"
                          />
                          <button
                            className="product-content-quantity-box__row-btn product-content-quantity-box__row-btn--plus"
                            type="button"
                            onClick={() => handleQuantityChange(1)}
                            aria-label="Increase quantity"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8 3.3335V12.6668"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M3.3335 8H12.6668"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <button
                        className="product-content-quantity__btn"
                        type="button"
                        onClick={handleAddToCart}
                        disabled={product.quantity <= 0}
                        aria-label="Add to cart"
                      >
                        Add to Cart
                      </button>
                    </form>
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
                    <ul className="product-content__list">
                      <li className="product-content__list-item">
                        SKU: <span>{product.product_code || "N/A"}</span>
                      </li>
                      <li className="product-content__list-item">
                        Category:{" "}
                        <span>
                          {parentCategoryData?.data?.name ||
                            categoryData?.category?.name ||
                            "N/A"}
                        </span>
                      </li>
                      <li className="product-content__list-item">
                        Tags: <span>{brandData?.brandName || "N/A"}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Product Info Tabs */}
          <section className="main__product-info product-info">
            <div className="container">
              <div className="product-info__tabs tabs">
                <button
                  className="tabs__btn tabs__btn--active"
                  type="button"
                  id="0"
                >
                  Description
                </button>
                <button className="tabs__btn" type="button" id="1">
                  Additional Information
                </button>
                <button className="tabs__btn" type="button" id="2">
                  Reviews <span>2</span>
                </button>
              </div>
              <div className="product-info__inner">
                <div className="product-info__wrapper">
                  <div className="product-info__product-info product-info-description blog-section">
                    <div className="blog-section__inner">
                      <div className="blog-section-box__content blog-section-box-content">
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Related Products Section */}
          <section className="main__shop-section shop-section">
            <div className="container">
              <div className="shop-section__top shop-section-top">
                <h2 className="shop-section-top__title">Related Products</h2>
                <div className="shop-section__buttons swiper-buttons">
                  <div className="shop-section__buttons-prev swiper-buttons-prev-btn">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.5 6H9M6.5 3L9.14645 5.64645C9.34171 5.84171 9.34171 6.15829 9.14645 6.35355L6.5 9"
                        stroke="#fff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="shop-section__buttons-next swiper-buttons-next-btn">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.5 6H9M6.5 3L9.14645 5.64645C9.34171 5.84171 9.34171 6.15829 9.14645 6.35355L6.5 9"
                        stroke="#fff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
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
                  640: { slidesPerView: 1 },
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
              >
                <div className="swiper-wrapper">
                  {isRecommendedLoading ? (
                    <Loader loading={true} />
                  ) : recommendedProducts?.length > 0 ? (
                    recommendedProducts
                      .filter(
                        (recProduct) =>
                          recProduct.productId !== product.productId
                      )
                      .slice(0, 4)
                      .map((recProduct) => (
                        <SwiperSlide
                          key={recProduct.productId}
                          className="shop-section-swiper__slide shop-section-slide swiper-slide"
                        >
                          <div className="shop__card card">
                            <div className="card__inner">
                              <a
                                className="card-box__poster"
                                href={`/product/${recProduct.productId}`}
                              >
                                <img
                                  className="card-box__poster-img"
                                  src={
                                    getParsedImages(recProduct.images)[0] ||
                                    noimage
                                  }
                                  alt={recProduct.name}
                                  onError={(e) => (e.target.src = noimage)}
                                />
                                <p className="card-box__poster-suptext">sale</p>
                              </a>
                              <p className="card__subtext">
                                {categoryData?.category?.name || "N/A"}
                              </p>
                              <a
                                className="card__title"
                                href={`/product/${recProduct.productId}`}
                              >
                                {recProduct.name}
                              </a>
                              <div className="card__price card-price">
                                {recProduct.mrp &&
                                  recProduct.mrp !==
                                    recProduct.sellingPrice && (
                                    <del className="card-price__past">
                                      ₹{Number(recProduct.mrp).toFixed(2)}
                                    </del>
                                  )}
                                <ins className="card-price__current">
                                  ₹{Number(recProduct.sellingPrice).toFixed(2)}
                                </ins>
                              </div>
                              <a
                                className="card__link"
                                href="#"
                                onClick={() =>
                                  toast.success(
                                    `${recProduct.name} added to cart!`
                                  )
                                }
                              >
                                Add to Cart
                              </a>
                            </div>
                          </div>
                        </SwiperSlide>
                      ))
                  ) : (
                    <p>No related products available.</p>
                  )}
                </div>
              </Swiper>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default ProductDetails;
