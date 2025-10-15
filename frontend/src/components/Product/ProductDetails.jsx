import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useGetProductByIdQuery,
  useGetAllProductsByCategoryQuery,
} from "../../api/productApi";
import { useGetCategoryByIdQuery } from "../../api/categoryApi";
import { useGetParentCategoryByIdQuery } from "../../api/parentCategoryApi";
import { useGetBrandByIdQuery } from "../../api/brandsApi";
import { useAddProductToCartMutation } from "../../api/cartApi";
import { useGetProfileQuery } from "../../api/userApi";
import JsBarcode from "jsbarcode";
import { toast } from "sonner";
import { Breadcrumb, Button, InputNumber, Spin, Tabs, Menu } from "antd";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { ShoppingCartOutlined } from "@ant-design/icons";
import ProductCard from "./ProductCard";
import "./productdetails.css";
import "react-lazy-load-image-component/src/effects/blur.css";
import noimage from "../../assets/img/default.png";

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
  } = useGetBrandByIdQuery(product?.brandId, {
    skip: !product?.brandId,
  });
  const {
    data: recommendedProducts,
    isLoading: isRecommendedLoading,
    error: recommendedError,
  } = useGetAllProductsByCategoryQuery(product?.categoryId, {
    skip: !product?.categoryId,
  });
  const { data: user, isLoading: userLoading } = useGetProfileQuery();
  const userId = user?.user?.userId;
  const [addProductToCart, { isLoading: isCartLoading }] =
    useAddProductToCartMutation();
  const [cartLoadingStates, setCartLoadingStates] = useState({});
  const [barcodeData, setBarcodeData] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0); // Replaced activeSlide with activeImage

  const barcodeRef = useRef(null);

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
    if (!userId) {
      toast.error("User not logged in!");
      return;
    }
    const sellingPriceEntry = Array.isArray(product.metaDetails)
      ? product.metaDetails.find((detail) => detail.slug === "sellingPrice")
      : null;
    const sellingPrice = sellingPriceEntry
      ? parseFloat(sellingPriceEntry.value)
      : null;
    if (!sellingPrice || isNaN(sellingPrice)) {
      toast.error("Invalid product price");
      return;
    }
    if (quantity <= 0 || quantity > product.quantity) {
      toast.error("Invalid quantity");
      return;
    }
    const productId = product.productId;
    setCartLoadingStates((prev) => ({ ...prev, [productId]: true }));
    try {
      await addProductToCart({
        userId,
        productId,
        quantity,
      }).unwrap();
      setQuantity(1);
    } catch (error) {
      toast.error(`Error: ${error.data?.message || "Unknown error"}`);
    } finally {
      setCartLoadingStates((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Handle thumbnail click
  const handleThumbnailClick = (index) => {
    setActiveImage(index);
  };

  // Handle quantity change
  const handleQuantityChange = (value) => {
    if (value >= 1 && value <= (product?.quantity || 1)) {
      setQuantity(value);
    }
  };

  // Get selling price from metaDetails
  const getSellingPrice = (metaDetails) => {
    const spObj = metaDetails?.find((m) => m.slug === "sellingPrice");
    return spObj ? Number(spObj.value) : null;
  };

  // Get company code from metaDetails
  const getCompanyCode = (metaDetails) => {
    if (!Array.isArray(metaDetails)) {
      return "N/A";
    }
    const companyCodeEntry = metaDetails.find(
      (detail) => detail.slug?.toLowerCase() === "companycode"
    );
    return companyCodeEntry ? String(companyCodeEntry.value) : "N/A";
  };

  // Dummy functions for ProductCard
  const getBrandsName = (brandId) => brandData?.brandName || "Not Branded";
  const getCategoryName = (categoryId) =>
    categoryData?.category?.name || "Uncategorized";
  const formatPrice = (price, unit) => {
    if (typeof price === "object" && Array.isArray(unit)) {
      const metaDetails = unit;
      const sellingPriceEntry = metaDetails?.find(
        (detail) => detail.slug === "sellingPrice"
      );
      const priceValue = sellingPriceEntry
        ? parseFloat(sellingPriceEntry.value)
        : null;
      return priceValue !== null && !isNaN(priceValue)
        ? `₹ ${priceValue.toFixed(2)}`
        : "N/A";
    }
    return price !== null && !isNaN(price) ? `₹ ${price.toFixed(2)}` : "N/A";
  };
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
    isBrandLoading ||
    userLoading
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

  const images = getParsedImages(product.images);
  const sellingPrice = getSellingPrice(product.metaDetails);

  // Filter related products by brandId and brand_parentcategoriesId
  const relatedProducts = recommendedProducts
    ?.filter(
      (recProduct) =>
        recProduct.productId !== product.productId &&
        recProduct.brandId === product.brandId &&
        recProduct.brand_parentcategoriesId === product.brand_parentcategoriesId
    )
    ?.slice(0, 4);

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
              <div className="product__main-image">
                <LazyLoadImage
                  src={images[activeImage] || noimage}
                  alt={`Product Image for ${product.name}`}
                  effect="blur"
                  placeholderSrc={noimage}
                  className="product-slide__img"
                  onError={(e) => (e.target.src = noimage)}
                />
              </div>
              <div className="product__images product-images">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`product-images__img ${
                      activeImage === idx ? "product-images__img--active" : ""
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
                    <InputNumber
                      className="product-content-quantity-box__row-input"
                      value={quantity}
                      onChange={handleQuantityChange}
                      min={1}
                      max={product.quantity || 1}
                      controls={true}
                    />
                  </div>
                </div>
                <Button
                  className="product-content-quantity__btn"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => handleAddToCart(product)}
                  disabled={
                    product.quantity <= 0 ||
                    isCartLoading ||
                    !userId ||
                    !sellingPrice ||
                    isNaN(sellingPrice)
                  }
                  loading={isCartLoading}
                >
                  Add to Cart
                </Button>
              </div>
              <div className="barcode-section">
                <svg
                  ref={barcodeRef}
                  aria-label={`Barcode for ${product.name}`}
                />
                <Button
                  className="btn btn-print"
                  onClick={handlePrint}
                  disabled={!barcodeData}
                >
                  Print Barcode
                </Button>
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
                      <ul className="blog-section-box-content__list">
                        <li className="blog-section-box-content__list-item">
                          <span>Product Code:</span>{" "}
                          {product.product_code || "N/A"}
                        </li>
                        <li className="blog-section-box-content__list-item">
                          <span>SKU:</span> {product.product_code || "N/A"}
                        </li>
                        <li className="blog-section-box-content__list-item">
                          <span>Category:</span>{" "}
                          {parentCategoryData?.data?.name ||
                            categoryData?.category?.name ||
                            "N/A"}
                        </li>
                        <li className="blog-section-box-content__list-item">
                          <span>Brand:</span> {brandData?.brandName || "N/A"}
                        </li>
                        {product.metaDetails?.map((meta) => (
                          <li
                            key={meta.id}
                            className="blog-section-box-content__list-item"
                          >
                            <span>{meta.title}:</span> {meta.value}{" "}
                            {meta.unit || ""}
                          </li>
                        ))}
                      </ul>
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
            </div>
            {isRecommendedLoading ? (
              <div className="loading-container">
                <Spin size="large" />
              </div>
            ) : relatedProducts?.length > 0 ? (
              <div className="shop-section__products">
                {relatedProducts.map((recProduct) => (
                  <div
                    key={recProduct.productId}
                    className="shop-section-swiper__slide shop-section-slide"
                  >
                    <ProductCard
                      product={recProduct}
                      getBrandsName={getBrandsName}
                      getCategoryName={getCategoryName}
                      formatPrice={formatPrice}
                      getCompanyCode={getCompanyCode}
                      handleAddToCart={handleAddToCart}
                      handleToggleFeatured={handleToggleFeatured}
                      cartLoadingStates={cartLoadingStates}
                      featuredLoadingStates={{}}
                      menu={menu}
                    />
                  </div>
                ))}
              </div>
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
