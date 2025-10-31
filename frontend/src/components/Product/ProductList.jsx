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
  } = useGetBrandParentCategoriesQuery();
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

  const itemsPerPage = 30;

  // ──────────────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────────────
  const getBrandsName = (brandId) => {
    return brandId
      ? brandsData?.find((b) => b.id === brandId)?.brandName || "Not Branded"
      : "Not Branded";
  };

  const getCategoryName = (categoryId) => {
    return categoryId
      ? categoriesData?.find((c) => c.id === categoryId)?.name ||
          "Uncategorized"
      : "Uncategorized";
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

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesFilter = brandId
        ? String(product.brandId) === String(brandId)
        : bpcId
        ? String(product.brand_parentcategoriesId) === String(bpcId)
        : true;
      const term = search.toLowerCase();
      const code = getCompanyCode(product.metaDetails);
      return (
        matchesFilter &&
        (!term ||
          product.name?.toLowerCase().includes(term) ||
          product.product_code?.toLowerCase().includes(term) ||
          code?.toLowerCase().includes(term))
      );
    });
  }, [products, brandId, bpcId, search]);

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
  const handleAddProduct = () => navigate("/inventory/product/add");

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
      toast.success(`Added ${quantity} item(s) to cart`);
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
                  onClick={() => handleAddToCart(record)}
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
        { label: "Brands", url: "/category-selector/products" },
        { label: "Products" },
      ]
    : bpcId
    ? [
        { label: "Home", url: "/" },
        { label: "Categories", url: "/category-selector/products" },
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
          onAdd={handleAddProduct}
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
              className="products-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "16px",
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

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "16px",
              }}
            >
              <Pagination
                current={currentPage}
                total={filteredProducts.length}
                pageSize={itemsPerPage}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showQuickJumper
                size="small"
              />
            </div>
          </div>
        ) : (
          <div className="products-section">
            <Table
              columns={columns}
              dataSource={currentItems}
              rowKey="productId"
              pagination={false}
              scroll={{ x: true }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "16px",
              }}
            >
              <Pagination
                current={currentPage}
                total={filteredProducts.length}
                pageSize={itemsPerPage}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showQuickJumper
                size="small"
              />
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
