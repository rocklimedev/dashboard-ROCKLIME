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
import { useGetBrandParentCategoryByIdQuery } from "../../api/brandParentCategoryApi";
import {
  useAddProductToCartMutation,
  useGetCartQuery,
} from "../../api/cartApi";
import { useGetProfileQuery } from "../../api/userApi";
import { message } from "antd";
import "./productdetails.css";

import DeleteModal from "../Common/DeleteModal";
import StockModal from "../Common/StockModal"; // ← NEW ANT DESIGN
import HistoryModalAntD from "../Common/HistoryModalAntD"; // ← NEW ANT DESIGN (real MySQL)
import ProductCard from "./ProductCard";
import PageHeader from "../Common/PageHeader";
import Breadcrumb from "./Breadcrumb";
import pos from "../../assets/img/default.png";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import PermissionGate from "../../context/PermissionGate";

const ProductsList = () => {
  const { id: brandId, bpcId } = useParams();
  const navigate = useNavigate();

  // DATA HOOKS
  const { data: productsData, error, isLoading } = useGetAllProductsQuery();
  const { data: brandsData } = useGetAllBrandsQuery();
  const { data: bpcData } = useGetBrandParentCategoryByIdQuery(bpcId, {
    skip: !bpcId,
  });
  const { data: categoriesData, isLoading: categoriesLoading } =
    useGetAllCategoriesQuery();
  const { data: user, isLoading: userLoading } = useGetProfileQuery();

  const userId = user?.user?.userId;
  const { data: cartData, refetch: refetchCart } = useGetCartQuery(userId, {
    skip: !userId,
  });

  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [addProductToCart] = useAddProductToCartMutation();

  // STATE
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // NEW MODAL STATES (Ant Design uses `open`)
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [stockAction, setStockAction] = useState("add"); // "add" or "remove"

  const [search, setSearch] = useState("");
  const [form] = Form.useForm();
  const itemsPerPage = 50;

  // HELPERS
  const getBrandsName = (brandId) => {
    return brandId
      ? brandsData?.find((b) => b.id === brandId)?.brandName || "Not Branded"
      : "Not Branded";
  };

  const getCategoryName = (categoryId) => {
    return categoryId
      ? categoriesData?.categories?.find((c) => c.categoryId === categoryId)
          ?.name || "Uncategorized"
      : "Uncategorized";
  };

  const getCompanyCode = (metaDetails) => {
    if (!Array.isArray(metaDetails)) return "N/A";
    const entry = metaDetails.find(
      (d) => d.slug?.toLowerCase() === "companycode"
    );
    return entry ? String(entry.value) : "N/A";
  };

  const formatPrice = (value, unit) => {
    if (Array.isArray(unit)) {
      const sellingPriceEntry = unit.find(
        (detail) => detail.slug?.toLowerCase() === "sellingprice"
      );
      if (sellingPriceEntry) {
        const cleaned = String(sellingPriceEntry.value).replace(/[^0-9.]/g, "");
        const price = parseFloat(cleaned);
        return !isNaN(price) ? `₹ ${price.toFixed(2)}` : "N/A";
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

  // FILTERED DATA
  const products = useMemo(
    () => (Array.isArray(productsData) ? productsData : []),
    [productsData]
  );

  const categoryOptions = useMemo(() => {
    const allCategories = categoriesData?.categories ?? [];
    const relevantProducts = products.filter((p) => {
      if (brandId) return String(p.brandId) === String(brandId);
      if (bpcId) return String(p.brand_parentcategoriesId) === String(bpcId);
      return true;
    });
    const usedCategoryIds = new Set(
      relevantProducts.map((p) => p.categoryId).filter(Boolean)
    );
    const filtered = allCategories.filter((c) =>
      usedCategoryIds.has(c.categoryId || c.id)
    );
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    return [
      { label: "All Categories", value: "" },
      ...filtered.map((c) => ({ label: c.name, value: c.categoryId || c.id })),
    ];
  }, [categoriesData, products, brandId, bpcId]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesFilter = brandId
        ? String(product.brandId) === String(brandId)
        : bpcId
        ? String(product.brand_parentcategoriesId) === String(bpcId)
        : true;

      const matchesCategory = selectedCategoryId
        ? String(product.categoryId) === selectedCategoryId
        : true;

      const term = search.toLowerCase();
      const code = getCompanyCode(product.metaDetails);
      const matchesSearch =
        !term ||
        [
          product.name,
          product.product_code,
          code,
          getCategoryName(product.categoryId),
        ].some((field) => field?.toLowerCase().includes(term));

      return matchesFilter && matchesCategory && matchesSearch;
    });
  }, [products, brandId, bpcId, selectedCategoryId, search, categoriesData]);

  const offset = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredProducts.slice(offset, offset + itemsPerPage);

  // HANDLERS
  const openStockModal = (product, action = "add") => {
    setSelectedProduct(product);
    setStockAction(action);
    setStockModalOpen(true);
  };

  const openHistoryModal = (product) => {
    setSelectedProduct(product);
    setHistoryModalOpen(true);
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct?.productId) return;
    try {
      await deleteProduct(selectedProduct.productId).unwrap();
      message.success("Product deleted");
      if (currentItems.length === 1 && currentPage > 1)
        setCurrentPage((prev) => prev - 1);
    } catch (e) {
      message.error(e.data?.message || "Delete failed");
    } finally {
      setDeleteModalVisible(false);
      setSelectedProduct(null);
    }
  };

  const handleAddToCart = async ({ productId, quantity = 1 }) => {
    if (!userId) return message.error("Login required");
    try {
      await addProductToCart({ userId, productId, quantity }).unwrap();
      refetchCart();
      message.success("Added to cart");
    } catch (e) {
      message.error(e.data?.message || "Failed to add");
    }
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
      <Menu.Item key="add-stock" onClick={() => openStockModal(product, "add")}>
        Add Stock
      </Menu.Item>
      <Menu.Item
        key="remove-stock"
        onClick={() => openStockModal(product, "remove")}
      >
        Remove Stock
      </Menu.Item>
      <Menu.Item key="history" onClick={() => openHistoryModal(product)}>
        View History
      </Menu.Item>
      <PermissionGate api="delete" module="products">
        <Menu.Item
          key="delete"
          danger
          onClick={() => handleDeleteClick(product)}
        >
          Delete
        </Menu.Item>
      </PermissionGate>
    </Menu>
  );

  const columns = [
    {
      title: "Image",
      dataIndex: "images",
      render: (imgs) => (
        <img
          src={parseImages(imgs)[0] || pos}
          alt=""
          style={{ width: 50, height: 50, objectFit: "cover" }}
        />
      ),
      width: 80,
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (t, r) => (
        <Link to={`/product/${r.productId}`}>{t || "N/A"}</Link>
      ),
    },
    { title: "Code", dataIndex: "metaDetails", render: getCompanyCode },
    { title: "Brand", dataIndex: "brandId", render: getBrandsName },
    { title: "Price", render: (_, r) => formatPrice(r.meta, r.metaDetails) },
    {
      title: "Stock",
      dataIndex: "quantity",
      render: (q) => (q > 0 ? `${q} in stock` : "Out of Stock"),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <PermissionGate api="write" module="cart">
            <Tooltip
              title={record.quantity <= 0 ? "Out of stock" : "Add to cart"}
            >
              <Button
                icon={<ShoppingCartOutlined />}
                onClick={() =>
                  handleAddToCart({ productId: record.productId, quantity: 1 })
                }
                disabled={record.quantity <= 0}
              >
                Add
              </Button>
            </Tooltip>
          </PermissionGate>
          <PermissionGate api="edit|delete" module="products">
            <Dropdown overlay={menu(record)} trigger={["click"]}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </PermissionGate>
        </div>
      ),
    },
  ];

  if (isLoading || userLoading || categoriesLoading) {
    return (
      <div className="loading-container text-center py-5">
        <Spin size="large" />
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Empty description="Failed to load products" />
        </div>
      </div>
    );
  }

  const pageTitle = brandId
    ? "Products"
    : bpcId
    ? `Products in ${bpcData?.name || "Category"}`
    : "All Products";

  return (
    <div className="page-wrapper">
      <div className="content">
        <Breadcrumb
          items={[
            { label: "Home", url: "/" },
            brandId
              ? { label: "Brands", url: "/category-selector" }
              : bpcId
              ? { label: "Categories", url: "/category-selector" }
              : null,
            { label: pageTitle },
          ].filter(Boolean)}
        />

        <PageHeader
          title={pageTitle}
          subtitle="Explore our latest collection"
          extra={{
            viewMode,
            onViewToggle: (checked) => setViewMode(checked ? "card" : "list"),
            showViewToggle: true,
          }}
        />

        <div className="filter-bar bg-white p-3 shadow-sm">
          <Form layout="inline" form={form}>
            <Form.Item>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search products..."
                allowClear
                size="large"
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </Form.Item>
            <Form.Item>
              <Select
                style={{ width: 220 }}
                placeholder="Filter by category"
                allowClear
                size="large"
                options={categoryOptions}
                onChange={(v) => {
                  setSelectedCategoryId(v || null);
                  setCurrentPage(1);
                }}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Form>
        </div>

        {filteredProducts.length === 0 ? (
          <Empty description="No products found" />
        ) : viewMode === "card" ? (
          // Your existing card view (unchanged)
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
                borderRadius: 8,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #f0f0f0",
                overflow: "hidden",
              }}
            >
              <Table
                columns={columns}
                dataSource={currentItems}
                rowKey="productId"
                pagination={false}
                scroll={{ x: true }}
              />
              <div
                style={{
                  padding: "16px 24px",
                  borderTop: "1px solid #f0f0f0",
                  background: "#fafafa",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ color: "#666" }}>
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
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NEW ANT DESIGN MODALS */}
      <StockModal
        open={stockModalOpen}
        onCancel={() => setStockModalOpen(false)}
        product={selectedProduct}
        action={stockAction}
      />

      <HistoryModalAntD
        open={historyModalOpen}
        onCancel={() => setHistoryModalOpen(false)}
        product={selectedProduct}
      />

      <DeleteModal
        isVisible={isDeleteModalVisible}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        item={selectedProduct}
        itemType="Product"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ProductsList;
