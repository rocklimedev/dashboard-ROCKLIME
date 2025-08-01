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
  HeartOutlined,
  HeartFilled,
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
import DeleteModal from "../Common/DeleteModal";
import HistoryModal from "../Common/HistoryModal";
import StockModal from "../Common/StockModal";
import ProductCard from "./ProductCard";
import PageHeader from "../Common/PageHeader";
import pos from "../../assets/img/default.png";

const ProductsList = () => {
  const { id: brandId, bpcId } = useParams();
  const navigate = useNavigate();
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
  const { data: cartData } = useGetCartQuery();
  const { data: user, isLoading: userLoading } = useGetProfileQuery();
  const [updateProductFeatured, { isLoading: isUpdatingFeatured }] =
    useUpdateProductFeaturedMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [addProductToCart, { isLoading: mutationLoading }] =
    useAddProductToCartMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

  const userId = user?.user?.userId;
  const [viewMode, setViewMode] = useState("list"); // Changed default to "list"
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

  const formatPrice = (price) => {
    return price !== null && !isNaN(Number(price))
      ? `₹${Number(price).toFixed(2)}`
      : "N/A";
  };

  const products = useMemo(
    () => (Array.isArray(productsData) ? productsData : []),
    [productsData]
  );
  const brands = useMemo(
    () => (Array.isArray(brandsData) ? brandsData : []),
    [brandsData]
  );
  const customers = useMemo(
    () => (Array.isArray(customersData?.data) ? customersData.data : []),
    [customersData]
  );
  const cartItems = useMemo(
    () => (Array.isArray(cartData?.items) ? cartData.items : []),
    [cartData]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesFilter = brandId
        ? String(product.brandId) === String(brandId)
        : bpcId
        ? String(product.categoryId) === String(bpcId)
        : true;
      const searchTerm = search.toLowerCase();
      return (
        matchesFilter &&
        (!searchTerm ||
          product.name?.toLowerCase().includes(searchTerm) ||
          product.product_code?.toLowerCase().includes(searchTerm) ||
          product.company_code?.toLowerCase().includes(searchTerm))
      );
    });
  }, [products, brandId, bpcId, search]);

  const formattedTableData = useMemo(
    () =>
      filteredProducts.map((product) => ({
        Name: product.name || "N/A",
        Brand: getBrandsName(product.brandId),
        Price: formatPrice(product.sellingPrice),
        Stock:
          product.quantity > 0
            ? `${product.quantity} in stock`
            : "Out of Stock",
        Featured: product.isFeatured ? "Yes" : "No",
      })),
    [filteredProducts, getBrandsName, formatPrice]
  );

  const offset = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredProducts.slice(offset, offset + itemsPerPage);

  const handleAddProduct = () => navigate("/inventory/product/add");
  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct?.productId) {
      toast.error("No product selected for deletion");
      setDeleteModalVisible(false);
      return;
    }
    try {
      await deleteProduct(selectedProduct.productId).unwrap();
      toast.success("Product deleted successfully!");
      if (currentItems.length === 1 && currentPage > 1)
        setCurrentPage(currentPage - 1);
    } catch (error) {
      toast.error(
        `Failed to delete product: ${error.data?.message || "Unknown error"}`
      );
    } finally {
      setDeleteModalVisible(false);
      setSelectedProduct(null);
    }
  };

  const handleToggleFeatured = async (product) => {
    if (!userId) {
      toast.error("User not logged in!");
      return;
    }
    const productId = product.productId;
    setFeaturedLoadingStates((prev) => ({ ...prev, [productId]: true }));
    try {
      await updateProductFeatured({
        productId,
        isFeatured: !product.isFeatured,
      }).unwrap();
      toast.success(
        !product.isFeatured
          ? `${product.name} marked as featured!`
          : `${product.name} unmarked as featured!`
      );
    } catch (error) {
      toast.error(
        `Failed to update featured status: ${
          error.data?.message || "Unknown error"
        }`
      );
    } finally {
      setFeaturedLoadingStates((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleAddToCart = async (product) => {
    if (!userId) {
      toast.error("User not logged in!");
      return;
    }
    const productId = product.productId;
    setCartLoadingStates((prev) => ({ ...prev, [productId]: true }));
    try {
      await addProductToCart({
        userId,
        productId,
        quantity: product.quantity || 1,
      }).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error(`Error: ${error.data?.message || "Unknown error"}`);
    } finally {
      setCartLoadingStates((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleRemoveFromCart = async (productId) => {
    try {
      await removeFromCart({ userId, productId }).unwrap();
      toast.success("Item removed from cart!");
    } catch (error) {
      toast.error(
        `Failed to remove from cart: ${error.data?.message || "Unknown error"}`
      );
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
    setStockHistoryMap((prev) => {
      const productId = selectedProduct.productId;
      return {
        ...prev,
        [productId]: [
          ...(prev[productId] || []),
          { ...stockData, date: new Date(), productId },
        ],
      };
    });
    setStockModalVisible(false);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleCartClick = () => {
    document.getElementById("cart-modal").click();
  };

  const menu = (product) => (
    <Menu>
      <Menu.Item key="view">
        <Link to={`/product/${product.productId}`}>View</Link>
      </Menu.Item>
      <Menu.Item key="edit">
        <Link to={`/product/${product.productId}/edit`}>Edit</Link>
      </Menu.Item>
      <Menu.Item key="manage-stock" onClick={() => handleStockClick(product)}>
        Manage Stock
      </Menu.Item>
      <Menu.Item key="view-history" onClick={() => handleHistoryClick(product)}>
        View History
      </Menu.Item>
      <Menu.Item key="delete" onClick={() => handleDeleteClick(product)}>
        Delete
      </Menu.Item>
    </Menu>
  );

  const columns = [
    {
      title: "Image",
      dataIndex: "images",
      key: "images",
      render: (images) => (
        <img
          src={images?.[0] || pos}
          alt="Product"
          style={{ width: 50, height: 50, objectFit: "cover" }}
        />
      ),
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
      title: "Brand",
      dataIndex: "brandId",
      key: "brand",
      render: (brandId) => getBrandsName(brandId),
    },
    {
      title: "Price",
      dataIndex: "sellingPrice",
      key: "sellingPrice",
      render: (price) => formatPrice(price),
    },
    {
      title: "Stock",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity) =>
        quantity > 0 ? `${quantity} in stock` : "Out of Stock",
    },

    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Tooltip title={record.quantity <= 0 ? "Out of stock" : ""}>
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
                (record.quantity ?? 0) <= 0
              }
            >
              Add to Cart
            </Button>
          </Tooltip>
          <Dropdown overlay={menu(record)} trigger={["click"]}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </div>
      ),
    },
  ];

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
      <div className="error-container text-center py-5">
        <Empty
          description={`Error: ${
            error?.data?.message ||
            categoriesError?.data?.message ||
            "Unknown error"
          }`}
        />
      </div>
    );
  }

  const pageTitle = brandId
    ? `Product`
    : bpcId
    ? `Products in ${bpcData?.name || "Category"}`
    : "All Products";

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title={pageTitle}
          subtitle="Explore our latest collection"
          onAdd={handleAddProduct}
          tableData={formattedTableData}
          extra={{
            viewMode,
            onViewToggle: (checked) => setViewMode(checked ? "card" : "list"), // Adjusted for list as default
            showViewToggle: true,
            cartItems,
            onCartClick: handleCartClick, // Added cart click handler
          }}
          exportOptions={{ pdf: false, excel: false }}
        />
        <div className="filter-bar sticky-top bg-white p-3 shadow-sm">
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
            <div className="products-grid">
              {currentItems.map((product) => (
                <ProductCard
                  key={product.productId}
                  product={product}
                  getBrandsName={getBrandsName}
                  getCategoryName={getCategoryName}
                  formatPrice={formatPrice}
                  handleAddToCart={handleAddToCart}
                  cartLoadingStates={cartLoadingStates}
                  featuredLoadingStates={featuredLoadingStates}
                  menu={menu}
                />
              ))}
            </div>
            <div
              className="pagination-container"
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
                onChange={(page) => setCurrentPage(page)}
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
              className="pagination-container"
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
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                showQuickJumper
                size="small"
              />
            </div>
          </div>
        )}
      </div>
      <button
        id="cart-modal"
        data-bs-toggle="modal"
        data-bs-target="#cartModal"
        style={{ display: "none" }}
      ></button>
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
