import React, { useState, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import { Input, Card, Button, Space, Typography, Modal, Table } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useParams, Link } from "react-router-dom";
import {
  useGetAllCategoriesQuery,
  useDeleteCategoryMutation,
} from "../../api/categoryApi";
import {
  useGetAllKeywordsQuery,
  useDeleteKeywordMutation,
} from "../../api/keywordApi";
import { useGetAllProductCodesQuery } from "../../api/productApi";
import { useGetAllParentCategoriesQuery } from "../../api/parentCategoryApi";
import PageHeader from "../Common/PageHeader";
import AddCategoryModal from "./AddCategoryModal";
import AddKeywordModal from "./AddKeywordModal";
import DeleteModal from "../Common/DeleteModal";
import DataTablePagination from "../Common/DataTablePagination";
import { toast } from "sonner";
const { Title, Text } = Typography;

const styles = {
  card: {
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    width: "250px",
  },
  searchInputWrapper: {
    position: "relative",
    maxWidth: "400px",
    marginBottom: "20px",
  },
};

const CategoryDetails = () => {
  const { parentId } = useParams();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingKeyword, setEditingKeyword] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteItemType, setDeleteItemType] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [categoryPage, setCategoryPage] = useState(1);
  const [keywordPage, setKeywordPage] = useState(1);
  const [productPage, setProductPage] = useState(1);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [keywordSearchTerm, setKeywordSearchTerm] = useState("");
  const [modalProductSearch, setModalProductSearch] = useState("");

  const itemsPerPage = 20;
  const productPageSize = 25;

  // API hooks
  const { data: parentCategoryData, isLoading: parentCategoryLoading } =
    useGetAllParentCategoriesQuery();
  const { data: categoryData, isLoading: categoryLoading } =
    useGetAllCategoriesQuery();
  const { data: keywordData, isLoading: keywordLoading } =
    useGetAllKeywordsQuery();
  const { data: productData, isLoading: productsLoading } =
    useGetAllProductCodesQuery();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [deleteKeyword] = useDeleteKeywordMutation();

  // Data normalization
  const parentCategories = Array.isArray(parentCategoryData?.data)
    ? parentCategoryData.data
    : [];
  const categories = Array.isArray(categoryData?.categories)
    ? categoryData.categories
    : [];
  const keywords = Array.isArray(keywordData?.keywords)
    ? keywordData.keywords
    : [];
  const products = Array.isArray(productData?.data) ? productData.data : [];

  // Category ID to name mapping
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((cat) => {
      map[cat.categoryId] = cat.name;
    });
    return map;
  }, [categories]);

  // Memoized filtering
  const filteredCategories = useMemo(
    () =>
      categories.filter((c) => {
        const categoryNameMatch = c.name
          .toLowerCase()
          .includes(categorySearchTerm.toLowerCase());
        return categoryNameMatch && c.parentCategoryId === parseInt(parentId);
      }),
    [categories, categorySearchTerm, parentId]
  );

  const filteredKeywords = useMemo(
    () =>
      keywords.filter((k) => {
        const keywordMatch = k.keyword
          .toLowerCase()
          .includes(keywordSearchTerm.toLowerCase());
        return keywordMatch && k.categoryId === selectedCategoryId;
      }),
    [keywords, keywordSearchTerm, selectedCategoryId]
  );

  const filteredModalProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    let result = products.filter((p) => p.categoryId === selectedCategoryId);
    if (modalProductSearch) {
      result = result.filter((p) =>
        p.product_code?.toLowerCase().includes(modalProductSearch.toLowerCase())
      );
    }
    return result;
  }, [products, selectedCategoryId, modalProductSearch]);

  // Pagination
  const paginatedCategories = useMemo(
    () =>
      filteredCategories.slice(
        (categoryPage - 1) * itemsPerPage,
        categoryPage * itemsPerPage
      ),
    [filteredCategories, categoryPage]
  );

  const paginatedKeywords = useMemo(
    () =>
      filteredKeywords.slice(
        (keywordPage - 1) * itemsPerPage,
        keywordPage * itemsPerPage
      ),
    [filteredKeywords, keywordPage]
  );

  const paginatedProducts = useMemo(
    () =>
      filteredModalProducts.slice(
        (productPage - 1) * productPageSize,
        productPage * productPageSize
      ),
    [filteredModalProducts, productPage]
  );

  // Debounced search handlers
  const debouncedSetCategorySearch = useCallback(
    debounce((value) => {
      setCategorySearchTerm(value);
      setCategoryPage(1);
    }, 300),
    []
  );

  const debouncedSetKeywordSearch = useCallback(
    debounce((value) => {
      setKeywordSearchTerm(value);
      setKeywordPage(1);
    }, 300),
    []
  );

  const debouncedSetModalProductSearch = useCallback(
    debounce((value) => {
      setModalProductSearch(value);
      setProductPage(1);
    }, 300),
    []
  );

  // Handlers
  const handleAddCategory = useCallback(() => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  }, []);

  const handleAddKeyword = useCallback(() => {
    setEditingKeyword(null);
    setShowKeywordModal(true);
  }, []);

  const handleCategoryClick = useCallback((categoryId) => {
    setSelectedCategoryId(categoryId);
    setShowProductModal(true);
    setProductPage(1);
    setModalProductSearch("");
  }, []);

  const handleDelete = useCallback(
    async (item, itemType) => {
      try {
        if (itemType === "Category") {
          await deleteCategory(item.categoryId).unwrap();
          if (paginatedCategories.length === 1 && categoryPage > 1) {
            setCategoryPage((prev) => Math.max(1, prev - 1));
          }
          if (selectedCategoryId === item.categoryId) {
            setSelectedCategoryId(null);
            setShowProductModal(false);
          }
        } else if (itemType === "Keyword") {
          await deleteKeyword(item.id).unwrap();
          if (paginatedKeywords.length === 1 && keywordPage > 1) {
            setKeywordPage((prev) => Math.max(1, prev - 1));
          }
        }
        setShowDeleteModal(false);
        setItemToDelete(null);
        setDeleteItemType(null);
      } catch (err) {
        toast.error(
          err?.data?.message || `Failed to delete ${itemType.toLowerCase()}`
        );
      }
    },
    [
      paginatedCategories,
      categoryPage,
      selectedCategoryId,
      paginatedKeywords,
      keywordPage,
      deleteCategory,
      deleteKeyword,
    ]
  );

  const categoryColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <a onClick={() => handleCategoryClick(record.categoryId)}>{text}</a>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: "Products",
      key: "products",
      render: (_, record) => (
        <span>
          {products.filter((p) => p.categoryId === record.categoryId).length}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingCategory(record);
              setShowCategoryModal(true);
            }}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => {
              setItemToDelete(record);
              setDeleteItemType("Category");
              setShowDeleteModal(true);
            }}
          />
        </Space>
      ),
    },
  ];

  const keywordColumns = [
    {
      title: "Keyword",
      dataIndex: "keyword",
      key: "keyword",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => {
              setEditingKeyword(record);
              setShowKeywordModal(true);
            }}
          />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => {
              setItemToDelete(record);
              setDeleteItemType("Keyword");
              setShowDeleteModal(true);
            }}
          />
        </Space>
      ),
    },
  ];

  const productColumns = [
    {
      title: "#",
      key: "index",
      render: (_, __, index) => (productPage - 1) * productPageSize + index + 1,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Product Code",
      dataIndex: "product_code",
      key: "product_code",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Link to={`/product/${record.productId}/edit`}>
          <Button type="primary">Edit</Button>
        </Link>
      ),
    },
  ];

  if (
    parentCategoryLoading ||
    categoryLoading ||
    keywordLoading ||
    productsLoading
  )
    return <p>Loading data...</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <nav aria-label="breadcrumb">
          <ol style={{ display: "flex", listStyle: "none", padding: 0 }}>
            <li>
              <Link to="/categories">Parent Categories</Link> /
            </li>
            <li style={{ marginLeft: "5px" }}>
              {selectedCategoryId ? (
                <Link
                  onClick={() => {
                    setSelectedCategoryId(null);
                    setShowProductModal(false);
                  }}
                >
                  {
                    parentCategories.find((pc) => pc.id === parseInt(parentId))
                      ?.name
                  }
                </Link>
              ) : (
                <Text strong>
                  {
                    parentCategories.find((pc) => pc.id === parseInt(parentId))
                      ?.name
                  }
                </Text>
              )}
              {selectedCategoryId && (
                <span> / {categoryMap[selectedCategoryId]}</span>
              )}
            </li>
          </ol>
        </nav>

        {!selectedCategoryId ? (
          <>
            <PageHeader
              title="Categories"
              subtitle={`Manage categories under ${
                parentCategories.find((pc) => pc.id === parseInt(parentId))
                  ?.name
              }`}
              onAdd={handleAddCategory}
              tableData={filteredCategories.map((c) => ({
                categoryId: c.categoryId,
                name: c.name,
                createdAt: new Date(c.createdAt).toLocaleDateString(),
              }))}
            />
            <Card style={{ marginBottom: "20px" }}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search Category..."
                onChange={(e) => debouncedSetCategorySearch(e.target.value)}
                style={styles.searchInputWrapper}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                <Card
                  style={{ ...styles.card, cursor: "pointer" }}
                  onClick={handleAddCategory}
                >
                  <div style={{ textAlign: "center" }}>
                    <Title level={5}>Add New Category</Title>
                    <Text>Click here to create a new category</Text>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      style={{ marginTop: "10px" }}
                    >
                      Add Category
                    </Button>
                  </div>
                </Card>
                {paginatedCategories.map((category) => (
                  <Card
                    key={category.categoryId}
                    style={{ ...styles.card }}
                    onClick={() => handleCategoryClick(category.categoryId)}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Title level={5} style={{ margin: 0 }}>
                        {category.name}
                      </Title>
                      <Text>
                        {
                          products.filter(
                            (p) => p.categoryId === category.categoryId
                          ).length
                        }
                      </Text>
                    </div>
                    <Text>
                      Created:{" "}
                      {new Date(category.createdAt).toLocaleDateString()}
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: "auto",
                      }}
                    >
                      <Space>
                        <Button
                          icon={<EditOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(category);
                            setShowCategoryModal(true);
                          }}
                        />
                        <Button
                          icon={<DeleteOutlined />}
                          danger
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToDelete(category);
                            setDeleteItemType("Category");
                            setShowDeleteModal(true);
                          }}
                        />
                      </Space>
                    </div>
                  </Card>
                ))}
              </div>
              {paginatedCategories.length === 0 && (
                <p style={{ textAlign: "center" }}>No categories found.</p>
              )}
              <DataTablePagination
                totalItems={filteredCategories.length}
                itemNo={itemsPerPage}
                onPageChange={setCategoryPage}
                currentPage={categoryPage}
              />
            </Card>
          </>
        ) : (
          <>
            <PageHeader
              title="Keywords"
              subtitle={`Manage keywords for ${categoryMap[selectedCategoryId]}`}
              onAdd={handleAddKeyword}
              tableData={filteredKeywords.map((k) => ({
                id: k.id,
                keyword: k.keyword,
                createdAt: new Date(k.createdAt).toLocaleDateString(),
              }))}
            />
            <Card style={{ marginBottom: "20px" }}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search Keyword..."
                onChange={(e) => debouncedSetKeywordSearch(e.target.value)}
                style={styles.searchInputWrapper}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                <Card
                  style={{ ...styles.card, cursor: "pointer" }}
                  onClick={handleAddKeyword}
                >
                  <div style={{ textAlign: "center" }}>
                    <Title level={5}>Add New Keyword</Title>
                    <Text>Click here to create a new keyword</Text>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      style={{ marginTop: "10px" }}
                    >
                      Add Keyword
                    </Button>
                  </div>
                </Card>
                {paginatedKeywords.map((keyword) => (
                  <Card key={keyword.id} style={styles.card}>
                    <Title level={5} style={{ margin: 0 }}>
                      {keyword.keyword}
                    </Title>
                    <Text>
                      Created:{" "}
                      {new Date(keyword.createdAt).toLocaleDateString()}
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: "auto",
                      }}
                    >
                      <Space>
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => {
                            setEditingKeyword(keyword);
                            setShowKeywordModal(true);
                          }}
                        />
                        <Button
                          icon={<DeleteOutlined />}
                          danger
                          onClick={() => {
                            setItemToDelete(keyword);
                            setDeleteItemType("Keyword");
                            setShowDeleteModal(true);
                          }}
                        />
                      </Space>
                    </div>
                  </Card>
                ))}
              </div>
              {paginatedKeywords.length === 0 && (
                <p style={{ textAlign: "center" }}>No keywords found.</p>
              )}
              <DataTablePagination
                totalItems={filteredKeywords.length}
                itemNo={itemsPerPage}
                onPageChange={setKeywordPage}
                currentPage={keywordPage}
              />
            </Card>
          </>
        )}

        {/* Modals */}
        {showCategoryModal && (
          <AddCategoryModal
            editMode={!!editingCategory}
            categoryData={editingCategory}
            onClose={() => {
              setShowCategoryModal(false);
              setEditingCategory(null);
            }}
            selectedParentId={parseInt(parentId)}
          />
        )}

        {showKeywordModal && (
          <AddKeywordModal
            onClose={() => {
              setShowKeywordModal(false);
              setEditingKeyword(null);
            }}
            editData={editingKeyword}
            selectedCategoryId={selectedCategoryId}
          />
        )}

        {showDeleteModal && (
          <DeleteModal
            isVisible={showDeleteModal}
            item={itemToDelete}
            itemType={deleteItemType}
            onConfirm={() => handleDelete(itemToDelete, deleteItemType)}
            onCancel={() => {
              setShowDeleteModal(false);
              setItemToDelete(null);
              setDeleteItemType(null);
            }}
          />
        )}

        {showProductModal && (
          <Modal
            title={`Products in ${
              categoryMap[selectedCategoryId] || "Selected Category"
            }`}
            open={showProductModal}
            onCancel={() => {
              setShowProductModal(false);
              setModalProductSearch("");
              setProductPage(1);
            }}
            footer={null}
            width={800}
          >
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search Products in Category..."
              value={modalProductSearch}
              onChange={(e) => debouncedSetModalProductSearch(e.target.value)}
              style={styles.searchInputWrapper}
            />
            {paginatedProducts.length > 0 ? (
              <>
                <Table
                  columns={productColumns}
                  dataSource={paginatedProducts}
                  pagination={false}
                  rowKey="productId"
                />
                <DataTablePagination
                  totalItems={filteredModalProducts.length}
                  itemNo={productPageSize}
                  onPageChange={setProductPage}
                  currentPage={productPage}
                />
              </>
            ) : (
              <p style={{ textAlign: "center" }}>
                No products found for this category.
              </p>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
};

export default CategoryDetails;
