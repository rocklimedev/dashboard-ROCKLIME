// ProductDetails.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useGetProductByIdQuery,
  useGetAllProductsByCategoryQuery,
  useGetAllProductsQuery,
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
import "./pd.css";
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

  const {
    data: allProducts,
    isLoading: isAllProductsLoading,
    error: allProductsError,
  } = useGetAllProductsQuery({
    skip: !!recommendedProducts?.length,
  });

  const { data: user, isLoading: userLoading } = useGetProfileQuery();
  const userId = user?.user?.userId;

  const [addProductToCart, { isLoading: isCartLoading }] =
    useAddProductToCartMutation();

  const [cartLoadingStates, setCartLoadingStates] = useState({});
  const [barcodeData, setBarcodeData] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const barcodeRef = useRef(null);

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

  const generateBarcode = (code) => {
    if (code && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, code, {
          format: "CODE128",
          lineColor: "#000",
          width: 2,
          height: 48,
          displayValue: true,
        });
      } catch (error) {
        toast.error("Failed to generate barcode.");
      }
    }
  };

  const handlePrint = () => {
    if (barcodeRef.current) {
      const svg = barcodeRef.current;
      const serializer = new XMLSerializer();
      const svgStr = serializer.serializeToString(svg);
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Unable to open print window.");
        return;
      }
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode</title>
            <style>body{display:flex;align-items:center;justify-content:center;height:100vh;margin:0}</style>
          </head>
          <body onload="window.print();window.close();">
            ${svgStr}
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast.error("No barcode available to print.");
    }
  };

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

  const handleThumbnailClick = (index) => {
    setActiveImage(index);
  };

  const handleQuantityChange = (value) => {
    if (value >= 1 && value <= (product?.quantity || 1)) {
      setQuantity(value);
    }
  };

  const getSellingPrice = (metaDetails) => {
    const spObj = metaDetails?.find((m) => m.slug === "sellingPrice");
    return spObj ? Number(spObj.value) : null;
  };

  const getCompanyCode = (metaDetails) => {
    if (!Array.isArray(metaDetails)) {
      return "N/A";
    }
    const companyCodeEntry = metaDetails.find(
      (detail) => detail.slug?.toLowerCase() === "companycode"
    );
    return companyCodeEntry ? String(companyCodeEntry.value) : "N/A";
  };

  const getBrandsName = (brandId) => brandData?.brandName || "Not Branded";
  const getCategoryName = (categoryId) =>
    categoryData?.category?.name || "Uncategorized";

  useEffect(() => {
    if (product?.product_code) {
      setBarcodeData(product.product_code);
      generateBarcode(product.product_code);
    }
    if (brandError) {
      toast.error("Failed to load brand information.");
    }
    if (allProductsError) {
      toast.error(
        allProductsError.status === 401 || allProductsError.status === 403
          ? "Unauthorized to view products."
          : allProductsError.status === 404
          ? "No products found."
          : "Failed to load products."
      );
    }
  }, [product, brandError, allProductsError]);

  if (
    isProductLoading ||
    isCategoryLoading ||
    isParentCategoryLoading ||
    isBrandLoading ||
    userLoading ||
    isRecommendedLoading ||
    isAllProductsLoading
  ) {
    return (
      <div className="pd-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (productError) {
    return (
      <div className="pd-root">
        <div className="pd-error">
          <p className="pd-error__text">
            Error: {productError.message || "Failed to load product"}
          </p>
          <Button type="primary" onClick={refetchProduct}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pd-root">
        <div className="pd-empty">
          <p className="pd-empty__text">Product not found.</p>
        </div>
      </div>
    );
  }

  const images = getParsedImages(product.images);
  const sellingPrice = getSellingPrice(product.metaDetails);

  const relatedProducts = (
    recommendedProducts?.length
      ? recommendedProducts.filter(
          (recProduct) => recProduct.productId !== product.productId
        )
      : allProducts?.filter(
          (recProduct) =>
            recProduct.productId !== product.productId &&
            recProduct.brandId === product.brandId
        ) || []
  ).slice(0, 4);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="pd-root">
          <div className="pd-breadcrumbs">
            <Breadcrumb
              items={[
                { title: <Link to="/">Home</Link> },
                { title: <Link to="/category-selector/products">Shop</Link> },
                { title: <span>{product.name || "N/A"}</span> },
              ]}
            />
          </div>

          <main className="pd-main">
            <section className="pd-visual">
              <div className="pd-gallery">
                <div className="pd-gallery__hero" aria-live="polite">
                  <LazyLoadImage
                    src={images[activeImage] || noimage}
                    alt={`Image of ${product.name}`}
                    effect="blur"
                    placeholderSrc={noimage}
                    className="pd-hero-img"
                    onError={(e) => (e.target.src = noimage)}
                  />
                </div>

                <div className="pd-gallery__thumbs" role="list">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={
                        "pd-thumb" +
                        (activeImage === idx ? " pd-thumb--active" : "")
                      }
                      onClick={() => handleThumbnailClick(idx)}
                      aria-label={`Show image ${idx + 1}`}
                    >
                      <LazyLoadImage
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="pd-thumb__img"
                        onError={(e) => (e.target.src = noimage)}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <aside className="pd-summary" aria-labelledby="pd-product-title">
                <h1 id="pd-product-title" className="pd-title">
                  {product.name || "N/A"}
                </h1>

                <div className="pd-pricing">
                  {product?.mrp && product.mrp !== sellingPrice && (
                    <div className="pd-price__mrp">
                      ₹{Number(product.mrp).toFixed(2)}
                    </div>
                  )}
                  <div className="pd-price__current">
                    {sellingPrice !== null
                      ? `₹${sellingPrice.toFixed(2)}`
                      : "N/A"}
                  </div>
                </div>

                <p className="pd-description">
                  {product.description || "No description available"}
                </p>

                <div className="pd-qty-row">
                  <label className="pd-qty-label">Quantity</label>
                  <InputNumber
                    className="pd-qty-input"
                    value={quantity}
                    onChange={handleQuantityChange}
                    min={1}
                    max={product.quantity || 1}
                    controls={true}
                  />
                  <Button
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => handleAddToCart(product)}
                    disabled={
                      product.quantity <= 0 ||
                      isCartLoading ||
                      !userId ||
                      !sellingPrice ||
                      isNaN(sellingPrice)
                    }
                    loading={
                      isCartLoading || cartLoadingStates[product.productId]
                    }
                  >
                    Add to Cart
                  </Button>
                </div>

                <div className="pd-barcode">
                  <svg
                    ref={barcodeRef}
                    className="pd-barcode__svg"
                    aria-hidden={!barcodeData}
                  />
                  <div className="pd-barcode__actions">
                    <Button onClick={handlePrint} disabled={!barcodeData}>
                      Print Barcode
                    </Button>
                  </div>
                </div>

                <div className="pd-meta">
                  <div>
                    <strong>SKU:</strong> {product.product_code || "N/A"}
                  </div>
                  <div>
                    <strong>Brand:</strong> {brandData?.brandName || "N/A"}
                  </div>
                  <div>
                    <strong>Category:</strong>{" "}
                    {parentCategoryData?.data?.name ||
                      categoryData?.category?.name ||
                      "N/A"}
                  </div>
                </div>
              </aside>
            </section>

            <section className="pd-tabs">
              <Tabs
                defaultActiveKey="1"
                items={[
                  {
                    key: "1",
                    label: "Description",
                    children: (
                      <div className="pd-tab-content">
                        <h3>Description</h3>
                        <p>
                          {product.description || "No description available"}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: "2",
                    label: "Additional Info",
                    children: (
                      <div className="pd-tab-content">
                        <h3>Additional Information</h3>
                        <ul className="pd-info-list">
                          <li>
                            <span>Product Code:</span>{" "}
                            {product.product_code || "N/A"}
                          </li>
                          <li>
                            <span>SKU:</span> {product.product_code || "N/A"}
                          </li>
                          <li>
                            <span>Category:</span>{" "}
                            {parentCategoryData?.data?.name ||
                              categoryData?.category?.name ||
                              "N/A"}
                          </li>
                          <li>
                            <span>Brand:</span> {brandData?.brandName || "N/A"}
                          </li>
                          {product.metaDetails?.map((meta) => (
                            <li key={meta.id}>
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
            </section>

            <section className="pd-related">
              <div className="pd-related__header">
                <h3>Related Products</h3>
              </div>

              {isRecommendedLoading || isAllProductsLoading ? (
                <div className="pd-loading">
                  <Spin size="large" />
                </div>
              ) : relatedProducts?.length > 0 ? (
                <div className="pd-related__grid">
                  {relatedProducts.map((recProduct) => (
                    <div key={recProduct.productId}>
                      <ProductCard
                        product={recProduct}
                        getBrandsName={getBrandsName}
                        getCategoryName={getCategoryName}
                        formatPrice={(p, u) => {
                          const spEntry = Array.isArray(u)
                            ? u.find((m) => m.slug === "sellingPrice")
                            : null;
                          const priceValue = spEntry
                            ? parseFloat(spEntry.value)
                            : p;
                          return priceValue
                            ? `₹ ${Number(priceValue).toFixed(2)}`
                            : "N/A";
                        }}
                        getCompanyCode={getCompanyCode}
                        handleAddToCart={handleAddToCart}
                        handleToggleFeatured={() => {}}
                        cartLoadingStates={cartLoadingStates}
                        featuredLoadingStates={{}}
                        menu={(product) => (
                          <Menu>
                            <Menu.Item key="view">
                              <Link to={`/product/${product.productId}`}>
                                View
                              </Link>
                            </Menu.Item>
                          </Menu>
                        )}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p>No related products available.</p>
              )}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
