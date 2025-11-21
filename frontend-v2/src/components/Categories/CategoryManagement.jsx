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

  const handleNodeSelect = (selectedKeys, info) => {
    if (!selectedKeys || selectedKeys.length === 0) {
      setSelectedNode(null);
      return;
    }

    const node = info.node;

    // Extract correct ID safely
    let id;
    if (node.type === "parent") {
      id = node.data?.id;
    } else if (node.type === "category") {
      id = node.data?.categoryId;
    } else if (node.type === "keyword") {
      id = node.data?.id;
    }

    // Safety check
    if (id === undefined || id === null) {
      console.warn("Selected node has no valid ID", node);
      setSelectedNode(null);
      return;
    }

    setSelectedNode({
      type: node.type,
      id,
      data: node.data,
      key: node.key,
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
        /* Professional Admin Dashboard Theme */
        :global(.ant-typography) {
          color: #1a1a1a;
        }

        .page-wrapper {
          height: 100vh;
          background: #f5f7fa;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            "Helvetica Neue", Arial, sans-serif;
        }

        .content {
          height: 100%;
        }

        .main-layout {
          display: flex;
          height: 100%;
          background: #fff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border-radius: 12px;
          overflow: hidden;
        }

        /* Left Panel - Tree Navigation */
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

        .action-buttons :global(.ant-btn[disabled]) {
          background: #f5f5f5;
          border-color: #d9d9d9;
          color: #999;
        }

        .tree-container {
          flex: 1;
          overflow-y: auto;
          padding: 12px 8px;
          background: #fafbfc;
        }

        /* Tree Node Styling */
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

        .tree-node.ant-tree-treenode-selected > .tree-node {
          background: #e6f7ff;
          border: 1px solid #91d5ff;
        }

        .tree-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          font-size: 14px;
          font-weight: 500;
        }

        .tree-title-text {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #262626;
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

        .tree-actions :global(.anticon) {
          font-size: 13px;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .tree-actions :global(.anticon-edit):hover {
          background: #e6f7ff;
          color: #1677ff;
        }

        .tree-actions :global(.anticon-delete):hover {
          background: #fff1f0;
          color: #ff4d4f;
        }

        /* Right Panel */
        .right-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          padding: 24px;
          gap: 20px;
        }

        .product-checker-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.25);
        }

        .product-checker-card :global(.ant-card-head) {
          border: none;
          color: white;
        }

        .product-checker-card :global(.ant-input-search .ant-input) {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
        }

        .product-checker-card :global(.ant-input::placeholder) {
          color: rgba(255, 255, 255, 0.7);
        }

        .product-checker-card :global(.ant-btn-primary) {
          background: rgba(255, 255, 255, 0.25);
          border: none;
          color: white;
        }

        .result-box {
          margin-top: 12px;
          padding: 14px 16px;
          border-radius: 10px;
          font-weight: 500;
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .result-success {
          background: rgba(82, 196, 26, 0.15);
          border: 1px solid rgba(82, 196, 26, 0.3);
          color: #237804;
        }

        .result-warning {
          background: rgba(250, 173, 20, 0.15);
          border: 1px solid rgba(250, 173, 20, 0.3);
          color: #d4380d;
        }

        /* Details Card */
        .details-card {
          flex: 1;
          border-radius: 14px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid #f0f0f0;
        }

        .details-card :global(.ant-card-head) {
          background: #f8fafc;
          border-bottom: 1px solid #e8ecef;
          border-radius: 14px 14px 0 0 !important;
          padding: 16px 24px;
        }

        .details-card :global(.ant-card-head-title) {
          font-size: 17px;
          font-weight: 600;
          color: #1a1a1a;
        }

        /* Table */
        .product-table :global(.ant-table) {
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
        }

        .product-table :global(.ant-table-thead > tr > th) {
          background: #f8fafc;
          font-weight: 600;
          color: #595959;
          font-size: 13px;
          padding: 12px 16px !important;
        }

        .product-table :global(.ant-table-tbody > tr:hover > td) {
          background: #fafbff !important;
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

        /* Empty States */
        .empty-state {
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8c8c8c;
          font-size: 15px;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .left-panel {
            width: 340px;
          }
        }

        @media (max-width: 992px) {
          .main-layout {
            flex-direction: column;
          }
          .left-panel {
            width: 100%;
            max-height: 50vh;
            border-right: none;
            border-bottom: 1px solid #e8ecef;
          }
          .action-buttons {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .right-panel {
            padding: 16px;
          }
          .action-buttons :global(.ant-btn) {
            height: 44px;
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
