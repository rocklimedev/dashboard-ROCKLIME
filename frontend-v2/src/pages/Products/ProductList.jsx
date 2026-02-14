import React, { useMemo, useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
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
  Select,
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
import DeleteModal from "../../components/Common/DeleteModal";
import HistoryModalAntD from "../../components/Common/HistoryModal";
import StockModal from "../../pages/Inventory/StockModal";
import ProductCard from "../../components/Product/ProductCard";

import PageHeader from "../../components/Common/PageHeader";
import Breadcrumb from "../../components/Product/Breadcrumb";
import pos from "../../assets/img/default.png";
import PermissionGate from "../../context/PermissionGate";
import { debounce } from "lodash"; // Make sure lodash is installed: npm install lodash

// ────────────────────────────────────────────────
//   META UUIDS – keep in sync with backend
// ────────────────────────────────────────────────
const META_KEYS = {
  SELLING_PRICE: "9ba862ef-f993-4873-95ef-1fef10036aa5",
  MODEL_CODE: "d11da9f9-3f2e-4536-8236-9671200cca4a",
  SIZE_FEET: "7e2b4efb-4ff2-4e4d-9b08-82559a7e3cd0", // ← Add this line
};
// Brands that use the sizeFeet meta field and should show the size filter
const BRANDS_WITH_SIZE_FILTER = [
  "50105657-7686-11f0-9e84-52540021303b", // SGT
  "500b10a7-7686-11f0-9e84-52540021303b", // SHIV CERAMIC
  "50106480-7686-11f0-9e84-52540021303b", // JTC
  "50107b22-7686-11f0-9e84-52540021303b", // UW
  "987bb747-773d-11f0-9e84-52540021303b", // SUBWAY
];
const ProductsList = () => {
  const { id, bpcId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Read state from URL ───────────────────────────────
  const currentPage = Number(searchParams.get("page")) || 1;
  const urlSearch = searchParams.get("search")?.trim() || "";
  const priceMin = searchParams.get("minPrice") || "";
  const priceMax = searchParams.get("maxPrice") || "";
  const sortField = searchParams.get("sort") || null;
  const sortOrder = searchParams.get("order") || null;

  const [viewMode, setViewMode] = useState("list");
  const [cartLoadingStates, setCartLoadingStates] = useState({});
  const [localSearch, setLocalSearch] = useState(urlSearch);

  const pageSize = 50;

  const isBrandView = !!id && !bpcId;
  const isBpcView = !!bpcId;
  const isCategoryView = !!id && !isBrandView && !isBpcView;
  // ── Read state from URL ───────────────────────────────
  const urlSizes = searchParams.getAll("size"); // supports multiple ?size=2x2&size=4x2
  const [selectedSizes, setSelectedSizes] = useState(urlSizes);
  const showSizeFilter =
    isBrandView && id && BRANDS_WITH_SIZE_FILTER.includes(id);
  // Sync when URL changes (back/forward navigation)
  useEffect(() => {
    setSelectedSizes(searchParams.getAll("size"));
  }, [searchParams]);
  // ── Debounced search update ───────────────────────────
  const debouncedUpdateSearch = useMemo(
    () =>
      debounce((value) => {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (value.trim()) {
            next.set("search", value.trim());
          } else {
            next.delete("search");
          }
          next.set("page", "1"); // reset to page 1 on search change
          return next;
        });
      }, 400),
    [setSearchParams],
  );
  const COMMON_SIZES_FEET = [
    "12''X12''",
    "12''X18''",
    "12''X24''",
    "12''x8''",
    "16''X16''",
    "24''X24''",
    "24''X48''",
    "24''x72''",
    "24X48",
    "32''x64''",
    "32''x96''",
  ];
  // Sync local search when URL search changes (browser back/forward, reset, etc.)
  useEffect(() => {
    setLocalSearch(urlSearch);
  }, [urlSearch]);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      debouncedUpdateSearch.cancel();
    };
  }, [debouncedUpdateSearch]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value); // instant UI update
    debouncedUpdateSearch(value); // delayed URL + query trigger
  };

  // ── Queries ────────────────────────────────────────────
  const brandQuery = useGetProductsByBrandQuery(
    {
      brandId: id || "",
      page: currentPage,
      limit: pageSize,
      search: urlSearch || undefined,
    },
    { skip: !isBrandView || !id },
  );

  const categoryQuery = useGetAllProductsByCategoryQuery(
    {
      categoryId: id || "",
      page: currentPage,
      limit: pageSize,
      search: urlSearch || undefined,
    },
    { skip: !isCategoryView || !id },
  );

  const allProductsQuery = useGetAllProductsQuery(
    {
      page: currentPage,
      limit: pageSize,
      search: urlSearch || undefined,
    },
    { skip: isBrandView || isCategoryView },
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

  // ── Helpers ────────────────────────────────────────────
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

  const getNumericPrice = (product) => {
    const meta = product?.meta || {};
    const rawPrice = meta[META_KEYS.SELLING_PRICE];
    const price = parseFloat(rawPrice);
    return isNaN(price) ? null : price;
  };

  const getPriceDisplay = (product) => {
    const price = getNumericPrice(product);
    return price === null ? "N/A" : `₹ ${price.toFixed(2)}`;
  };

  const getCompanyCode = (product) => {
    const meta = product?.meta || {};
    const code = meta[META_KEYS.MODEL_CODE];
    return code ? String(code).trim() : "N/A";
  };

  // ── Client-side filter + sort ──────────────────────────
  const processedProducts = useMemo(() => {
    let result = [...products];

    // Price range filter
    if (priceMin || priceMax) {
      const min = priceMin ? Number(priceMin) : -Infinity;
      const max = priceMax ? Number(priceMax) : Infinity;

      result = result.filter((product) => {
        const price = getNumericPrice(product);
        return price !== null && price >= min && price <= max;
      });
    }
    // Size filter – only apply when the filter is visible (and thus selectedSizes may have values)
    if (showSizeFilter && selectedSizes.length > 0) {
      result = result.filter((product) => {
        const sizeValue = (product?.meta?.[META_KEYS.SIZE_FEET] || "").trim();
        return selectedSizes.includes(sizeValue);
      });
    }
    // Sorting
    if (sortField && sortOrder) {
      result = result.sort((a, b) => {
        let aVal, bVal;

        switch (sortField) {
          case "name":
            aVal = (a.name || "").toLowerCase();
            bVal = (b.name || "").toLowerCase();
            break;
          case "product_code":
            aVal = getCompanyCode(a).toLowerCase();
            bVal = getCompanyCode(b).toLowerCase();
            break;
          case "price":
            aVal = getNumericPrice(a) ?? Infinity;
            bVal = getNumericPrice(b) ?? Infinity;
            break;
          default:
            return 0;
        }

        if (aVal === bVal) return 0;

        const direction = sortOrder === "ascend" ? 1 : -1;
        return aVal > bVal ? direction : -direction;
      });
    }

    return result;
  }, [
    products,
    priceMin,
    priceMax,
    sortField,
    sortOrder,
    showSizeFilter, // ← add
    selectedSizes,
  ]);

  // ── URL Param Helpers ──────────────────────────────────
  const updateSearchParams = (updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === "" || value === null || value === undefined) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      if (!updates.page) {
        next.set("page", "1");
      }
      return next;
    });
  };

  const handleSort = (field) => {
    let newOrder = "ascend";

    if (sortField === field) {
      if (sortOrder === "ascend") newOrder = "descend";
      else if (sortOrder === "descend") newOrder = null;
    }

    updateSearchParams({
      sort: newOrder ? field : null,
      order: newOrder,
    });
  };

  const handlePriceChange = (type, value) => {
    updateSearchParams({ [type]: value });
  };

  const resetFilters = () => {
    setSearchParams({ page: currentPage.toString() });
    setLocalSearch("");
  };

  // ── Table Columns ──────────────────────────────────────
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
      sorter: true,
      sortOrder: sortField === "name" ? sortOrder : null,
      onHeaderCell: () => ({
        style: { cursor: "pointer" },
        onClick: () => handleSort("name"),
      }),
      render: (text, record) => (
        <Link to={`/product/${record.productId}`}>
          {text || "Unnamed product"}
        </Link>
      ),
    },
    {
      title: "Product Code",
      key: "product_code",
      sorter: true,
      sortOrder: sortField === "product_code" ? sortOrder : null,
      onHeaderCell: () => ({
        style: { cursor: "pointer" },
        onClick: () => handleSort("product_code"),
      }),
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
      sorter: true,
      sortOrder: sortField === "price" ? sortOrder : null,
      onHeaderCell: () => ({
        style: { cursor: "pointer" },
        onClick: () => handleSort("price"),
      }),
      render: (_, record) => getPriceDisplay(record),
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
        const price = getNumericPrice(record);
        const priceValid = price !== null;

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

  // ── Handlers ───────────────────────────────────────────
  const handleAddToCart = async (product) => {
    if (!userId) return message.error("Please log in");
    const price = getNumericPrice(product);
    if (price === null) return message.error("Price not available");

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

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [stockAction, setStockAction] = useState("add");

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

  // ── Title & Breadcrumbs ────────────────────────────────
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
          <Form layout="inline" style={{ flexWrap: "wrap", gap: 16 }}>
            <Form.Item>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search products..."
                value={localSearch}
                onChange={handleSearchChange}
                allowClear
                size="large"
                style={{ width: 300 }}
              />
            </Form.Item>

            <Form.Item label="Price Range (₹)">
              <Input
                placeholder="Min"
                value={priceMin}
                onChange={(e) => handlePriceChange("minPrice", e.target.value)}
                style={{ width: 100 }}
                type="number"
                min={0}
              />
              <span style={{ margin: "0 8px" }}>–</span>
              <Input
                placeholder="Max"
                value={priceMax}
                onChange={(e) => handlePriceChange("maxPrice", e.target.value)}
                style={{ width: 100 }}
                type="number"
                min={0}
              />
            </Form.Item>

            {showSizeFilter && (
              <Form.Item label="Size (inches/feet)">
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  placeholder="Select size(s)"
                  value={selectedSizes}
                  onChange={(values) => {
                    setSelectedSizes(values);
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      next.delete("size");
                      values.forEach((v) => next.append("size", v));
                      next.set("page", "1");
                      return next;
                    });
                  }}
                  style={{ minWidth: 240 }}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={COMMON_SIZES_FEET.map((size) => ({
                    label: size,
                    value: size,
                  }))}
                />
              </Form.Item>
            )}

            <Form.Item>
              <Button onClick={resetFilters}>Reset</Button>
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
        ) : processedProducts.length === 0 ? (
          <Empty
            description={
              urlSearch || priceMin || priceMax || sortField
                ? "No products match your filters"
                : "No products found"
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
                {processedProducts.map((product) => (
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
                dataSource={processedProducts}
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
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set("page", page.toString());
                    return next;
                  });
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
