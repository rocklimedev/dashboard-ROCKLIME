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
import { message } from "antd";
import { Breadcrumb, Button, InputNumber, Spin, Tabs, Menu } from "antd";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { ShoppingCartOutlined } from "@ant-design/icons";
import ProductCard from "./ProductCard";
import "./pd.css";
import noimage from "../../assets/img/default.png";
import { Helmet } from "react-helmet";

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
    data: allProductsResponse,
    isLoading: isAllProductsLoading,
    error: allProductsError,
  } = useGetAllProductsQuery({
    skip: !!recommendedProducts?.length,
  });

  const allProducts = allProductsResponse?.data || []; // Extract the actual array

  const { data: user, isLoading: userLoading } = useGetProfileQuery();
  const userId = user?.user?.userId;

  const [addProductToCart, { isLoading: isCartLoading }] =
    useAddProductToCartMutation();

  const [cartLoadingStates, setCartLoadingStates] = useState({});
  const [barcodeData, setBarcodeData] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const barcodeRef = useRef(null);

  /* --------------------------------------------------------------
     1. IMAGE PARSING – works with array OR string
     -------------------------------------------------------------- */
  const safeParseImages = (imageField) => {
    if (Array.isArray(imageField) && imageField.length) {
      return imageField.filter((i) => typeof i === "string" && i);
    }
    if (typeof imageField === "string" && imageField.trim()) {
      try {
        const parsed = JSON.parse(imageField);
        return Array.isArray(parsed) && parsed.length
          ? parsed.filter((i) => typeof i === "string" && i)
          : imageField.startsWith("http")
          ? [imageField]
          : [noimage];
      } catch {
        return imageField.startsWith("http") ? [imageField] : [noimage];
      }
    }
    return [noimage];
  };

  /* --------------------------------------------------------------
     2. BARCODE
     -------------------------------------------------------------- */
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
      } catch {
        message.error("Failed to generate barcode.");
      }
    }
  };

  const handlePrint = () => {
    if (!barcodeRef.current) {
      message.error("No barcode available to print.");
      return;
    }
    const svg = barcodeRef.current;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      message.error("Unable to open print window.");
      return;
    }
    printWindow.document.write(`
      <html>
        <head><title>Print Barcode</title>
          <style>body{display:flex;align-items:center;justify-content:center;height:100vh;margin:0}</style>
        </head>
        <body onload="window.print();window.close();">${svgStr}</body>
      </html>
    `);
    printWindow.document.close();
  };

  /* --------------------------------------------------------------
     3. CART
     -------------------------------------------------------------- */
  const handleAddToCart = async (product) => {
    if (!userId) {
      message.error("User not logged in!");
      return;
    }

    const sellingPriceEntry = Array.isArray(product.metaDetails)
      ? product.metaDetails.find((m) => m.slug === "sellingPrice")
      : null;
    const sellingPrice = sellingPriceEntry
      ? parseFloat(sellingPriceEntry.value)
      : null;

    if (!sellingPrice || isNaN(sellingPrice)) {
      message.error("Invalid product price");
      return;
    }
    if (quantity <= 0 || quantity > product.quantity) {
      message.error("Invalid quantity");
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
      message.error(error.data?.message || "Unknown error");
    } finally {
      setCartLoadingStates((prev) => ({ ...prev, [productId]: false }));
    }
  };

  /* --------------------------------------------------------------
     4. HELPERS
     -------------------------------------------------------------- */
  const handleThumbnailClick = (idx) => setActiveImage(idx);

  const handleQuantityChange = (value) => {
    if (value >= 1 && value <= (product?.quantity || 1)) setQuantity(value);
  };

  const getSellingPrice = (metaDetails) =>
    Array.isArray(metaDetails)
      ? Number(metaDetails.find((m) => m.slug === "sellingPrice")?.value || 0)
      : null;

  const getCompanyCode = (metaDetails) =>
    Array.isArray(metaDetails)
      ? metaDetails.find((m) => m.slug?.toLowerCase() === "companycode")
          ?.value || "N/A"
      : "N/A";

  const getBrandsName = () => brandData?.brandName || "Not Branded";
  const getCategoryName = () =>
    parentCategoryData?.data?.name ||
    categoryData?.category?.name ||
    "Uncategorized";

  /* --------------------------------------------------------------
     5. EFFECTS
     -------------------------------------------------------------- */
  useEffect(() => {
    if (product?.product_code) {
      setBarcodeData(product.product_code);
      generateBarcode(product.product_code);
    }
    if (brandError) message.error("Failed to load brand information.");
    if (allProductsError) {
      const msg =
        allProductsError.status === 401 || allProductsError.status === 403
          ? "Unauthorized to view products."
          : allProductsError.status === 404
          ? "No products found."
          : "Failed to load products.";
      message.error(msg);
    }
  }, [product, brandError, allProductsError]);

  /* --------------------------------------------------------------
     6. LOADING / ERROR
     -------------------------------------------------------------- */
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

  /* --------------------------------------------------------------
     7. DATA PREP
     -------------------------------------------------------------- */
  const images = safeParseImages(product.images);
  const sellingPrice = getSellingPrice(product.metaDetails);
  const relatedProducts = (
    recommendedProducts?.length > 0
      ? recommendedProducts.filter((p) => p.productId !== product.productId)
      : allProducts.filter(
          (p) =>
            p.productId !== product.productId && p.brandId === product.brandId
        )
  ).slice(0, 4);
  /* --------------------------------------------------------------
     8. RENDER
     -------------------------------------------------------------- */
  return (
    <div className="page-wrapper">
      <Helmet>
        <title>
          {product.name} - {brandData?.brandName || "N/A"}
        </title>
      </Helmet>
      <div className="content">
        <div className="pd-root">
          <div className="pd-breadcrumbs">
            <Breadcrumb
              items={[
                { title: <Link to="/">Home</Link> },
                { title: <Link to="/category-selector">Shop</Link> },
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
                      sellingPrice === null ||
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
                    <strong>Product Code:</strong>{" "}
                    {product.product_code || "N/A"}
                  </div>
                  <div>
                    <strong>Brand:</strong> {getBrandsName()}
                  </div>
                  <div>
                    <strong>Category:</strong> {getCategoryName()}
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
                            <span>Category:</span> {getCategoryName()}
                          </li>
                          <li>
                            <span>Brand:</span> {getBrandsName()}
                          </li>
                          {Array.isArray(product.metaDetails) &&
                            product.metaDetails.map((meta) => (
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
              ) : relatedProducts.length > 0 ? (
                <div className="pd-related__grid">
                  {relatedProducts.map((recProduct) => (
                    <div key={recProduct.productId}>
                      <ProductCard
                        product={recProduct}
                        getBrandsName={getBrandsName}
                        getCategoryName={getCategoryName}
                        formatPrice={(fallback, metaDetails) => {
                          if (!Array.isArray(metaDetails)) return "N/A";
                          const sp = metaDetails.find(
                            (m) => m.slug === "sellingPrice"
                          );
                          const price = sp ? parseFloat(sp.value) : null;
                          return price != null && !isNaN(price)
                            ? `₹${price.toFixed(2)}`
                            : "N/A";
                        }}
                        getCompanyCode={getCompanyCode}
                        handleAddToCart={handleAddToCart}
                        cartLoadingStates={cartLoadingStates}
                        menu={(p) => (
                          <Menu>
                            <Menu.Item key="view">
                              <Link to={`/product/${p.productId}`}>View</Link>
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
