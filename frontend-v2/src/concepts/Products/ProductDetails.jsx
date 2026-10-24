import Loader from '../../components/Common/Loader';
import ModalShell from '../../components/Common/ModalShell';
import './ProductDetails.styles.css';
// ProductDetails.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  useGetProductByIdQuery,
  useGetAllProductsByCategoryQuery,
  useGetAllProductsQuery,
} from '../../api/productApi';
import { useGetCategoryByIdQuery } from '../../api/categoryApi';
import { useGetParentCategoryByIdQuery } from '../../api/parentCategoryApi';
import { useGetBrandByIdQuery } from '../../api/brandsApi';
import { useAddProductToCartMutation } from '../../api/cartApi';
import { useGetProfileQuery } from '../../api/userApi';
import JsBarcode from 'jsbarcode';
import { Breadcrumb, Button, InputNumber, Tabs, Menu, Tooltip } from 'antd';
import { toast } from 'sonner';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import {
  ShoppingCartOutlined,
  EditOutlined,
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
  ZoomInOutlined,
} from '@ant-design/icons';
import ProductCard from '../../components/Product/ProductCard';
import styles from '../../components/Product/productdetails.module.css';
import noimage from '../../assets/img/default.png';
import { Helmet } from 'react-helmet';
import PermissionGate from '../../context/PermissionGate'; // ← Added for permission control
import ProductStockDrawer from '../../components/Stock/ProductStockDrawer';
import StockBadge from '../../components/Stock/StockBadge';
import useStockAvailability from '../../components/Stock/useStockAvailability';

const ProductDetails = () => {
  const { id } = useParams();

  const {
    data: product,
    error: productError,
    isLoading: isProductLoading,
    refetch,
  } = useGetProductByIdQuery(id);
  const { stock: stockById } = useStockAvailability(product?.productId ? [product.productId] : []);
  const stockInfo = product?.productId ? stockById[product.productId] : null;

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

  const { data: recommendedProducts } = useGetAllProductsByCategoryQuery(product?.categoryId, {
    skip: !product?.categoryId,
  });

  const { data: allProductsResponse } = useGetAllProductsQuery(undefined, {
    skip: !!recommendedProducts?.length,
  });

  const allProducts = allProductsResponse?.data || [];

  const { data: user } = useGetProfileQuery();
  const userId = user?.user?.userId;

  const [addToCart, { isLoading: isCartLoading }] = useAddProductToCartMutation();

  const [quantity, setQuantity] = useState(1);
  const [stockOpen, setStockOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const barcodeRef = useRef(null);
  const [cartLoadingStates, setCartLoadingStates] = useState({});

  // ── Image gallery modal state ───────────────────────────────
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // ── Helpers ────────────────────────────────────────────────
  const safeParseImages = (images) => {
    if (Array.isArray(images)) return images.filter(Boolean);
    if (typeof images === 'string') {
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
    ? Number(product.metaDetails.find((m) => m.slug === 'sellingPrice')?.value || 0)
    : 0;

  const mrp = product?.mrp ? Number(product.mrp) : null;
  const getCompanyCode = (metaDetails) =>
    Array.isArray(metaDetails)
      ? metaDetails.find((m) => m.slug?.toLowerCase() === 'companycode')?.value || 'N/A'
      : 'N/A';

  const getBrandsName = () => brandData?.brandName || 'Not Branded';
  const getCategoryName = () =>
    parentCategoryData?.data?.name || categoryData?.category?.name || 'Uncategorized';

  // ── Barcode ────────────────────────────────────────────────
  useEffect(() => {
    if (product?.product_code && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, product.product_code, {
          format: 'CODE128',
          width: 2,
          height: 60,
          displayValue: true,
          fontSize: 14,
        });
      } catch (err) {
        toast.error('Barcode generation failed');
      }
    }
  }, [product?.product_code]);

  const handlePrintBarcode = () => {
    if (!barcodeRef.current) return toast.error('No barcode to print');
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
      return toast.error('Please login first');
    }

    if (quantity < 1) {
      return toast.error('Quantity must be at least 1');
    }

    if (!sellingPrice || isNaN(sellingPrice) || sellingPrice <= 0) {
      return toast.error('Invalid price');
    }

    try {
      await addToCart({
        userId,
        productId: product.productId,
        quantity,
      }).unwrap();

      toast.success(`Added ${quantity} unit${quantity > 1 ? 's' : ''} to cart successfully!`);
      setQuantity(1);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add to cart');
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
      if (e.key === 'ArrowLeft') showPrevImage();
      else if (e.key === 'ArrowRight') showNextImage();
      else if (e.key === 'Escape') closeGallery();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        <Loader size="large" />
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
              {product.name} {brandData?.brandName ? `- ${brandData.brandName}` : ''}
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
                className={styles.heroImageWrapper + ' fv2-productdetails-fe1eff22de'}
                onClick={() => openGallery(activeImage)}
              >
                <LazyLoadImage
                  src={images[activeImage] || noimage}
                  alt={product.name}
                  effect="blur"
                  placeholderSrc={noimage}
                  className={styles.heroImage}
                  onError={(e) => (e.target.src = noimage)}
                />
                <div className="fv2-productdetails-39bb780eeb">
                  <ZoomInOutlined />
                </div>
              </div>

              {images.length > 1 && (
                <div className={styles.thumbnails}>
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`${styles.thumbnailBtn} ${activeImage === idx ? styles.active : ''}`}
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
              <div className="fv2-productdetails-bee6010100">
                <h1 className={styles.title}>{product.name}</h1>

                {/* EDIT BUTTON */}
                <PermissionGate api="edit" module="products">
                  <Tooltip title="Edit Product">
                    <Link to={`/product/${product.productId}/edit`}>
                      <Button
                        className="fv2-productdetails-8ab571a07a"
                        type="default"
                        icon={<EditOutlined />}
                        size="large"
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
                <span className={styles.currentPrice}>₹{sellingPrice.toFixed(2)}</span>
              </div>

              {stockInfo && (
                <div className="fv2-productdetails-14567f87dd">
                  <StockBadge
                    available={stockInfo.available}
                    reserved={stockInfo.reserved}
                    incoming={stockInfo.incoming}
                    lowAt={stockInfo.lowAt}
                    nextDate={stockInfo.nextIncoming}
                    need={quantity}
                  />
                  <Button type="link" size="small" onClick={() => setStockOpen(true)}>
                    Stock details
                  </Button>
                </div>
              )}

              <p className={styles.description}>
                {product.description || 'No description provided.'}
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

                  icon={<ShoppingCartOutlined />}
                  size="large"
                  onClick={handleAddToCart}
                  loading={isCartLoading}
                  disabled={!sellingPrice || isNaN(sellingPrice) || sellingPrice <= 0}
                  className={styles.addToCartBtn + ' fv2-productdetails-5a2f72b20c'}
                >
                  Add to Cart
                </Button>
              </div>

              {/* Barcode */}
              <div className={styles.barcodeSection}>
                <svg className="fv2-productdetails-d8feae884f" ref={barcodeRef} />
                <div className={styles.barcodeActions}>
                  <Button onClick={handlePrintBarcode} disabled={!product.product_code}>
                    Print Barcode
                  </Button>
                </div>
              </div>

              {/* Meta */}
              <div className={styles.metaGrid}>
                <div className={styles.metaLabel}>Product Code</div>
                <div>{product.product_code || '—'}</div>

                <div className={styles.metaLabel}>Brand</div>
                <div>{brandData?.brandName || '—'}</div>

                <div className={styles.metaLabel}>Category</div>
                <div>{parentCategoryData?.data?.name || categoryData?.category?.name || '—'}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: 'Description',
                children: <p>{product.description || 'No additional details.'}</p>,
              },
              {
                key: '2',
                label: 'Additional Information',
                children: (
                  <ul className="fv2-productdetails-149f5c81ab">
                    {Array.isArray(product.metaDetails) &&
                      product.metaDetails.map((m) => (
                        <li className="fv2-productdetails-bf6baf9219" key={m.id}>
                          <strong>{m.title || m.slug}:</strong> {m.value} {m.unit || ''}
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
                      if (!Array.isArray(metaDetails)) return 'N/A';
                      const sp = metaDetails.find((m) => m.slug === 'sellingPrice');
                      const price = sp ? parseFloat(sp.value) : null;
                      return price != null && !isNaN(price) ? `₹${price.toFixed(2)}` : 'N/A';
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
              <p className="fv2-productdetails-0cad270001">No related products found.</p>
            )}
          </section>
        </div>
      </div>

      {/* ── Image Gallery Modal ───────────────────────────────── */}
      <ModalShell
        open={isGalleryOpen}
        onCancel={closeGallery}
        footer={null}
        closable={false}
        centered
        width="80vw"
        styles={{
          body: { padding: 0, background: '#000' },
        }}
      >
        <div className="fv2-productdetails-9c552c9a17">
          {/* Close button */}
          <Button
            className="fv2-productdetails-a2694342e5"
            shape="circle"
            icon={<CloseOutlined />}
            onClick={closeGallery}
          />

          {/* Prev arrow */}
          {images.length > 1 && (
            <Button
              className="fv2-productdetails-9dbfdbcabd"
              shape="circle"
              icon={<LeftOutlined />}
              onClick={showPrevImage}
            />
          )}

          {/* Main image */}
          <img
            className="fv2-productdetails-0168b05a08"
            src={images[galleryIndex] || noimage}
            alt={`${product.name} ${galleryIndex + 1}`}

            onError={(e) => (e.target.src = noimage)}
          />

          {/* Next arrow */}
          {images.length > 1 && (
            <Button
              className="fv2-productdetails-11a2571618"
              shape="circle"
              icon={<RightOutlined />}
              onClick={showNextImage}
            />
          )}

          {/* Counter */}
          <div className="fv2-productdetails-1c8b861c7e">
            {galleryIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail strip inside modal */}
        {images.length > 1 && (
          <div className="fv2-productdetails-64b839e15f">
            {images.map((img, idx) => (
              <img
                className="fv2-productdetails-e59475a32a"
                key={idx}
                src={img}
                alt={`Modal thumbnail ${idx + 1}`}
                onClick={() => setGalleryIndex(idx)}
                onError={(e) => (e.target.src = noimage)}
                style={{
                  borderRadius: 4,
                  border: galleryIndex === idx ? '2px solid #e31e24' : '2px solid transparent',
                  opacity: galleryIndex === idx ? 1 : 0.6,
                }}
              />
            ))}
          </div>
        )}
      </ModalShell>
      <ProductStockDrawer
        productId={product.productId}
        open={stockOpen}
        onClose={() => setStockOpen(false)}
      />
    </div>
  );
};

export default ProductDetails;
