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
import "antd/dist/reset.css"; // Use Ant Design's reset CSS for v5
import noimage from "../../assets/img/default.png";
import "./productdetails.css"; // Keep for Swiper and barcode styling, adjust as needed

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
      <div className="content">
        <div style={{ padding: "20px" }}>
          {/* Breadcrumbs */}
          <Breadcrumb
            items={[
              { title: <a href="/">Home</a> },
              { title: <a href="/shop">Shop</a> },
              { title: product.name || "N/A" },
            ]}
            style={{ marginBottom: "20px" }}
          />

          {/* Product Section */}
          <Row gutter={[16, 16]}>
            {/* Product Gallery */}
            <Col xs={24} md={12}>
              <Swiper
                modules={[Navigation]}
                navigation={{
                  prevEl: ".product-swiper__prev",
                  nextEl: ".product-swiper__next",
                }}
                className="product-swiper"
                spaceBetween={10}
                slidesPerView={1}
              >
                {images.length > 0 ? (
                  images.map((img, idx) => (
                    <SwiperSlide key={idx}>
                      <img
                        src={img}
                        alt={`Product Image ${idx + 1}`}
                        style={{
                          width: "100%",
                          height: "auto",
                          objectFit: "contain",
                        }}
                        onError={(e) => (e.target.src = noimage)}
                      />
                    </SwiperSlide>
                  ))
                ) : (
                  <SwiperSlide>
                    <img
                      src={noimage}
                      alt="No Image"
                      style={{
                        width: "100%",
                        height: "auto",
                        objectFit: "contain",
                      }}
                    />
                  </SwiperSlide>
                )}
                <div className="product-swiper__prev" style={{ zIndex: 10 }}>
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
                <div className="product-swiper__next" style={{ zIndex: 10 }}>
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
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                {images.length > 0 ? (
                  images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        cursor: "pointer",
                        border:
                          idx === 0 ? "2px solid #1890ff" : "1px solid #d9d9d9",
                      }}
                      onError={(e) => (e.target.src = noimage)}
                    />
                  ))
                ) : (
                  <img
                    src={noimage}
                    alt="No Image"
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "cover",
                      border: "1px solid #d9d9d9",
                    }}
                  />
                )}
              </div>
            </Col>

            {/* Product Content */}
            <Col xs={24} md={12}>
              <Rate value={5} disabled style={{ marginBottom: "8px" }} />
              <p style={{ marginBottom: "8px" }}>2 reviews</p>
              <h2 style={{ fontSize: "24px", marginBottom: "16px" }}>
                {product.name || "N/A"}
              </h2>
              <div style={{ marginBottom: "16px" }}>
                {product.mrp && product.mrp !== product.sellingPrice && (
                  <span
                    style={{
                      textDecoration: "line-through",
                      marginRight: "8px",
                    }}
                  >
                    ₹{Number(product.mrp).toFixed(2)}
                  </span>
                )}
                <span style={{ fontSize: "18px", color: "#1890ff" }}>
                  ₹{Number(product.sellingPrice).toFixed(2) || "N/A"}
                </span>
              </div>
              <p style={{ marginBottom: "16px" }}>
                {product.description || "No description available"}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <span>Quantity:</span>
                <InputNumber
                  min={1}
                  max={product.quantity || 1}
                  value={quantity}
                  onChange={setQuantity}
                />
                <Button
                  type="primary"
                  onClick={handleAddToCart}
                  disabled={product.quantity <= 0}
                >
                  Add to Cart
                </Button>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <svg
                  ref={barcodeRef}
                  style={{ marginRight: "16px" }}
                  aria-hidden="true"
                />
                <Button onClick={handlePrint} disabled={!barcodeData}>
                  Print Barcode
                </Button>
              </div>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li>SKU: {product.product_code || "N/A"}</li>
                <li>
                  Category:{" "}
                  {parentCategoryData?.data?.name ||
                    categoryData?.category?.name ||
                    "N/A"}
                </li>
                <li>Tags: {brandData?.brandName || "N/A"}</li>
              </ul>
            </Col>
          </Row>

          {/* Product Info Tabs */}
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: "1",
                label: "Description",
                children: (
                  <div>
                    <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>
                      Description
                    </h2>
                    <p>{product.description || "No description available"}</p>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      <li>Product Code: {product.product_code || "N/A"}</li>
                      <li>Product Group: {product.productGroup || "N/A"}</li>
                      <li>
                        Product Segment: {product.product_segment || "N/A"}
                      </li>
                    </ul>
                  </div>
                ),
              },
              {
                key: "2",
                label: "Additional Information",
                children: <p>Additional information content goes here.</p>,
              },
              {
                key: "3",
                label: "Reviews (2)",
                children: <p>Reviews content goes here.</p>,
              },
            ]}
            style={{ marginTop: "24px" }}
          />

          {/* Related Products Section */}
          <div style={{ marginTop: "40px" }}>
            <h2 style={{ fontSize: "24px", marginBottom: "16px" }}>
              Related Products
            </h2>
            {isRecommendedLoading ? (
              <Spin size="large" />
            ) : recommendedProducts?.length > 0 ? (
              <Swiper
                modules={[Navigation]}
                navigation={{
                  prevEl: ".shop-section__buttons-prev",
                  nextEl: ".shop-section__buttons-next",
                }}
                spaceBetween={20}
                slidesPerView={3}
                breakpoints={{
                  640: { slidesPerView: 1 },
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
              >
                {recommendedProducts
                  .filter(
                    (recProduct) => recProduct.productId !== product.productId
                  )
                  .slice(0, 4)
                  .map((recProduct) => (
                    <SwiperSlide key={recProduct.productId}>
                      <Card
                        cover={
                          <img
                            src={
                              getParsedImages(recProduct.images)[0] || noimage
                            }
                            alt={recProduct.name}
                            onError={(e) => (e.target.src = noimage)}
                            style={{ height: "200px", objectFit: "cover" }}
                          />
                        }
                        actions={[
                          <Button
                            type="link"
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
                            <a href={`/product/${recProduct.productId}`}>
                              {recProduct.name}
                            </a>
                          }
                          description={
                            <>
                              <p>{categoryData?.category?.name || "N/A"}</p>
                              <div>
                                {recProduct.mrp &&
                                  recProduct.mrp !==
                                    recProduct.sellingPrice && (
                                    <span
                                      style={{
                                        textDecoration: "line-through",
                                        marginRight: "8px",
                                      }}
                                    >
                                      ₹{Number(recProduct.mrp).toFixed(2)}
                                    </span>
                                  )}
                                <span>
                                  ₹{Number(recProduct.sellingPrice).toFixed(2)}
                                </span>
                              </div>
                            </>
                          }
                        />
                      </Card>
                    </SwiperSlide>
                  ))}
                <div
                  className="shop-section__buttons-prev"
                  style={{ zIndex: 10 }}
                >
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
                <div
                  className="shop-section__buttons-next"
                  style={{ zIndex: 10 }}
                >
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
              </Swiper>
            ) : (
              <p>No related products available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
