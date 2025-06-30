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
  Typography,
  Divider,
  Space,
} from "antd";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { ShareAltOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
} from "react-share";
import styled from "styled-components";
import "swiper/css";
import "swiper/css/navigation";
import "antd/dist/reset.css";
import "react-lazy-load-image-component/src/effects/blur.css";
import noimage from "../../assets/img/default.png";

const { Title, Text, Paragraph } = Typography;

// Styled Components
const PageWrapper = styled.div`
  padding: 20px;
  background-color: #f5f5f5;
  min-height: 100vh;
`;

const ProductContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const BreadcrumbStyled = styled(Breadcrumb)`
  margin-bottom: 20px;
  font-size: 14px;
  .ant-breadcrumb-link a {
    color: #e31e24;
    &:hover {
      color: #e31e24;
    }
  }
`;

const ProductImageWrapper = styled.div`
  .swiper {
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;
  }
  .swiper-slide img {
    width: 100%;
    height: 400px;
    object-fit: contain;
    background: #fff;
  }
  .swiper-button-prev,
  .swiper-button-next {
    background: #e31e24;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: #fff;
    &:after {
      font-size: 16px;
    }
    &:hover {
      background: #e31e24;
    }
  }
`;

const ThumbnailWrapper = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
`;

const ThumbnailImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
  border: ${(props) =>
    props.active ? "2px solid #e31e24" : "2px solid transparent"};
  transition: border 0.3s ease;
`;

const ProductContent = styled.div`
  padding: 20px;
`;

const PriceWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
`;

const QuantityWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const BarcodeWrapper = styled.div`
  margin: 20px 0;
  svg {
    max-width: 200px;
    height: auto;
  }
`;

const SocialShareWrapper = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 12px;
`;

const RelatedProductsWrapper = styled.div`
  margin-top: 40px;
  .swiper {
    padding: 10px 0;
  }
  .swiper-slide {
    display: flex;
    justify-content: center;
  }
`;

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
  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
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
    if (value >= 1 && value <= (product?.quantity || 1)) {
      setQuantity(value);
    }
  };

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
      <Spin size="large" style={{ display: "block", margin: "50px auto" }} />
    );
  }

  if (productError) {
    return (
      <ProductContainer>
        <Text type="danger">
          Error: {productError.message || "Failed to load product"}
        </Text>
        <Button
          type="primary"
          onClick={refetchProduct}
          style={{ marginTop: 16 }}
        >
          Retry
        </Button>
      </ProductContainer>
    );
  }

  if (!product) {
    return (
      <ProductContainer>
        <Text>Product not found.</Text>
      </ProductContainer>
    );
  }

  const images = getParsedImages(product.images);
  const shareUrl = `${window.location.origin}/product/${product.productId}`;
  const shareTitle = `Check out ${product.name} on our store!`;

  return (
    <div className="page-wrapper">
      <div className="content">
        <ProductContainer>
          {/* Breadcrumbs */}
          <BreadcrumbStyled
            items={[
              { title: <a href="/">Home</a> },
              { title: <a href="/inventory/products">Shop</a> },
              { title: product.name || "N/A" },
            ]}
          />

          {/* Product Section */}
          <Row gutter={[24, 24]}>
            {/* Product Gallery */}
            <Col xs={24} md={12}>
              <ProductImageWrapper>
                <Swiper
                  modules={[Navigation, Autoplay]}
                  navigation
                  autoplay={{ delay: 5000, disableOnInteraction: true }}
                  spaceBetween={10}
                  slidesPerView={1}
                  onSwiper={(swiper) => (swiperRef.current = swiper)}
                  onSlideChange={(swiper) => setActiveSlide(swiper.activeIndex)}
                >
                  {images.map((img, idx) => (
                    <SwiperSlide key={idx}>
                      <LazyLoadImage
                        src={img}
                        alt={`Product Image ${idx + 1} for ${product.name}`}
                        effect="blur"
                        placeholderSrc={noimage}
                        style={{ width: "100%", height: "400px" }}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <ThumbnailWrapper>
                  {images.map((img, idx) => (
                    <ThumbnailImage
                      key={idx}
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      active={activeSlide === idx}
                      onClick={() => handleThumbnailClick(idx)}
                      onError={(e) => (e.target.src = noimage)}
                    />
                  ))}
                </ThumbnailWrapper>
              </ProductImageWrapper>
            </Col>

            {/* Product Content */}
            <Col xs={24} md={12}>
              <ProductContent>
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ width: "100%" }}
                >
                  <Space align="center">
                    <Rate disabled defaultValue={5} style={{ fontSize: 14 }} />
                    <Text type="secondary">(2 reviews)</Text>
                  </Space>
                  <Title level={2}>{product.name || "N/A"}</Title>
                  <PriceWrapper>
                    {product.mrp && product.mrp !== product.sellingPrice && (
                      <Text delete style={{ fontSize: 18, color: "#999" }}>
                        ₹{Number(product.mrp).toFixed(2)}
                      </Text>
                    )}
                    <Text strong style={{ fontSize: 24, color: "#e31e24" }}>
                      ₹{Number(product.sellingPrice).toFixed(2) || "N/A"}
                    </Text>
                  </PriceWrapper>
                  <Paragraph>
                    {product.description || "No description available"}
                  </Paragraph>
                  <QuantityWrapper>
                    <Text strong>Quantity:</Text>
                    <InputNumber
                      min={1}
                      max={product.quantity || 1}
                      value={quantity}
                      onChange={handleQuantityChange}
                      style={{ width: 80 }}
                    />
                    <Button
                      type="primary"
                      icon={<ShoppingCartOutlined />}
                      onClick={handleAddToCart}
                      disabled={product.quantity <= 0 || isAddingToCart}
                      loading={isAddingToCart}
                    >
                      Add to Cart
                    </Button>
                  </QuantityWrapper>
                  <BarcodeWrapper>
                    <svg
                      ref={barcodeRef}
                      aria-label={`Barcode for ${product.name}`}
                    />
                    <Button onClick={handlePrint} disabled={!barcodeData}>
                      Print Barcode
                    </Button>
                  </BarcodeWrapper>
                  <Space direction="vertical">
                    <Text>
                      <strong>SKU:</strong> {product.product_code || "N/A"}
                    </Text>
                    <Text>
                      <strong>Category:</strong>{" "}
                      {parentCategoryData?.data?.name ||
                        categoryData?.category?.name ||
                        "N/A"}
                    </Text>
                    <Text>
                      <strong>Brand:</strong> {brandData?.brandName || "N/A"}
                    </Text>
                  </Space>
                </Space>
              </ProductContent>
            </Col>
          </Row>

          {/* Product Info Tabs */}
          <Divider />
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: "1",
                label: "Description",
                children: (
                  <Space direction="vertical" size="middle">
                    <Title level={4}>Description</Title>
                    <Paragraph>
                      {product.description || "No description available"}
                    </Paragraph>
                    <ul>
                      <li>Product Code: {product.product_code || "N/A"}</li>
                      <li>Product Group: {product.productGroup || "N/A"}</li>
                      <li>
                        Product Segment: {product.product_segment || "N/A"}
                      </li>
                    </ul>
                  </Space>
                ),
              },
              {
                key: "2",
                label: "Additional Information",
                children: (
                  <Space direction="vertical" size="middle">
                    <Title level={4}>Additional Information</Title>
                    <Paragraph>
                      {product.additionalInfo ||
                        "No additional information available."}
                    </Paragraph>
                  </Space>
                ),
              },
            ]}
          />

          {/* Related Products Section */}
          <RelatedProductsWrapper>
            <Title level={3}>Related Products</Title>
            {isRecommendedLoading ? (
              <Spin size="large" />
            ) : recommendedProducts?.length > 1 ? (
              <Swiper
                modules={[Navigation]}
                navigation
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
                    <SwiperSlide key={recProduct.productId}>
                      <Card
                        hoverable
                        cover={
                          <div style={{ position: "relative" }}>
                            <LazyLoadImage
                              src={getParsedImages(recProduct.images)[0]}
                              alt={recProduct.name}
                              effect="blur"
                              placeholderSrc={noimage}
                              style={{
                                width: "100%",
                                height: "200px",
                                objectFit: "contain",
                              }}
                            />
                            {recProduct.mrp &&
                              recProduct.mrp !== recProduct.sellingPrice && (
                                <Text
                                  style={{
                                    position: "absolute",
                                    top: 10,
                                    left: 10,
                                    background: "#e31e24",
                                    color: "#fff",
                                    padding: "4px 8px",
                                    borderRadius: 4,
                                  }}
                                >
                                  Sale
                                </Text>
                              )}
                          </div>
                        }
                        actions={[
                          <Button
                            type="primary"
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
                            <Space direction="vertical">
                              <Text>
                                {categoryData?.category?.name || "N/A"}
                              </Text>
                              <Space>
                                {recProduct.mrp &&
                                  recProduct.mrp !==
                                    recProduct.sellingPrice && (
                                    <Text delete>
                                      ₹{Number(recProduct.mrp).toFixed(2)}
                                    </Text>
                                  )}
                                <Text strong>
                                  ₹{Number(recProduct.sellingPrice).toFixed(2)}
                                </Text>
                              </Space>
                            </Space>
                          }
                        />
                      </Card>
                    </SwiperSlide>
                  ))}
              </Swiper>
            ) : (
              <Paragraph>No related products available.</Paragraph>
            )}
          </RelatedProductsWrapper>
        </ProductContainer>
      </div>
    </div>
  );
};

export default ProductDetails;
