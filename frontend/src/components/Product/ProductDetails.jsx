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
import {
  message,
  Breadcrumb,
  Button,
  InputNumber,
  Spin,
  Tabs,
  Menu,
} from "antd";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { ShoppingCartOutlined } from "@ant-design/icons";
import ProductCard from "./ProductCard";
import styles from "./productdetails.module.css"; // ← CSS Modules
import noimage from "../../assets/img/default.png";
import { Helmet } from "react-helmet";

const ProductDetails = () => {
  const { id } = useParams();

  const {
    data: product,
    error: productError,
    isLoading: isProductLoading,
    refetch,
  } = useGetProductByIdQuery(id);

  const { data: categoryData } = useGetCategoryByIdQuery(product?.categoryId, {
    skip: !product?.categoryId,
  });

  const { data: parentCategoryData } = useGetParentCategoryByIdQuery(
    categoryData?.category?.parentCategoryId,
    { skip: !categoryData?.category?.parentCategoryId },
  );

  const { data: brandData } = useGetBrandByIdQuery(product?.brandId, {
    skip: !product?.brandId,
  });

  const { data: recommendedProducts } = useGetAllProductsByCategoryQuery(
    product?.categoryId,
    {
      skip: !product?.categoryId,
    },
  );

  const { data: allProductsResponse } = useGetAllProductsQuery(undefined, {
    skip: !!recommendedProducts?.length,
  });

  const allProducts = allProductsResponse?.data || [];

  const { data: user } = useGetProfileQuery();
  const userId = user?.user?.userId;

  const [addToCart, { isLoading: isCartLoading }] =
    useAddProductToCartMutation();

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const barcodeRef = useRef(null);
  const [cartLoadingStates, setCartLoadingStates] = useState({});
  // ── Helpers ────────────────────────────────────────────────
  const safeParseImages = (images) => {
    if (Array.isArray(images)) return images.filter(Boolean);
    if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [images];
      } catch {
        return images.trim() ? [images] : [noimage];
      }
    }
    return [noimage];
  };

  const images = safeParseImages(product?.images || []);

  const sellingPrice = Array.isArray(product?.metaDetails)
    ? Number(
        product.metaDetails.find((m) => m.slug === "sellingPrice")?.value || 0,
      )
    : 0;

  const mrp = product?.mrp ? Number(product.mrp) : null;
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

  // ── Barcode ────────────────────────────────────────────────
  useEffect(() => {
    if (product?.product_code && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, product.product_code, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
        });
      } catch (err) {
        message.error("Barcode generation failed");
      }
    }
  }, [product?.product_code]);

  const handlePrintBarcode = () => {
    if (!barcodeRef.current) return message.error("No barcode to print");
    const svg = barcodeRef.current.outerHTML;
    const win = window.open();
    win.document.write(`
      <html>
        <head><title>Barcode - ${product.name}</title></head>
        <body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;">
          ${svg}
        </body>
      </html>
    `);
    win.document.close();
    win.onload = () => {
      win.print();
      win.close();
    };
  };

  // ── Cart ───────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!userId) return message.error("Please login first");
    if (quantity < 1 || quantity > (product?.quantity || 1)) {
      return message.error("Invalid quantity");
    }
    if (!sellingPrice || isNaN(sellingPrice)) {
      return message.error("Invalid price");
    }

    try {
      await addToCart({
        userId,
        productId: product.productId,
        quantity,
      }).unwrap();
      message.success("Added to cart!");
      setQuantity(1);
    } catch (err) {
      message.error(err?.data?.message || "Failed to add to cart");
    }
  };

  // ── Related products ───────────────────────────────────────
  const related = recommendedProducts?.length
    ? recommendedProducts.filter((p) => p.productId !== product.productId)
    : allProducts.filter(
        (p) =>
          p.productId !== product.productId && p.brandId === product.brandId,
      );

  const relatedProducts = related.slice(0, 4);

  // ── Loading / Error states ─────────────────────────────────
  if (isProductLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className={styles.emptyState}>
        <h2>Product not found</h2>
        <Button type="primary" onClick={refetch}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className={styles.container}>
          <Helmet>
            <title>
              {product.name}{" "}
              {brandData?.brandName ? `- ${brandData.brandName}` : ""}
            </title>
          </Helmet>

          <Breadcrumb className={styles.breadcrumb}>
            <Breadcrumb.Item>
              <Link to="/">Home</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <Link to="/category-selector">Shop</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{product.name}</Breadcrumb.Item>
          </Breadcrumb>

          <div className={styles.mainGrid}>
            {/* Gallery */}
            <div className={styles.gallery}>
              <div className={styles.heroImageWrapper}>
                <LazyLoadImage
                  src={images[activeImage] || noimage}
                  alt={product.name}
                  effect="blur"
                  placeholderSrc={noimage}
                  className={styles.heroImage}
                  onError={(e) => (e.target.src = noimage)}
                />
              </div>

              {images.length > 1 && (
                <div className={styles.thumbnails}>
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`${styles.thumbnailBtn} ${activeImage === idx ? styles.active : ""}`}
                      onClick={() => setActiveImage(idx)}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <LazyLoadImage
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className={styles.thumbnailImg}
                        onError={(e) => (e.target.src = noimage)}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className={styles.summary}>
              <h1 className={styles.title}>{product.name}</h1>

              <div className={styles.priceContainer}>
                {mrp && mrp !== sellingPrice && (
                  <span className={styles.mrp}>₹{mrp.toFixed(2)}</span>
                )}
                <span className={styles.currentPrice}>
                  ₹{sellingPrice.toFixed(2)}
                </span>
              </div>

              <p className={styles.description}>
                {product.description || "No description provided."}
              </p>

              <div className={styles.actionRow}>
                <span className={styles.quantityLabel}>Quantity:</span>
                <InputNumber
                  min={1}
                  max={product.quantity || 1}
                  value={quantity}
                  onChange={(v) => setQuantity(v)}
                  className={styles.quantityInput}
                />
                <Button
                  type="primary"
                  style={{ backgroundColor: "#e31e24" }}
                  icon={<ShoppingCartOutlined />}
                  size="large"
                  onClick={handleAddToCart}
                  loading={isCartLoading}
                  disabled={product.quantity <= 0 || !sellingPrice}
                  className={styles.addToCartBtn}
                >
                  Add to Cart
                </Button>
              </div>

              {/* Barcode */}
              <div className={styles.barcodeSection}>
                <svg ref={barcodeRef} style={{ width: "100%", height: 80 }} />
                <div className={styles.barcodeActions}>
                  <Button
                    onClick={handlePrintBarcode}
                    disabled={!product.product_code}
                  >
                    Print Barcode
                  </Button>
                </div>
              </div>

              {/* Meta */}
              <div className={styles.metaGrid}>
                <div className={styles.metaLabel}>Product Code</div>
                <div>{product.product_code || "—"}</div>

                <div className={styles.metaLabel}>Brand</div>
                <div>{brandData?.brandName || "—"}</div>

                <div className={styles.metaLabel}>Category</div>
                <div>
                  {parentCategoryData?.data?.name ||
                    categoryData?.category?.name ||
                    "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: "1",
                label: "Description",
                children: (
                  <p>{product.description || "No additional details."}</p>
                ),
              },
              {
                key: "2",
                label: "Additional Information",
                children: (
                  <ul style={{ listStyle: "none", padding: 0 }}>
                    {Array.isArray(product.metaDetails) &&
                      product.metaDetails.map((m) => (
                        <li key={m.id} style={{ marginBottom: "0.5rem" }}>
                          <strong>{m.title || m.slug}:</strong> {m.value}{" "}
                          {m.unit || ""}
                        </li>
                      ))}
                  </ul>
                ),
              },
            ]}
          />

          {/* Related Products */}
          <section className={styles.relatedSection}>
            <h2 className={styles.relatedHeader}>Related Products</h2>

            {relatedProducts.length > 0 ? (
              <div className={styles.relatedGrid}>
                {relatedProducts.map((p) => (
                  <ProductCard
                    key={p.productId}
                    product={p}
                    getBrandsName={getBrandsName}
                    getCategoryName={getCategoryName}
                    formatPrice={(fallback, metaDetails) => {
                      if (!Array.isArray(metaDetails)) return "N/A";
                      const sp = metaDetails.find(
                        (m) => m.slug === "sellingPrice",
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
                    // pass any needed props – adjust according to your ProductCard
                  />
                ))}
              </div>
            ) : (
              <p style={{ textAlign: "center", color: "#6b7280" }}>
                No related products found.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
