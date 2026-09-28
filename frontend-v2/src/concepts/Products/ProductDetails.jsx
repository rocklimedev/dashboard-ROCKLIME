// ProductDetails.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
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
  Tooltip,
  Modal,
} from "antd";
import { LazyLoadImage } from "react-lazy-load-image-component";
import {
  ShoppingCartOutlined,
  EditOutlined,
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
  ZoomInOutlined,
} from "@ant-design/icons";
import ProductCard from "../../components/Product/ProductCard";
import styles from "../../components/Product/productdetails.module.css";
import noimage from "../../assets/img/default.png";
import { Helmet } from "react-helmet";
import PermissionGate from "../../context/PermissionGate"; // ← Added for permission control

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

  // ── Image gallery modal state ───────────────────────────────
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

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

  // ── Cart Handler - NO STOCK CHECK ─────────────────────────────
  const handleAddToCart = async () => {
    if (!userId) {
      return message.error("Please login first");
    }

    if (quantity < 1) {
      return message.error("Quantity must be at least 1");
    }

    if (!sellingPrice || isNaN(sellingPrice) || sellingPrice <= 0) {
      return message.error("Invalid price");
    }

    try {
      await addToCart({
        userId,
        productId: product.productId,
        quantity,
      }).unwrap();

      message.success(
        `Added ${quantity} unit${quantity > 1 ? "s" : ""} to cart successfully!`,
      );
      setQuantity(1);
    } catch (err) {
      message.error(err?.data?.message || "Failed to add to cart");
    }
  };

  // ── Gallery modal handlers ──────────────────────────────────
  const openGallery = (index) => {
    setGalleryIndex(index);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => setIsGalleryOpen(false);

  const showPrevImage = useCallback(() => {
    setGalleryIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const showNextImage = useCallback(() => {
    setGalleryIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  // Keyboard navigation while modal is open
  useEffect(() => {
    if (!isGalleryOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") showPrevImage();
      else if (e.key === "ArrowRight") showNextImage();
      else if (e.key === "Escape") closeGallery();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGalleryOpen, showPrevImage, showNextImage]);

  // ── Related products ───────────────────────────────────────
  const relatedProducts = React.useMemo(() => {
    if (!product?.productId) return [];

    let candidates = [];

    if (recommendedProducts?.length > 0) {
      candidates = recommendedProducts;
    } else if (allProducts?.length > 0) {
      candidates = allProducts;
    }

    return candidates
      .filter((p) => p?.productId && p.productId !== product.productId)
      .filter((p) => !product.brandId || p.brandId === product.brandId)
      .slice(0, 4);
  }, [product, recommendedProducts, allProducts]);

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
              <div
                className={styles.heroImageWrapper}
                onClick={() => openGallery(activeImage)}
                style={{ cursor: "zoom-in", position: "relative" }}
              >
                <LazyLoadImage
                  src={images[activeImage] || noimage}
                  alt={product.name}
                  effect="blur"
                  placeholderSrc={noimage}
                  className={styles.heroImage}
                  onError={(e) => (e.target.src = noimage)}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    background: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 32,
                    height: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ZoomInOutlined />
                </div>
              </div>

              {images.length > 1 && (
                <div className={styles.thumbnails}>
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`${styles.thumbnailBtn} ${activeImage === idx ? styles.active : ""}`}
                      onClick={() => setActiveImage(idx)}
                      onDoubleClick={() => openGallery(idx)}
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <h1 className={styles.title}>{product.name}</h1>

                {/* EDIT BUTTON */}
                <PermissionGate api="edit" module="products">
                  <Tooltip title="Edit Product">
                    <Link to={`/product/${product.productId}/edit`}>
                      <Button
                        type="default"
                        icon={<EditOutlined />}
                        size="large"
                        style={{ borderColor: "#1890ff", color: "#1890ff" }}
                      >
                        Edit
                      </Button>
                    </Link>
                  </Tooltip>
                </PermissionGate>
              </div>

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
                  value={quantity}
                  onChange={(v) => setQuantity(v || 1)}
                  className={styles.quantityInput}
                />
                <Button
                  type="primary"
                  style={{ backgroundColor: "#e31e24" }}
                  icon={<ShoppingCartOutlined />}
                  size="large"
                  onClick={handleAddToCart}
                  loading={isCartLoading}
                  disabled={
                    !sellingPrice || isNaN(sellingPrice) || sellingPrice <= 0
                  }
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

      {/* ── Image Gallery Modal ───────────────────────────────── */}
      <Modal
        open={isGalleryOpen}
        onCancel={closeGallery}
        footer={null}
        closable={false}
        centered
        width="80vw"
        styles={{
          body: { padding: 0, background: "#000" },
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "70vh",
            background: "#000",
          }}
        >
          {/* Close button */}
          <Button
            shape="circle"
            icon={<CloseOutlined />}
            onClick={closeGallery}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 10,
            }}
          />

          {/* Prev arrow */}
          {images.length > 1 && (
            <Button
              shape="circle"
              icon={<LeftOutlined />}
              onClick={showPrevImage}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
              }}
            />
          )}

          {/* Main image */}
          <img
            src={images[galleryIndex] || noimage}
            alt={`${product.name} ${galleryIndex + 1}`}
            style={{
              maxWidth: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
            }}
            onError={(e) => (e.target.src = noimage)}
          />

          {/* Next arrow */}
          {images.length > 1 && (
            <Button
              shape="circle"
              icon={<RightOutlined />}
              onClick={showNextImage}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
              }}
            />
          )}

          {/* Counter */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              color: "#fff",
              fontSize: 14,
              background: "rgba(0,0,0,0.5)",
              padding: "2px 10px",
              borderRadius: 12,
            }}
          >
            {galleryIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail strip inside modal */}
        {images.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 12,
              overflowX: "auto",
              background: "#111",
            }}
          >
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Modal thumbnail ${idx + 1}`}
                onClick={() => setGalleryIndex(idx)}
                onError={(e) => (e.target.src = noimage)}
                style={{
                  width: 56,
                  height: 56,
                  objectFit: "cover",
                  borderRadius: 4,
                  cursor: "pointer",
                  flexShrink: 0,
                  border:
                    galleryIndex === idx
                      ? "2px solid #e31e24"
                      : "2px solid transparent",
                  opacity: galleryIndex === idx ? 1 : 0.6,
                }}
              />
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductDetails;
