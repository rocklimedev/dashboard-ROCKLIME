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
import DeleteModal from "../Common/DeleteModal";
import HistoryModal from "../Common/HistoryModal";
import StockModal from "../Common/StockModal";
import ProductCard from "./ProductCard";
import PageHeader from "../Common/PageHeader";
import Breadcrumb from "./Breadcrumb"; // Adjust the path as needed
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
  const { data: user, isLoading: userLoading } = useGetProfileQuery();
  const userId = user?.user?.userId;
  const { data: cartData } = useGetCartQuery(userId, { skip: !userId });
  const [updateProductFeatured, { isLoading: isUpdatingFeatured }] =
    useUpdateProductFeaturedMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [addProductToCart, { isLoading: mutationLoading }] =
    useAddProductToCartMutation();
  const [removeFromCart] = useRemoveFromCartMutation();

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
      const sellingPriceEntry = metaDetails?.find(
        (detail) => detail.slug?.toLowerCase() === "sellingprice"
      );
      if (sellingPriceEntry && typeof sellingPriceEntry.value !== "undefined") {
        const cleanedValue = String(sellingPriceEntry.value).replace(
          /[^0-9.]/g,
          ""
        );
        const price = parseFloat(cleanedValue);
        return price !== null && !isNaN(price)
          ? `₹ ${price.toFixed(2)}`
          : "N/A";
      }
      return "N/A";
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
    } catch (error) {
      return [pos];
    }
  };

  const getCompanyCode = (metaDetails) => {
    if (!Array.isArray(metaDetails)) {
      console.warn("metaDetails is not an array:", metaDetails);
      return "N/A";
    }
    const companyCodeEntry = metaDetails.find(
      (detail) => detail.slug?.toLowerCase() === "companycode"
    );
    return companyCodeEntry ? String(companyCodeEntry.value) : "N/A";
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
    () => (Array.isArray(cartData?.cart?.items) ? cartData.cart.items : []),
    [cartData]
  );

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesFilter = brandId
        ? String(product.brandId) === String(brandId)
        : bpcId
        ? String(product.brand_parentcategoriesId) === String(bpcId)
        : true;
      const searchTerm = search.toLowerCase();
      const companyCode = getCompanyCode(product.metaDetails);
      return (
        matchesFilter &&
        (!searchTerm ||
          product.name?.toLowerCase().includes(searchTerm) ||
          product.product_code?.toLowerCase().includes(searchTerm) ||
          companyCode?.toLowerCase().includes(searchTerm))
      );
    });

    return filtered;
  }, [products, brandId, bpcId, search]);

  const formattedTableData = useMemo(
    () =>
      filteredProducts.map((product) => {
        const companyCode = getCompanyCode(product.metaDetails);

        return {
          ...product,
          Name: product.name || "N/A",
          Brand: getBrandsName(product.brandId),
          Price: formatPrice(product.meta, product.metaDetails),
          Stock:
            product.quantity > 0
              ? `${product.quantity} in stock`
              : "Out of Stock",
          Featured: product.isFeatured ? "Yes" : "No",
          company_code: companyCode,
        };
      }),
    [filteredProducts, getBrandsName]
  );

  const offset = (currentPage - 1) * itemsPerPage;
  const currentItems = formattedTableData.slice(offset, offset + itemsPerPage);

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

      if (currentItems.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
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

    const productId = product.productId;
    const qtyToAdd = product.quantity; // this is now the quantity from ProductCard

    setCartLoadingStates((prev) => ({ ...prev, [productId]: true }));

    try {
      // Check if already in cart
      const existingItem = cartItems.find((i) => i.productId === productId);
      if (existingItem) {
        // Update existing
        await addProductToCart({
          userId,
          productId,
          quantity: existingItem.quantity + qtyToAdd,
        }).unwrap();
      } else {
        // Add new
        await addProductToCart({
          userId,
          productId,
          quantity: qtyToAdd,
        }).unwrap();
      }
    } catch (error) {
      toast.error(`Error: ${error.data?.message || "Unknown error"}`);
    } finally {
      setCartLoadingStates((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleRemoveFromCart = async (productId) => {
    if (!userId) {
      toast.error("User not logged in!");
      return;
    }
    try {
      await removeFromCart({ userId, productId }).unwrap();
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
      render: (images) => {
        const parsedImages = parseImages(images);
        return (
          <img
            src={parsedImages[0] || pos}
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
      render: (text) => {
        return <p>{text || "N/A"}</p>;
      },
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
      render: (meta, record) => formatPrice(meta, record.metaDetails),
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
      render: (_, record) => {
        const sellingPriceEntry = Array.isArray(record.metaDetails)
          ? record.metaDetails.find((detail) => detail.slug === "sellingPrice")
          : null;
        const sellingPrice = sellingPriceEntry
          ? parseFloat(sellingPriceEntry.value)
          : null;
        return (
          <div style={{ display: "flex", gap: 8 }}>
            <Tooltip
              title={
                record.quantity <= 0
                  ? "Out of stock"
                  : !sellingPrice || isNaN(sellingPrice)
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
                  !sellingPrice ||
                  isNaN(sellingPrice)
                }
              >
                Add to Cart
              </Button>
            </Tooltip>
            <Dropdown overlay={menu(record)} trigger={["click"]}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </div>
        );
      },
    },
  ];

  const breadcrumbItems = brandId
    ? [
        { label: "Home", url: "/" },
        { label: "Brands", url: "/inventory/products" }, // Adjust if there's a specific brands route
        { label: "Products" },
      ]
    : bpcId
    ? [
        { label: "Home", url: "/" },
        { label: "Categories", url: "/inventory/products" },
        {
          label: bpcData?.name || "Category",
          url: `/brand-parent-categories/${bpcId}`,
        },
        { label: "Products" },
      ]
    : [{ label: "Home", url: "/" }, { label: "Products" }];

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
    ? `Products`
    : bpcId
    ? `Products in ${bpcData?.name || "Category"}`
    : "All Products";

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
            cartItems,
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
          <div className="page-wrapper">
            <div className="content">
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
            </div>
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
                  formatPrice={formatPrice}
                  getCompanyCode={getCompanyCode}
                  handleAddToCart={handleAddToCart}
                  handleToggleFeatured={handleToggleFeatured}
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
