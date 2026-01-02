import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Form,
  Input,
  Empty,
  Table,
  Button,
  Tooltip,
  Dropdown,
  Menu,
  Spin,
  Pagination,
} from "antd";
import {
  SearchOutlined,
  ShoppingCartOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import {
  useGetAllProductsQuery,
  useGetAllProductsByCategoryQuery,
  useGetProductsByBrandQuery,
  useDeleteProductMutation,
} from "../../api/productApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetBrandParentCategoryByIdQuery } from "../../api/brandParentCategoryApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetProfileQuery } from "../../api/userApi";
import {
  useAddProductToCartMutation,
  useGetCartQuery,
} from "../../api/cartApi";
import { message } from "antd";
import "./productdetails.css";
import DeleteModal from "../Common/DeleteModal";
import HistoryModalAntD from "../Common/HistoryModal";
import StockModal from "../Common/StockModal";
import ProductCard from "./ProductCard";
import PageHeader from "../Common/PageHeader";
import Breadcrumb from "./Breadcrumb";
import pos from "../../assets/img/default.png";
import PermissionGate from "../../context/PermissionGate";

// ────────────────────────────────────────────────
//   META UUIDS – keep in sync with backend / fix script
// ────────────────────────────────────────────────
const META_KEYS = {
  SELLING_PRICE: "9ba862ef-f993-4873-95ef-1fef10036aa5",
  MODEL_CODE: "d11da9f9-3f2e-4536-8236-9671200cca4a",
};

const ProductsList = () => {
  const { id, bpcId } = useParams();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("list");
  const [cartLoadingStates, setCartLoadingStates] = useState({});
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [stockAction, setStockAction] = useState("add");

  const pageSize = 50;

  const isBrandView = !!id && !bpcId;
  const isBpcView = !!bpcId;
  const isCategoryView = !!id && !isBrandView && !isBpcView;

  // ── Queries ───────────────────────────────────────
  const brandQuery = useGetProductsByBrandQuery(
    {
      brandId: id || "",
      page: currentPage,
      limit: pageSize,
      search: search.trim() || undefined,
    },
    { skip: !isBrandView || !id }
  );

  const categoryQuery = useGetAllProductsByCategoryQuery(
    {
      categoryId: id || "",
      page: currentPage,
      limit: pageSize,
      search: search.trim() || undefined,
    },
    { skip: !isCategoryView || !id }
  );

  const allProductsQuery = useGetAllProductsQuery(
    {
      page: currentPage,
      limit: pageSize,
      search: search.trim() || undefined,
    },
    { skip: isBrandView || isCategoryView }
  );

  const queryResult = isBrandView
    ? brandQuery
    : isCategoryView
    ? categoryQuery
    : allProductsQuery;

  const { data: productsResponse, isLoading, isFetching, error } = queryResult;

  const products = productsResponse?.data || [];
  const pagination = productsResponse?.pagination || {
    total: 0,
    page: currentPage,
    limit: pageSize,
    totalPages: 0,
  };

  const { data: brandsData } = useGetAllBrandsQuery();
  const { data: bpcData } = useGetBrandParentCategoryByIdQuery(bpcId, {
    skip: !bpcId,
  });
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: user } = useGetProfileQuery();
  const userId = user?.user?.userId;
  const { data: cartData, refetch: refetchCart } = useGetCartQuery(userId, {
    skip: !userId,
  });

  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [addProductToCart] = useAddProductToCartMutation();

  // ── Helpers ───────────────────────────────────────
  const getBrandsName = (brandId) =>
    brandsData?.find((b) => b.id === brandId)?.brandName || "Not Branded";

  const getCategoryName = (categoryId) =>
    categoriesData?.categories?.find((c) => c.categoryId === categoryId)
      ?.name || "Uncategorized";

  const parseImages = (images) => {
    try {
      if (typeof images === "string") return JSON.parse(images);
      if (Array.isArray(images)) return images;
      return [pos];
    } catch {
      return [pos];
    }
  };

  const getPrice = (product) => {
    const meta = product?.meta || {};
    const rawPrice = meta[META_KEYS.SELLING_PRICE];

    if (!rawPrice) return "N/A";

    const price = parseFloat(rawPrice);
    return isNaN(price) ? "N/A" : `₹ ${price.toFixed(2)}`;
  };

  const getCompanyCode = (product) => {
    const meta = product?.meta || {};
    const code = meta[META_KEYS.MODEL_CODE];

    if (!code) return "N/A";

    // Clean & return – adjust trimming/formatting if needed
    return String(code).trim() || "N/A";
  };

  const handleAddToCart = async (product) => {
    if (!userId) return message.error("Please log in");

    const price = getPrice(product);
    if (price === "N/A") return message.error("Price not available");

    setCartLoadingStates((prev) => ({ ...prev, [product.productId]: true }));

    try {
      await addProductToCart({
        userId,
        productId: product.productId,
        quantity: 1,
      }).unwrap();

      message.success("Added to cart");
      refetchCart();
    } catch (err) {
      message.error(err?.data?.message || "Failed to add to cart");
    } finally {
      setCartLoadingStates((prev) => ({ ...prev, [product.productId]: false }));
    }
  };

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
    } catch (err) {
      message.error(err?.data?.message || "Delete failed");
    } finally {
      setDeleteModalVisible(false);
      setSelectedProduct(null);
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
          danger
          key="delete"
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
      key: "images",
      render: (images) => (
        <img
          src={parseImages(images)[0] || pos}
          alt="Product"
          style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4 }}
        />
      ),
      width: 80,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Link to={`/product/${record.productId}`}>
          {text || "Unnamed product"}
        </Link>
      ),
    },
    {
      title: "Product Code",
      key: "product_code",
      render: (_, record) => getCompanyCode(record),
    },
    {
      title: "Brand",
      dataIndex: "brandId",
      key: "brand",
      render: (brandId) => getBrandsName(brandId),
    },
    {
      title: "Price",
      key: "price",
      render: (_, record) => getPrice(record),
    },
    {
      title: "Stock",
      dataIndex: "quantity",
      key: "quantity",
      render: (qty) =>
        qty > 0 ? (
          `${qty} in stock`
        ) : (
          <span style={{ color: "#ff4d4f" }}>Out of stock</span>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const price = getPrice(record);
        const priceValid = price !== "N/A";

        return (
          <div style={{ display: "flex", gap: 8 }}>
            <PermissionGate api="write" module="cart">
              <Tooltip
                title={
                  record.quantity <= 0
                    ? "Out of stock"
                    : !priceValid
                    ? "Price not available"
                    : "Add to cart"
                }
              >
                <Button
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
                    !priceValid
                  }
                >
                  Add to Cart
                </Button>
              </Tooltip>
            </PermissionGate>

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

  // ── Title & Breadcrumbs ───────────────────────────
  const pageTitle = isBrandView
    ? getBrandsName(id)
    : isBpcView
    ? bpcData?.name || "Category Group"
    : isCategoryView
    ? getCategoryName(id)
    : "All Products";

  const breadcrumbItems = isBrandView
    ? [
        { label: "Home", url: "/" },
        { label: "Brands", url: "/category-selector" },
        { label: pageTitle },
      ]
    : isBpcView
    ? [
        { label: "Home", url: "/" },
        { label: "Categories", url: "/category-selector" },
        { label: pageTitle },
      ]
    : isCategoryView
    ? [
        { label: "Home", url: "/" },
        { label: "Categories", url: "/category-selector" },
        { label: pageTitle },
      ]
    : [{ label: "Home", url: "/" }, { label: "Products" }];

  return (
    <div className="page-wrapper">
      <div className="content">
        <Breadcrumb items={breadcrumbItems} />
        <PageHeader
          title={pageTitle}
          subtitle="Explore our product collection"
          exportOptions={{ pdf: false, excel: false }}
          extra={{
            viewMode,
            onViewToggle: (c) => setViewMode(c ? "card" : "list"),
            showViewToggle: true,
            cartItems: cartData?.cart?.items || [],
          }}
        />

        <div className="filter-bar bg-white p-3 shadow-sm mb-4">
          <Form layout="inline">
            <Form.Item>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                allowClear
                size="large"
                style={{ width: 300 }}
              />
            </Form.Item>
          </Form>
        </div>

        {isLoading ? (
          <div className="text-center py-5">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="alert alert-danger">
            Error: {error?.data?.message || "Failed to load products"}
          </div>
        ) : products.length === 0 ? (
          <Empty
            description={
              search ? "No products match your search" : "No products found"
            }
            style={{ margin: "80px 0" }}
          />
        ) : (
          <>
            {viewMode === "card" ? (
              <div
                className="products-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "20px",
                }}
              >
                {products.map((product) => (
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
            ) : (
              <Table
                columns={columns}
                dataSource={products}
                rowKey="productId"
                pagination={false}
                loading={isFetching}
              />
            )}

            <div className="mt-4 d-flex justify-content-between align-items-center">
              <div className="text-muted">
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, pagination.total)} of{" "}
                {pagination.total}
              </div>
              <Pagination
                current={currentPage}
                total={pagination.total}
                pageSize={pageSize}
                onChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                showSizeChanger={false}
              />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <DeleteModal
        isVisible={isDeleteModalVisible}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        item={selectedProduct}
        itemType="Product"
        isLoading={isDeleting}
      />
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
    </div>
  );
};

export default ProductsList;
