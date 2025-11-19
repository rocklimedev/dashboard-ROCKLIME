import React, { useState, useMemo, useCallback } from "react";
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
  Spin,
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
import { Link } from "react-router-dom";

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
  const {
    data: parentData,
    isLoading: parentLoading,
    error: parentError,
  } = useGetAllParentCategoriesQuery();
  const {
    data: catData,
    isLoading: catLoading,
    error: catError,
  } = useGetAllCategoriesQuery();
  const {
    data: kwData,
    isLoading: kwLoading,
    error: kwError,
  } = useGetAllKeywordsQuery();
  const {
    data: prodData,
    isLoading: prodLoading,
    error: prodError,
  } = useGetAllProductCodesQuery();

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
            <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
              {count}
            </Tag>
          )}
        </span>
        <Space size={4} className="tree-actions">
          <Tooltip title="Edit">
            <EditOutlined
              style={{ fontSize: 12, color: "#1890ff", cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(item, type);
              }}
            />
          </Tooltip>
          <Popconfirm
            title={`Delete this ${type}?`}
            onConfirm={(e) => {
              e.stopPropagation();
              handleDelete(item, type);
            }}
            onCancel={(e) => e.stopPropagation()}
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

      message.success(`${type} deleted`);
      if (
        selectedNode?.id === item.id ||
        selectedNode?.id === item.categoryId ||
        selectedNode?.id === item.id
      ) {
        setSelectedNode(null);
      }
    } catch (err) {
      message.error(err?.data?.message || "Delete failed");
    }
  };

  const handleNodeSelect = (keys, info) => {
    const { node } = info;
    if (!node || (node.children && node.children.length > 0)) return;

    const id =
      node.type === "parent"
        ? node.data.id
        : node.type === "category"
        ? node.data.categoryId
        : node.data.id;

    setSelectedNode({
      type: node.type,
      id,
      data: node.data,
    });
  };

  const debouncedSearch = useCallback(
    debounce((value) => setSearchTerm(value), 300),
    []
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
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Image",
      key: "image",
      width: 70,
      render: (_, record) => {
        let imageUrl = null;

        // Safely parse images
        if (record.images && typeof record.images === "string") {
          try {
            const parsed = JSON.parse(record.images);
            if (Array.isArray(parsed) && parsed.length > 0) {
              imageUrl = parsed[0];
            } else if (typeof parsed === "string") {
              imageUrl = parsed;
            }
          } catch (e) {
            // Optional: report to backend via logging
          }
        }

        return imageUrl ? (
          <img src={imageUrl} alt={record.name} className="product-image" />
        ) : (
          <div className="no-image">No img</div>
        );
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "Code",
      dataIndex: "product_code",
      key: "code",
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Link to={`/product/${record.productId}/edit`}>
          <Button size="small" type="link">
            Edit
          </Button>
        </Link>
      ),
    },
  ];

  const selectedCategoryProducts =
    selectedNode?.type === "category"
      ? products.filter((p) => p.categoryId === selectedNode.id)
      : [];

  // === Tree Data ===
  const treeData = useMemo(() => {
    const filteredParents = parentCategories.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filteredParents.map((parent) => {
      const childCats = categories.filter(
        (c) => c.parentCategoryId === parent.id
      );
      const filteredCats = childCats.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const catNodes = filteredCats.map((cat) => {
        const catKeywords = keywords
          .filter((k) => k.categoryId === cat.categoryId)
          .filter((k) =>
            k.keyword.toLowerCase().includes(searchTerm.toLowerCase())
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
        icon: <FolderOutlined style={{ color: "#1890ff" }} />,
        children: catNodes,
        data: parent,
        type: "parent",
      };
    });
  }, [parentCategories, categories, keywords, searchTerm, products]);

  // === Modal Close ===
  const handleCloseParentCategoryModal = () => {
    setShowParentModal(false);
    setEditingItem(null);
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingItem(null);
  };

  const handleCloseKeywordModal = () => {
    setShowKeywordModal(false);
    setEditingItem(null);
  };

  // === Loading & Error ===
  if (parentLoading || catLoading || kwLoading || prodLoading)
    return (
      <div className="page-wrapper">
        <div
          className="content"
          style={{ padding: "24px", textAlign: "center" }}
        >
          <Spin size="large" />
        </div>
      </div>
    );

  if (parentError || catError || kwError || prodError)
    return (
      <div className="page-wrapper">
        <div className="content" style={{ padding: "24px" }}>
          <Empty description="Failed to load data" />
        </div>
      </div>
    );

  return (
    <>
      {/* Embedded CSS */}
      <style jsx>{`
        /* Global Styles */

        .main-layout {
          flex: 1;
          display: flex;
          height: 100%;
          overflow: hidden;
        }

        /* Left Panel */
        .left-panel {
          width: 360px;
          min-width: 300px;
          border-right: 1px solid #f0f0f0;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
        }

        .left-header {
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
          background: #fff;
        }

        .action-buttons {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .action-buttons button {
          flex: 1;
          min-width: 70px;
          font-size: 13px;
        }

        .tree-container {
          flex: 1;
          overflow-y: auto;
          padding: 8px 0;
          background: #fafafa;
        }

        /* Tree Node */
        .tree-node {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .tree-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0 4px;
        }

        .tree-title-text {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 14px;
        }

        .tree-actions {
          opacity: 0;
          transition: opacity 0.2s;
        }

        .tree-node:hover .tree-actions {
          opacity: 1;
        }

        /* Right Panel */
        .right-panel {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          background: #fff;
        }

        .product-checker-card {
          margin-bottom: 16px;
        }

        .result-box {
          margin-top: 12px;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .result-success {
          background: #f6ffed;
          border: 1px solid #b7eb8f;
          color: #52c41a;
        }

        .result-warning {
          background: #fffbe6;
          border: 1px solid #ffe58f;
          color: #faad14;
        }

        .details-card {
          min-height: 300px;
        }

        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: #999;
        }

        /* Table */
        .product-table :global(.ant-table) {
          font-size: 13px;
        }

        .product-table :global(.ant-table-thead > tr > th) {
          font-size: 12px;
          padding: 8px 12px !important;
        }

        .product-table :global(.ant-table-tbody > tr > td) {
          padding: 8px 12px !important;
        }

        .product-image {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 4px;
          border: 1px solid #f0f0f0;
        }

        .no-image {
          width: 40px;
          height: 40px;
          background: #f5f5f5;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #999;
          border: 1px solid #f0f0f0;
        }

        /* Responsive */
        @media (max-width: 992px) {
          .main-layout {
            flex-direction: column;
          }

          .left-panel {
            width: 100% !important;
            max-height: 50vh;
            border-right: none;
            border-bottom: 1px solid #f0f0f0;
          }

          .right-panel {
            padding: 16px;
          }

          .action-buttons {
            justify-content: center;
          }

          .action-buttons button {
            flex: none;
            width: auto;
          }
        }

        @media (max-width: 768px) {
          .left-header {
            padding: 12px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .action-buttons button {
            width: 100%;
          }

          .right-panel {
            padding: 12px;
          }

          .product-image,
          .no-image {
            width: 32px;
            height: 32px;
          }

          .tree-title-text {
            font-size: 13px;
          }
        }

        @media (max-width: 576px) {
          .left-panel {
            max-height: 45vh;
          }

          .result-box {
            font-size: 13px;
          }

          .details-card :global(.ant-card-head-title) {
            font-size: 15px;
          }
        }
      `}</style>

      {/* JSX */}
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
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setEditingItem(null);
                      setShowParentModal(true);
                    }}
                  >
                    Parent
                  </Button>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      if (!selectedNode || selectedNode.type !== "parent") {
                        message.warning("Select a parent category first");
                        return;
                      }
                      setEditingItem(null);
                      setShowCategoryModal(true);
                    }}
                    disabled={!selectedNode || selectedNode.type !== "parent"}
                  >
                    Category
                  </Button>
                  <Button
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      if (!selectedNode || selectedNode.type !== "category") {
                        message.warning("Select a category first");
                        return;
                      }
                      setEditingItem(null);
                      setShowKeywordModal(true);
                    }}
                    disabled={!selectedNode || selectedNode.type !== "category"}
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

              {selectedNode ? (
                <Card
                  className="details-card"
                  title={
                    <Space>
                      {selectedNode.type === "parent" && <FolderOutlined />}
                      {selectedNode.type === "category" && <FolderOutlined />}
                      {selectedNode.type === "keyword" && <TagOutlined />}
                      <span>
                        {selectedNode.type === "parent"
                          ? parentMap[selectedNode.id]
                          : selectedNode.type === "category"
                          ? categoryMap[selectedNode.id]
                          : selectedNode.data.keyword}
                      </span>
                    </Space>
                  }
                >
                  {selectedNode.type === "category" && (
                    <Table
                      className="product-table"
                      columns={productColumns}
                      dataSource={selectedCategoryProducts}
                      pagination={{ pageSize: 10 }}
                      rowKey="productId"
                      locale={{ emptyText: "No products" }}
                    />
                  )}
                  {selectedNode.type === "parent" && (
                    <p>Select a category to view products.</p>
                  )}
                  {selectedNode.type === "keyword" && (
                    <p>
                      Keyword: <Tag>{selectedNode.data.keyword}</Tag>
                    </p>
                  )}
                </Card>
              ) : (
                <Card className="details-card">
                  <div className="empty-state">
                    <Empty description="Select a parent, category, or keyword to view details" />
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Modals */}
          <AddParentCategoryModal
            open={showParentModal}
            onClose={handleCloseParentCategoryModal}
            editMode={!!editingItem && editingItem.type === "parent"}
            parentCategoryData={
              editingItem?.type === "parent" ? editingItem : null
            }
          />

          <AddCategoryModal
            open={showCategoryModal}
            onClose={handleCloseCategoryModal}
            editMode={!!editingItem && editingItem.type === "category"}
            categoryData={editingItem?.type === "category" ? editingItem : null}
            selectedParentId={
              selectedNode?.type === "parent" ? selectedNode.id : null
            }
          />

          <AddKeywordModal
            open={showKeywordModal}
            onClose={handleCloseKeywordModal}
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
