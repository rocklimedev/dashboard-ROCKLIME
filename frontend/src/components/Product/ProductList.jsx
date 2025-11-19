import React, { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Spin,
  Pagination,
  Empty,
  Table,
  Button,
  Tooltip,
  Dropdown,
  Select,
  Menu,
} from "antd";
import {
  SearchOutlined,
  ShoppingCartOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import {
  useGetAllProductsQuery,
  useDeleteProductMutation,
  useUpdateProductFeaturedMutation,
} from "../../api/productApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import {
  useGetBrandParentCategoryByIdQuery,
  useGetBrandParentCategoriesQuery,
} from "../../api/brandParentCategoryApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import {
  useAddProductToCartMutation,
  useGetCartQuery,
  useRemoveFromCartMutation,
} from "../../api/cartApi";
import { useGetProfileQuery } from "../../api/userApi";
import { toast } from "sonner";
import "./productdetails.css";
import DeleteModal from "../Common/DeleteModal";
import HistoryModal from "../Common/HistoryModal";
import StockModal from "../Common/StockModal";
import ProductCard from "./ProductCard";
import PageHeader from "../Common/PageHeader";
import Breadcrumb from "./Breadcrumb";
import pos from "../../assets/img/default.png";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import PermissionGate from "../../context/PermissionGate"; // <-- NEW
import { useAuth } from "../../context/AuthContext";

const ProductsList = () => {
  const { id: brandId, bpcId } = useParams();
  const navigate = useNavigate();

  // ──────────────────────────────────────────────────────
  // DATA HOOKS
  // ──────────────────────────────────────────────────────
  const { data: productsData, error, isLoading } = useGetAllProductsQuery();
  const { data: brandsData } = useGetAllBrandsQuery();
  const { data: bpcData } = useGetBrandParentCategoryByIdQuery(bpcId, {
    skip: !bpcId,
  });
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useGetAllCategoriesQuery();
  const { data: customersData } = useGetCustomersQuery();
  const { data: user, isLoading: userLoading } = useGetProfileQuery();

  const userId = user?.user?.userId;
  const { data: cartData, refetch: refetchCart } = useGetCartQuery(userId, {
    skip: !userId,
  });

  const [updateProductFeatured] = useUpdateProductFeaturedMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [addProductToCart] = useAddProductToCartMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

  // ──────────────────────────────────────────────────────
  // STATE
  // ──────────────────────────────────────────────────────
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isStockModalVisible, setStockModalVisible] = useState(false);
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [stockHistoryMap, setStockHistoryMap] = useState({});
  const [cartLoadingStates, setCartLoadingStates] = useState({});
  const [featuredLoadingStates, setFeaturedLoadingStates] = useState({});
  const [form] = Form.useForm();
  const [search, setSearch] = useState("");

  const itemsPerPage = 50;

  // ──────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────
  const getBrandsName = (brandId) => {
    return brandId
      ? brandsData?.find((b) => b.id === brandId)?.brandName || "Not Branded"
      : "Not Branded";
  };

  // ──────────────────────────────────────────────────────
  // HELPERS (add these two functions)
  // ──────────────────────────────────────────────────────
  const getCategoryName = (categoryId) => {
    return categoryId
      ? categoriesData?.categories?.find((c) => c.categoryId === categoryId)
          ?.name || "Uncategorized"
      : "Uncategorized";
  };

  const getParentCategoryName = (categoryId) => {
    const cat = categoriesData?.categories?.find(
      (c) => c.categoryId === categoryId
    );
    return cat?.parentcategories?.name || "";
  };

  const formatPrice = (value, unit) => {
    if (Array.isArray(unit)) {
      const metaDetails = unit;
      const sellingPriceEntry = metaDetails.find(
        (detail) => detail.slug?.toLowerCase() === "sellingprice"
      );
      if (sellingPriceEntry) {
        const cleaned = String(sellingPriceEntry.value).replace(/[^0-9.]/g, "");
        const price = parseFloat(cleaned);
        return !isNaN(price) ? `₹ ${price.toFixed(2)}` : "N/A 'N/A'";
      }
    }
    return "N/A";
  };

  const parseImages = (images) => {
    try {
      if (typeof images === "string") {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) ? parsed : [pos];
      }
      return Array.isArray(images) ? images : [pos];
    } catch {
      return [pos];
    }
  };

  const getCompanyCode = (metaDetails) => {
    if (!Array.isArray(metaDetails)) return "N/A";
    const entry = metaDetails.find(
      (d) => d.slug?.toLowerCase() === "companycode"
    );
    return entry ? String(entry.value) : "N/A";
  };

  // ──────────────────────────────────────────────────────
  // MEMOIZED DATA
  // ──────────────────────────────────────────────────────
  const products = useMemo(
    () => (Array.isArray(productsData) ? productsData : []),
    [productsData]
  );
  const categoryOptions = useMemo(() => {
    const allCategories = categoriesData?.categories ?? [];

    // Step 1: Determine which products we're filtering by brand/bpc
    const relevantProducts = products.filter((product) => {
      if (brandId) {
        return String(product.brandId) === String(brandId);
      }
      if (bpcId) {
        return String(product.brand_parentcategoriesId) === String(bpcId);
      }
      return true; // all products if no filter-brand filter
    });

    // Step 2: Extract unique categoryIds used in these products
    const usedCategoryIds = new Set(
      relevantProducts.map((p) => p.categoryId).filter(Boolean) // remove null/undefined
    );

    // Step 3: Build options only for categories that are actually used
    const filteredCategories = allCategories.filter((cat) =>
      usedCategoryIds.has(cat.categoryId || cat.id)
    );

    // Step 4: Sort alphabetically (optional but nice)
    filteredCategories.sort((a, b) => a.name.localeCompare(b.name));

    const options = [
      { label: "All Categories", value: "" },
      ...filteredCategories.map((c) => ({
        label: c.name,
        value: c.categoryId || c.id,
      })),
    ];

    return options;
  }, [categoriesData, products, brandId, bpcId]);
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // ── 1. Brand / Parent-Category filter
      const matchesFilter = brandId
        ? String(product.brandId) === String(brandId)
        : bpcId
        ? String(product.brand_parentcategoriesId) === String(bpcId)
        : true;

      // ── 2. Category filter
      const matchesCategory = selectedCategoryId
        ? String(product.categoryId) === selectedCategoryId
        : true;

      // ── 3. Search term
      const term = search.toLowerCase();
      const code = getCompanyCode(product.metaDetails);

      const matchesName = product.name?.toLowerCase().includes(term);
      const matchesCode = product.product_code?.toLowerCase().includes(term);
      const matchesCompany = code?.toLowerCase().includes(term);
      const catName = getCategoryName(product.categoryId);
      const parentCatName = getParentCategoryName(product.categoryId);
      const matchesCategoryName = catName.toLowerCase().includes(term);
      const matchesParentCategory = parentCatName.toLowerCase().includes(term);

      return (
        matchesFilter &&
        matchesCategory &&
        (!term ||
          matchesName ||
          matchesCode ||
          matchesCompany ||
          matchesCategoryName ||
          matchesParentCategory)
      );
    });
  }, [
    products,
    brandId,
    bpcId,
    search,
    categoriesData,
    selectedCategoryId, // ← NEW dependency
  ]);
  const formattedTableData = useMemo(
    () =>
      filteredProducts.map((product) => ({
        ...product,
        Name: product.name || "N/A",
        Brand: getBrandsName(product.brandId),
        Price: formatPrice(product.meta, product.metaDetails),
        Stock:
          product.quantity > 0
            ? `${product.quantity} in stock`
            : "Out of Stock",
        company_code: getCompanyCode(product.metaDetails),
      })),
    [filteredProducts]
  );

  const offset = (currentPage - 1) * itemsPerPage;
  const currentItems = formattedTableData.slice(offset, offset + itemsPerPage);

  // ──────────────────────────────────────────────────────
  // HANDLERS
  // ──────────────────────────────────────────────────────

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct?.productId) {
      toast.error("No product selected");
      setDeleteModalVisible(false);
      return;
    }
    try {
      await deleteProduct(selectedProduct.productId).unwrap();
      if (currentItems.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (e) {
      toast.error(e.data?.message || "Delete failed");
    } finally {
      setDeleteModalVisible(false);
      setSelectedProduct(null);
    }
  };

  const handleToggleFeatured = async (product) => {
    if (!userId) return toast.error("User not logged in");
    const productId = product.productId;
    setFeaturedLoadingStates((s) => ({ ...s, [productId]: true }));
    try {
      await updateProductFeatured({
        productId,
        isFeatured: !product.isFeatured,
      }).unwrap();
    } catch (e) {
      toast.error(e.data?.message || "Failed");
    } finally {
      setFeaturedLoadingStates((s) => ({ ...s, [productId]: false }));
    }
  };

  // ProductsList.jsx  (only the handler changes)
  const handleAddToCart = async ({ productId, quantity }) => {
    if (!userId) return toast.error("User not logged in");
    if (!quantity || quantity < 1) return toast.error("Invalid quantity");

    const product = products.find((p) => p.productId === productId);
    if (!product) return toast.error("Product not found");

    const sellingPrice = product.metaDetails?.find(
      (m) => m.slug === "sellingPrice"
    )?.value;
    if (!sellingPrice || isNaN(sellingPrice))
      return toast.error("Invalid price");

    setCartLoadingStates((s) => ({ ...s, [productId]: true }));

    const cartItems = cartData?.cart?.items || [];
    const existing = cartItems.find((i) => i.productId === productId);

    try {
      await addProductToCart({
        userId,
        productId,
        quantity, // just the amount user wants to add
      }).unwrap();
      refetchCart();
    } catch (e) {
      toast.error(e.data?.message || "Failed");
    } finally {
      setCartLoadingStates((s) => ({ ...s, [productId]: false }));
    }
  };
  const handleStockClick = (product) => {
    setSelectedProduct(product);
    setStockModalVisible(true);
  };

  const handleHistoryClick = (product) => {
    setSelectedProduct(product);
    setHistoryModalVisible(true);
  };

  const handleStockSubmit = (stockData) => {
    setStockHistoryMap((prev) => ({
      ...prev,
      [selectedProduct.productId]: [
        ...(prev[selectedProduct.productId] || []),
        {
          ...stockData,
          date: new Date(),
          productId: selectedProduct.productId,
        },
      ],
    }));
    setStockModalVisible(false);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleCartClick = () => {
    document.getElementById("cart-modal")?.click();
  };

  const menu = (product) => (
    <Menu>
      <Menu.Item key="view">
        <Link to={`/product/${product.productId}`}>View</Link>
      </Menu.Item>

      <PermissionGate api="edit" module="products">
        <Menu.Item key="edit">
          <Link to={`/product/${product.productId}/edit`}>Edit</Link>
        </Menu.Item>
      </PermissionGate>

      <Menu.Item key="manage-stock" onClick={() => handleStockClick(product)}>
        Manage Stock
      </Menu.Item>

      <Menu.Item key="view-history" onClick={() => handleHistoryClick(product)}>
        View History
      </Menu.Item>

      <PermissionGate api="delete" module="products">
        <Menu.Item key="delete" onClick={() => handleDeleteClick(product)}>
          Delete
        </Menu.Item>
      </PermissionGate>
    </Menu>
  );

  // ──────────────────────────────────────────────────────
  // TABLE COLUMNS (with PermissionGate)
  // ──────────────────────────────────────────────────────
  const columns = [
    {
      title: "Image",
      dataIndex: "images",
      key: "images",
      render: (images) => {
        const parsed = parseImages(images);
        return (
          <img
            src={parsed[0] || pos}
            alt="Product"
            style={{ width: 50, height: 50, objectFit: "cover" }}
          />
        );
      },
      width: 80,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Link to={`/product/${record.productId}`}>{text || "N/A"}</Link>
      ),
    },
    {
      title: "Product Code",
      dataIndex: "company_code",
      key: "company_code",
    },
    {
      title: "Brand",
      dataIndex: "brandId",
      key: "brand",
      render: (brandId) => getBrandsName(brandId),
    },
    {
      title: "Price",
      dataIndex: "meta",
      key: "price",
      render: (_, record) => formatPrice(record.meta, record.metaDetails),
    },
    {
      title: "Stock",
      dataIndex: "quantity",
      key: "quantity",
      render: (qty) => (qty > 0 ? `${qty} in stock` : "Out of Stock"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const sellingPriceEntry = Array.isArray(record.metaDetails)
          ? record.metaDetails.find((d) => d.slug === "sellingPrice")
          : null;
        const price = sellingPriceEntry
          ? parseFloat(sellingPriceEntry.value)
          : null;

        return (
          <div style={{ display: "flex", gap: 8 }}>
            {/* ADD TO CART */}
            <PermissionGate api="write" module="cart">
              <Tooltip
                title={
                  record.quantity <= 0
                    ? "Out of stock"
                    : !price || isNaN(price)
                    ? "Invalid price"
                    : "Add to cart"
                }
              >
                <Button
                  className="cart-button"
                  icon={
                    cartLoadingStates[record.productId] ? (
                      <Spin size="small" />
                    ) : (
                      <ShoppingCartOutlined />
                    )
                  }
                  onClick={() =>
                    handleAddToCart({
                      productId: record.productId,
                      quantity: 1, // ← Explicitly add 1
                    })
                  }
                  disabled={
                    cartLoadingStates[record.productId] ||
                    record.quantity <= 0 ||
                    !price ||
                    isNaN(price)
                  }
                >
                  Add to Cart
                </Button>
              </Tooltip>
            </PermissionGate>

            {/* THREE-DOT MENU */}
            <PermissionGate api="edit|delete" module="products">
              <Dropdown overlay={menu(record)} trigger={["click"]}>
                <Button type="text" icon={<MoreOutlined />} />
              </Dropdown>
            </PermissionGate>
          </div>
        );
      },
    },
  ];

  // ──────────────────────────────────────────────────────
  // BREADCRUMB
  // ──────────────────────────────────────────────────────
  const breadcrumbItems = brandId
    ? [
        { label: "Home", url: "/" },
        { label: "Brands", url: "/category-selector" },
        { label: "Products" },
      ]
    : bpcId
    ? [
        { label: "Home", url: "/" },
        { label: "Categories", url: "/category-selector" },
        {
          label: bpcData?.name || "Category",
          url: `/brand-parent-categories/${bpcId}`,
        },
        { label: "Products" },
      ]
    : [{ label: "Home", url: "/" }, { label: "Products" }];

  // ──────────────────────────────────────────────────────
  // LOADING / ERROR
  // ──────────────────────────────────────────────────────
  if (isLoading || userLoading || categoriesLoading) {
    return (
      <div className="loading-container text-center py-5">
        <Spin size="large" />
        <p>Loading products...</p>
      </div>
    );
  }

  if (error || categoriesError) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="error-container text-center py-5">
            <Empty
              description={`Error: ${
                error?.data?.message ||
                categoriesError?.data?.message ||
                "Unknown error"
              }`}
            />
          </div>
        </div>
      </div>
    );
  }

  const pageTitle = brandId
    ? "Products"
    : bpcId
    ? `Products in ${bpcData?.name || "Category"}`
    : "All Products";

  // ──────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────
  return (
    <div className="page-wrapper">
      <div className="content">
        <Breadcrumb items={breadcrumbItems} />
        <PageHeader
          title={pageTitle}
          subtitle="Explore our latest collection"
          tableData={formattedTableData}
          extra={{
            viewMode,
            onViewToggle: (checked) => setViewMode(checked ? "card" : "list"),
            showViewToggle: true,
            cartItems: cartData?.cart?.items || [],
            onCartClick: handleCartClick,
          }}
          exportOptions={{ pdf: false, excel: false }}
        />

        <div className="filter-bar bg-white p-3 shadow-sm">
          <Form layout="inline" form={form} className="filter-form">
            <Form.Item className="filter-item">
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search products..."
                allowClear
                size="large"
                onChange={handleSearchChange}
              />
            </Form.Item>

            {/* ── NEW CATEGORY DROPDOWN ── */}
            <Form.Item className="filter-item">
              <Select
                style={{ width: 220 }}
                placeholder="Filter by category"
                allowClear
                size="large"
                options={categoryOptions}
                onChange={(value) => {
                  setSelectedCategoryId(value || null);
                  setCurrentPage(1);
                }}
                value={selectedCategoryId}
                // ADD THESE PROPS BELOW
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                optionFilterProp="label"
              />
            </Form.Item>
          </Form>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="empty-container text-center py-5">
            <Empty
              description={
                brandId
                  ? `No products found for brand ${getBrandsName(brandId)}.`
                  : bpcId
                  ? `No products found for category ${
                      bpcData?.name || "this category"
                    }.`
                  : "No products available."
              }
            />
          </div>
        ) : viewMode === "card" ? (
          <div className="products-section">
            <div
              className="card-view-container"
              style={{
                background: "#fff",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #f0f0f0",
                padding: "16px",
              }}
            >
              <div
                className="products-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                {currentItems.map((product) => (
                  <ProductCard
                    key={product.productId}
                    product={product}
                    getBrandsName={getBrandsName}
                    getCategoryName={getCategoryName}
                    handleAddToCart={handleAddToCart}
                    cartLoadingStates={cartLoadingStates}
                    menu={menu}
                  />
                ))}
              </div>

              {/* Unified Pagination */}
              <div
                style={{
                  paddingTop: "16px",
                  borderTop: "1px solid #f0f0f0",
                  backgroundColor: "#fafafa",
                  borderRadius: "0 0 8px 8px",
                  margin: "0 -16px -16px -16px",
                  padding: "16px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ color: "#666", fontSize: "14px" }}>
                  Showing {offset + 1}–
                  {Math.min(offset + itemsPerPage, filteredProducts.length)} of{" "}
                  {filteredProducts.length}
                </div>

                <Pagination
                  current={currentPage}
                  total={filteredProducts.length}
                  pageSize={itemsPerPage}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                  showQuickJumper
                  size="default"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="products-section">
            <div
              className="table-container"
              style={{
                background: "#fff",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                overflow: "hidden",
                border: "1px solid #f0f0f0",
              }}
            >
              {/* TABLE */}
              <Table
                columns={columns}
                dataSource={currentItems}
                rowKey="productId"
                pagination={false}
                scroll={{ x: true }}
                style={{ borderBottom: "none" }}
              />

              {/* PAGINATION - INSIDE container */}
              <div
                style={{
                  padding: "16px 24px",
                  borderTop: "1px solid #f0f0f0",
                  backgroundColor: "#fafafa",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                {/* Optional: Show item count */}
                <div style={{ color: "#666", fontSize: "14px" }}>
                  Showing {offset + 1}–
                  {Math.min(offset + itemsPerPage, filteredProducts.length)} of{" "}
                  {filteredProducts.length} products
                </div>

                {/* Pagination */}
                <Pagination
                  current={currentPage}
                  total={filteredProducts.length}
                  pageSize={itemsPerPage}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                  showQuickJumper
                  size="default"
                  style={{ margin: 0 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden modal trigger */}
      <button
        id="cart-modal"
        data-bs-toggle="modal"
        data-bs-target="#cartModal"
        style={{ display: "none" }}
      />

      {/* Modals */}
      <DeleteModal
        isVisible={isDeleteModalVisible}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSelectedProduct(null);
        }}
        item={selectedProduct}
        itemType="Product"
        isLoading={isDeleting}
      />
      {isStockModalVisible && selectedProduct && (
        <StockModal
          show={isStockModalVisible}
          onHide={() => setStockModalVisible(false)}
          product={selectedProduct}
          onSubmit={handleStockSubmit}
        />
      )}
      {isHistoryModalVisible && selectedProduct && (
        <HistoryModal
          show={isHistoryModalVisible}
          onHide={() => setHistoryModalVisible(false)}
          product={selectedProduct}
          stockHistory={stockHistoryMap[selectedProduct.productId] || []}
        />
      )}
    </div>
  );
};

export default ProductsList;
