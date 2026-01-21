import React, { useState, useMemo, useCallback, useEffect } from "react";
import { debounce } from "lodash";
import {
  Tree,
  Card,
  Input,
  Button,
  Table,
  Space,
  Tag,
  Tooltip,
  Empty,
  message,
  Popconfirm,
} from "antd";
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FolderOutlined,
  TagOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  useGetAllCategoriesQuery,
  useDeleteCategoryMutation,
} from "../../api/categoryApi";
import {
  useGetAllKeywordsQuery,
  useDeleteKeywordMutation,
} from "../../api/keywordApi";
import {
  useGetAllParentCategoriesQuery,
  useDeleteParentCategoryMutation,
} from "../../api/parentCategoryApi";
import { useGetAllProductCodesQuery } from "../../api/productApi";
import AddParentCategoryModal from "./AddParentCategoryModal";
import AddCategoryModal from "./AddCategoryModal";
import AddKeywordModal from "./AddKeywordModal";

const { Search } = Input;

const CategoryManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read category from URL on mount
  const urlCategoryId = searchParams.get("category");

  // === State ===
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [showParentModal, setShowParentModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [filteredProduct, setFilteredProduct] = useState(null);
  const [productNotFound, setProductNotFound] = useState(false);

  // === API ===
  const { data: parentData } = useGetAllParentCategoriesQuery();
  const { data: catData } = useGetAllCategoriesQuery();
  const { data: kwData } = useGetAllKeywordsQuery();

  // Fetch products with optional category filter
  const { data: prodData } = useGetAllProductCodesQuery(
    urlCategoryId ? { category: urlCategoryId } : {},
  );

  const [deleteParent] = useDeleteParentCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [deleteKeyword] = useDeleteKeywordMutation();

  // === Data ===
  const parentCategories = parentData?.data || [];
  const categories = catData?.categories || [];
  const keywords = kwData?.keywords || [];
  const products = prodData?.data || [];

  // === Mappings ===
  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => (map[c.categoryId] = c.name));
    return map;
  }, [categories]);

  const parentMap = useMemo(() => {
    const map = {};
    parentCategories.forEach((p) => (map[p.id] = p.name));
    return map;
  }, [parentCategories]);

  // === Sync selected node with URL category param ===
  useEffect(() => {
    if (urlCategoryId) {
      // Find category node matching the URL param
      const foundCategory = categories.find(
        (c) => String(c.categoryId) === urlCategoryId,
      );
      if (foundCategory) {
        setSelectedNode({
          type: "category",
          id: foundCategory.categoryId,
          data: foundCategory,
          key: `cat-${foundCategory.categoryId}`,
        });
      } else {
        // Invalid category in URL → clear it
        setSearchParams((prev) => {
          prev.delete("category");
          return prev;
        });
      }
    } else {
      setSelectedNode(null);
    }
  }, [urlCategoryId, categories, setSearchParams]);

  // When user selects a category node → update URL
  const handleNodeSelect = (selectedKeys, info) => {
    if (!selectedKeys.length) {
      setSelectedNode(null);
      setSearchParams((prev) => {
        prev.delete("category");
        return prev;
      });
      return;
    }

    const node = info.node;
    let id;
    if (node.type === "parent") id = node.data?.id;
    else if (node.type === "category") id = node.data?.categoryId;
    else if (node.type === "keyword") id = node.data?.id;

    if (id === undefined || id === null) {
      console.warn("Invalid node selected", node);
      setSelectedNode(null);
      return;
    }

    const newNode = {
      type: node.type,
      id,
      data: node.data,
      key: node.key,
    };

    setSelectedNode(newNode);

    // Update URL only for category selection
    if (node.type === "category") {
      setSearchParams({ category: id });
    } else {
      setSearchParams((prev) => {
        prev.delete("category");
        return prev;
      });
    }
  };

  // === Tree Title Renderer ===
  const renderTreeTitle = (item, type) => {
    const name =
      type === "parent"
        ? item.name
        : type === "category"
          ? item.name
          : item.keyword;

    const count =
      type === "category"
        ? products.filter((p) => p.categoryId === item.categoryId).length
        : 0;

    return (
      <div className="tree-title">
        <span className="tree-title-text">
          {name}
          {type === "category" && count > 0 && (
            <Tag color="#333333" style={{ marginLeft: 8, fontSize: 11 }}>
              {count}
            </Tag>
          )}
        </span>
        <Space size={4} className="tree-actions">
          <Tooltip title="Edit">
            <EditOutlined
              style={{ fontSize: 12, color: "#333333", cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item, type);
              }}
            />
          </Tooltip>
          <Popconfirm
            title={`Delete this ${type}?`}
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDelete(item, type);
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText="Yes"
            cancelText="No"
          >
            <DeleteOutlined
              style={{ fontSize: 12, color: "#ff4d4f", cursor: "pointer" }}
              onClick={(e) => e.stopPropagation()}
            />
          </Popconfirm>
        </Space>
      </div>
    );
  };

  // === Handlers ===
  const handleEdit = (item, type) => {
    setEditingItem({ ...item, type });
    if (type === "parent") setShowParentModal(true);
    else if (type === "category") setShowCategoryModal(true);
    else if (type === "keyword") setShowKeywordModal(true);
  };

  const handleDelete = async (item, type) => {
    try {
      if (type === "parent") await deleteParent(item.id).unwrap();
      else if (type === "category")
        await deleteCategory(item.categoryId).unwrap();
      else if (type === "keyword") await deleteKeyword(item.id).unwrap();

      if (
        selectedNode?.id === item.id ||
        selectedNode?.id === item.categoryId ||
        selectedNode?.id === item.id
      ) {
        setSelectedNode(null);
        setSearchParams((prev) => {
          prev.delete("category");
          return prev;
        });
      }
      message.success("Deleted successfully");
    } catch (err) {
      message.error(err?.data?.message || "Delete failed");
    }
  };

  const debouncedSearch = useCallback(
    debounce((value) => setSearchTerm(value), 300),
    [],
  );

  const handleProductSearch = () => {
    const code = productSearch.trim().toLowerCase();
    if (!code) return;

    const found = products.find((p) => p.product_code?.toLowerCase() === code);
    setFilteredProduct(found || null);
    setProductNotFound(!found);
  };

  // === Table Columns ===
  const productColumns = [
    { title: "#", key: "index", width: 60, render: (_, __, i) => i + 1 },
    {
      title: "Image",
      key: "image",
      width: 70,
      render: (_, r) => {
        let url = null;
        if (r.images) {
          try {
            const parsed = JSON.parse(r.images);
            url = Array.isArray(parsed)
              ? parsed[0]
              : typeof parsed === "string"
                ? parsed
                : null;
          } catch {}
        }
        return url ? (
          <img src={url} alt={r.name} className="product-image" />
        ) : (
          <div className="no-image">No img</div>
        );
      },
    },
    { title: "Name", dataIndex: "name", ellipsis: true },
    { title: "Code", dataIndex: "product_code" },
    {
      title: "Action",
      width: 100,
      render: (_, r) => (
        <Link to={`/product/${r.productId}/edit`}>
          <Button size="small" type="link">
            Edit
          </Button>
        </Link>
      ),
    },
  ];

  // === Tree Data ===
  const treeData = useMemo(() => {
    const filteredParents = parentCategories.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return filteredParents.map((parent) => {
      const childCats = categories.filter(
        (c) => c.parentCategoryId === parent.id,
      );
      const filteredCats = childCats.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );

      const catNodes = filteredCats.map((cat) => {
        const catKeywords = keywords
          .filter((k) => k.categoryId === cat.categoryId)
          .filter((k) =>
            k.keyword.toLowerCase().includes(searchTerm.toLowerCase()),
          );

        return {
          title: (
            <div className="tree-node">{renderTreeTitle(cat, "category")}</div>
          ),
          key: `cat-${cat.categoryId}`,
          icon: <FolderOutlined />,
          children: catKeywords.map((kw) => ({
            title: (
              <div className="tree-node">{renderTreeTitle(kw, "keyword")}</div>
            ),
            key: `kw-${kw.id}`,
            icon: <TagOutlined />,
            isLeaf: true,
          })),
          data: cat,
          type: "category",
        };
      });

      return {
        title: (
          <div className="tree-node">{renderTreeTitle(parent, "parent")}</div>
        ),
        key: `parent-${parent.id}`,
        icon: <FolderOutlined style={{ color: "#333333" }} />,
        children: catNodes,
        data: parent,
        type: "parent",
      };
    });
  }, [parentCategories, categories, keywords, searchTerm, products]);

  // === Modal Close Handlers ===
  const closeParentModal = () => {
    setShowParentModal(false);
    setEditingItem(null);
  };
  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingItem(null);
  };
  const closeKeywordModal = () => {
    setShowKeywordModal(false);
    setEditingItem(null);
  };

  return (
    <>
      {/* Embedded CSS remains the same */}
      <style jsx>{`
        :global(.ant-typography) {
          color: #1a1a1a;
        }

        .main-layout {
          display: flex;
          height: 100%;
          background: #fff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border-radius: 12px;
          overflow: hidden;
        }

        .left-panel {
          width: 380px;
          min-width: 320px;
          background: #fafbfc;
          border-right: 1px solid #e8ecef;
          display: flex;
          flex-direction: column;
          box-shadow: 2px 0 10px rgba(0, 0, 0, 0.04);
        }

        .left-header {
          padding: 20px;
          background: #ffffff;
          border-bottom: 1px solid #e8ecef;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .left-header :global(.ant-input-search) {
          border-radius: 10px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }

        .action-buttons {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }

        .action-buttons :global(.ant-btn) {
          border-radius: 8px;
          font-weight: 500;
          height: 38px;
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .tree-container {
          flex: 1;
          overflow-y: auto;
          padding: 12px 8px;
          background: #fafbfc;
        }

        .tree-node {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
          margin: 2px 4px;
        }

        .tree-node:hover {
          background: #f0f5ff;
        }

        .tree-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          font-size: 14px;
          font-weight: 500;
        }

        .tree-actions {
          opacity: 0;
          transition: opacity 0.25s ease;
          display: flex;
          gap: 6px;
        }

        .tree-node:hover .tree-actions {
          opacity: 1;
        }

        .right-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          padding: 24px;
          gap: 20px;
        }

        .product-checker-card {
          color: white;
          border: none;
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.25);
        }

        .details-card {
          flex: 1;
          border-radius: 14px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid #f0f0f0;
        }

        .product-table :global(.ant-table) {
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
        }

        .product-image {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #e8e8e8;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }

        .no-image {
          width: 48px;
          height: 48px;
          background: #f9f9f9;
          border: 1px dashed #d9d9d9;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          color: #aaa;
        }
      `}</style>

      <div className="page-wrapper">
        <div className="content">
          <div className="main-layout">
            {/* Left: Tree */}
            <div className="left-panel">
              <div className="left-header">
                <Search
                  placeholder="Search hierarchy..."
                  allowClear
                  onChange={(e) => debouncedSearch(e.target.value)}
                  style={{ width: "100%" }}
                />
                <Space className="action-buttons" wrap>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    style={{ background: "#E31E24", color: "#fff" }}
                    onClick={() => {
                      setEditingItem(null);
                      setShowParentModal(true);
                    }}
                  >
                    Parent
                  </Button>
                  <Button
                    icon={<PlusOutlined />}
                    style={{ background: "#E31E24", color: "#fff" }}
                    disabled={!selectedNode || selectedNode.type !== "parent"}
                    onClick={() => {
                      setEditingItem(null);
                      setShowCategoryModal(true);
                    }}
                  >
                    Category
                  </Button>
                  <Button
                    icon={<PlusOutlined />}
                    style={{ background: "#E31E24", color: "#fff" }}
                    disabled={!selectedNode || selectedNode.type !== "category"}
                    onClick={() => {
                      setEditingItem(null);
                      setShowKeywordModal(true);
                    }}
                  >
                    Keyword
                  </Button>
                </Space>
              </div>

              <div className="tree-container">
                {treeData.length > 0 ? (
                  <Tree
                    showIcon
                    defaultExpandAll
                    expandedKeys={expandedKeys}
                    onExpand={setExpandedKeys}
                    onSelect={handleNodeSelect}
                    selectedKeys={
                      selectedNode
                        ? [`${selectedNode.type}-${selectedNode.id}`]
                        : []
                    }
                    treeData={treeData}
                    height={window.innerHeight - 200}
                  />
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    style={{ margin: 32 }}
                  />
                )}
              </div>
            </div>

            {/* Right: Details */}
            <div className="right-panel">
              <Card className="product-checker-card">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Search
                    placeholder="Check Product Code"
                    enterButton="Check"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    onSearch={handleProductSearch}
                    style={{ width: 300, maxWidth: "100%" }}
                  />

                  {filteredProduct && (
                    <div className="result-box result-success">
                      <CheckCircleOutlined />
                      <strong>{filteredProduct.name}</strong> |{" "}
                      {filteredProduct.product_code}
                      <Link to={`/product/${filteredProduct.productId}/edit`}>
                        <Button size="small" type="link">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  )}

                  {productNotFound && (
                    <div className="result-box result-warning">
                      <ExclamationCircleOutlined />
                      <span>Code available</span>
                    </div>
                  )}
                </Space>
              </Card>

              <Card
                className="details-card"
                title={
                  <Space>
                    {selectedNode?.type === "parent" && <FolderOutlined />}
                    {selectedNode?.type === "category" && <FolderOutlined />}
                    {selectedNode?.type === "keyword" && <TagOutlined />}
                    {selectedNode
                      ? selectedNode.type === "parent"
                        ? parentMap[selectedNode.id]
                        : selectedNode.type === "category"
                          ? categoryMap[selectedNode.id]
                          : selectedNode.data.keyword
                      : "Category Details"}
                    {selectedNode?.type === "category" &&
                      products.length > 0 && (
                        <Tag color="blue" style={{ marginLeft: 8 }}>
                          {products.length} products
                        </Tag>
                      )}
                  </Space>
                }
              >
                {selectedNode ? (
                  <>
                    {selectedNode.type === "category" ? (
                      products.length > 0 ? (
                        <Table
                          className="product-table"
                          columns={productColumns}
                          dataSource={products}
                          pagination={{ pageSize: 10, showSizeChanger: true }}
                          rowKey="productId"
                          locale={{ emptyText: "No products in this category" }}
                        />
                      ) : (
                        <Empty
                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                          description="No products assigned to this category yet"
                          style={{ margin: "60px 0" }}
                        >
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() =>
                              navigate("/product/add", {
                                state: { prefillCategoryId: selectedNode.id },
                              })
                            }
                          >
                            Add Product to this Category
                          </Button>
                        </Empty>
                      )
                    ) : selectedNode.type === "parent" ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "60px 0",
                          color: "#8c8c8c",
                        }}
                      >
                        <FolderOutlined
                          style={{ fontSize: 48, marginBottom: 16 }}
                        />
                        <p>
                          Select a category under this parent to view products
                        </p>
                      </div>
                    ) : (
                      <div style={{ padding: "20px" }}>
                        <Tag
                          color="purple"
                          style={{ fontSize: 14, padding: "6px 12px" }}
                        >
                          {selectedNode.data.keyword}
                        </Tag>
                        <p style={{ marginTop: 16, color: "#595959" }}>
                          This keyword is associated with category:{" "}
                          <strong>
                            {categoryMap[selectedNode.data.categoryId]}
                          </strong>
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="empty-state">
                    <Empty description="Select a category from the tree to view its products" />
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Modals */}
          <AddParentCategoryModal
            open={showParentModal}
            onClose={closeParentModal}
            editMode={!!editingItem && editingItem.type === "parent"}
            parentCategoryData={
              editingItem?.type === "parent" ? editingItem : null
            }
          />

          <AddCategoryModal
            open={showCategoryModal}
            onClose={closeCategoryModal}
            editMode={!!editingItem && editingItem.type === "category"}
            categoryData={editingItem?.type === "category" ? editingItem : null}
            selectedParentId={
              selectedNode?.type === "parent" ? selectedNode.id : null
            }
          />

          <AddKeywordModal
            open={showKeywordModal}
            onClose={closeKeywordModal}
            editData={editingItem?.type === "keyword" ? editingItem : null}
            selectedCategoryId={
              selectedNode?.type === "category" ? selectedNode.id : null
            }
          />
        </div>
      </div>
    </>
  );
};

export default CategoryManagement;
