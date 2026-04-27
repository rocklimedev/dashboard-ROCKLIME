// src/pages/categories/CategoryManagement.jsx
import React, { useState, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import {
  Tabs,
  Card,
  Input,
  Button,
  Space,
  Tooltip,
  message,
  Popconfirm,
  Table,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FolderOutlined,
  TagOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";

import {
  useGetAllParentCategoriesQuery,
  useDeleteParentCategoryMutation,
} from "../../api/parentCategoryApi";
import {
  useGetAllCategoriesQuery,
  useDeleteCategoryMutation,
} from "../../api/categoryApi";
import {
  useGetAllKeywordsQuery,
  useDeleteKeywordMutation,
} from "../../api/keywordApi";

import PageHeader from "../../components/Common/PageHeader";
import DeleteModal from "../../components/Common/DeleteModal";

import AddParentCategoryModal from "../../components/Categories/AddParentCategoryModal";
import AddCategoryModal from "../../components/Categories/AddCategoryModal";
import AddKeywordModal from "../../components/Categories/AddKeywordModal";

import "../../components/Categories/category.css";

const { Search } = Input;
const { TabPane } = Tabs;

const CategoryManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "parent";

  const [searchTerm, setSearchTerm] = useState("");
  const [showParentModal, setShowParentModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // === API ===
  const { data: parentData, refetch: refetchParents } =
    useGetAllParentCategoriesQuery();
  const { data: catData, refetch: refetchCategories } =
    useGetAllCategoriesQuery();
  const { data: kwData, refetch: refetchKeywords } = useGetAllKeywordsQuery();

  const [deleteParent] = useDeleteParentCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [deleteKeyword] = useDeleteKeywordMutation();

  const parentCategories = parentData?.data || [];
  const categories = catData?.categories || [];
  const keywords = kwData?.keywords || [];

  // === Mappings ===
  const parentMap = useMemo(() => {
    const map = {};
    parentCategories.forEach((p) => (map[p.id] = p.name));
    return map;
  }, [parentCategories]);

  // === Filtered Data ===
  const filteredParents = useMemo(() => {
    return parentCategories.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [parentCategories, searchTerm]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [categories, searchTerm]);

  const filteredKeywords = useMemo(() => {
    return keywords.filter((k) =>
      k.keyword.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [keywords, searchTerm]);

  const debouncedSearch = useCallback(
    debounce((value) => setSearchTerm(value), 300),
    [],
  );

  // === Tab Change with URL Sync ===
  const handleTabChange = (key) => {
    setSearchParams({ tab: key });
    setSearchTerm(""); // Clear search when switching tabs
  };

  // === Edit Handlers ===
  const handleEdit = (item, type) => {
    setEditingItem({ ...item, type });
    if (type === "parent") setShowParentModal(true);
    else if (type === "category") setShowCategoryModal(true);
    else if (type === "keyword") setShowKeywordModal(true);
  };

  // === Delete Handlers ===
  const openDeleteModal = (type, id) => {
    setDeleteType(type);
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteType === "parent") {
        await deleteParent(deleteId).unwrap();
        message.success("Parent Category deleted successfully");
        refetchParents();
      } else if (deleteType === "category") {
        await deleteCategory(deleteId).unwrap();
        message.success("Category deleted successfully");
        refetchCategories();
      } else if (deleteType === "keyword") {
        await deleteKeyword(deleteId).unwrap();
        message.success("Keyword deleted successfully");
        refetchKeywords();
      }
    } catch (err) {
      message.error(err?.data?.message || "Delete failed");
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
      setDeleteType(null);
    }
  };

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

  // === Table Columns ===
  const parentColumns = [
    { title: "Parent Category Name", dataIndex: "name", key: "name" },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <EditOutlined
              style={{ color: "#1890ff", cursor: "pointer", fontSize: 18 }}
              onClick={() => handleEdit(record, "parent")}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <DeleteOutlined
              style={{ color: "#ff4d4f", cursor: "pointer", fontSize: 18 }}
              onClick={() => openDeleteModal("parent", record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const categoryColumns = [
    { title: "Category Name", dataIndex: "name", key: "name" },
    {
      title: "Parent Category",
      key: "parent",
      render: (_, record) => parentMap[record.parentCategoryId] || "—",
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <EditOutlined
              style={{ color: "#1890ff", cursor: "pointer", fontSize: 18 }}
              onClick={() => handleEdit(record, "category")}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <DeleteOutlined
              style={{ color: "#ff4d4f", cursor: "pointer", fontSize: 18 }}
              onClick={() => openDeleteModal("category", record.categoryId)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const keywordColumns = [
    { title: "Keyword", dataIndex: "keyword", key: "keyword" },
    {
      title: "Category",
      key: "category",
      render: (_, record) =>
        categories.find((c) => c.categoryId === record.categoryId)?.name || "—",
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <EditOutlined
              style={{ color: "#1890ff", cursor: "pointer", fontSize: 18 }}
              onClick={() => handleEdit(record, "keyword")}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <DeleteOutlined
              style={{ color: "#ff4d4f", cursor: "pointer", fontSize: 18 }}
              onClick={() => openDeleteModal("keyword", record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <Card>
          <PageHeader
            title="Category Management"
            subtitle="Manage Parent Categories, Categories & Keywords"
            onAdd={() => {
              if (currentTab === "parent") setShowParentModal(true);
              else if (currentTab === "category") setShowCategoryModal(true);
              else setShowKeywordModal(true);
            }}
          />

          <div className="card-body">
            {/* Main Tabs with URL Sync */}
            <Tabs
              activeKey={currentTab}
              onChange={handleTabChange}
              className="mb-4"
            >
              <TabPane
                tab={
                  <span>
                    <FolderOutlined /> Parent Categories
                  </span>
                }
                key="parent"
              />
              <TabPane
                tab={
                  <span>
                    <FolderOutlined /> Categories
                  </span>
                }
                key="category"
              />
              <TabPane
                tab={
                  <span>
                    <TagOutlined /> Keywords
                  </span>
                }
                key="keyword"
              />
            </Tabs>

            {/* Search */}
            <div className="mb-4" style={{ maxWidth: "320px" }}>
              <Search
                placeholder="Search..."
                allowClear
                value={searchTerm}
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>

            {/* Parent Categories Table */}
            {currentTab === "parent" && (
              <Table
                columns={parentColumns}
                dataSource={filteredParents}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: "No parent categories found" }}
              />
            )}

            {/* Categories Table */}
            {currentTab === "category" && (
              <Table
                columns={categoryColumns}
                dataSource={filteredCategories}
                rowKey="categoryId"
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: "No categories found" }}
              />
            )}

            {/* Keywords Table */}
            {currentTab === "keyword" && (
              <Table
                columns={keywordColumns}
                dataSource={filteredKeywords}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                locale={{ emptyText: "No keywords found" }}
              />
            )}
          </div>
        </Card>

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
        />

        <AddKeywordModal
          open={showKeywordModal}
          onClose={closeKeywordModal}
          editData={editingItem?.type === "keyword" ? editingItem : null}
        />

        <DeleteModal
          isVisible={showDeleteModal}
          onCancel={() => {
            setShowDeleteModal(false);
            setDeleteId(null);
            setDeleteType(null);
          }}
          onConfirm={handleConfirmDelete}
          itemType={
            deleteType === "parent"
              ? "Parent Category"
              : deleteType === "category"
                ? "Category"
                : "Keyword"
          }
          isLoading={false}
        />
      </div>
    </div>
  );
};

export default CategoryManagement;
