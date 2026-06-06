// src/pages/categories/CategoryManagement.jsx
import React, { useState, useMemo } from "react";
import { EditOutlined, DeleteOutlined, MoreOutlined } from "@ant-design/icons";
import { Dropdown, Menu, Button, Tooltip, message, Tabs, Input } from "antd";

import { useSearchParams } from "react-router-dom";

import {
  useGetAllParentCategoriesQuery,
  useDeleteParentCategoryMutation,
  useCreateParentCategoryMutation,
  useUpdateParentCategoryMutation,
} from "../../api/parentCategoryApi";

import {
  useGetAllCategoriesQuery,
  useDeleteCategoryMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "../../api/categoryApi";

import {
  useGetAllKeywordsQuery,
  useDeleteKeywordMutation,
  useCreateKeywordMutation,
  useUpdateKeywordMutation,
} from "../../api/keywordApi";

import PageHeader from "../../components/Common/PageHeader";
import DeleteModal from "../../components/Common/DeleteModal";

import AddParentCategoryModal from "../../components/Categories/AddParentCategoryModal";
import AddCategoryModal from "../../components/Categories/AddCategoryModal";
import AddKeywordModal from "../../components/Categories/AddKeywordModal";

import "../../components/Categories/category.css";

const { TabPane } = Tabs;
const { Search } = Input;

const CategoryManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "parent";

  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [showParentModal, setShowParentModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // === Queries ===
  const { data: parentData, refetch: refetchParents } =
    useGetAllParentCategoriesQuery();

  const { data: catData, refetch: refetchCategories } =
    useGetAllCategoriesQuery();

  const { data: kwData, refetch: refetchKeywords } = useGetAllKeywordsQuery();

  // === Mutations ===
  const [deleteParent] = useDeleteParentCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [deleteKeyword] = useDeleteKeywordMutation();

  const [createParent] = useCreateParentCategoryMutation();
  const [updateParent] = useUpdateParentCategoryMutation();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [createKeyword] = useCreateKeywordMutation();
  const [updateKeyword] = useUpdateKeywordMutation();

  // === Data Extraction ===
  const parentCategories = parentData?.data || [];
  const categories = catData?.categories || [];
  const keywords = kwData || []; // Important: transformResponse already returns array

  // === Mappings ===
  const parentMap = useMemo(() => {
    const map = {};
    parentCategories.forEach((p) => (map[p.id] = p.name));
    return map;
  }, [parentCategories]);

  // === Filtered Data ===
  const filteredParents = useMemo(() => {
    if (!searchTerm.trim()) return parentCategories;
    const term = searchTerm.toLowerCase();
    return parentCategories.filter((p) => p.name?.toLowerCase().includes(term));
  }, [parentCategories, searchTerm]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter((c) => c.name?.toLowerCase().includes(term));
  }, [categories, searchTerm]);

  const filteredKeywords = useMemo(() => {
    if (!searchTerm.trim()) return keywords;
    const term = searchTerm.toLowerCase();
    return keywords.filter((k) => k.keyword?.toLowerCase().includes(term));
  }, [keywords, searchTerm]);

  // === Handlers ===
  const handleTabChange = (key) => {
    setSearchParams({ tab: key });
    setSearchTerm("");
  };

  const openModal = (type, item = null) => {
    setEditingItem(item ? { ...item, type } : null);

    if (type === "parent") setShowParentModal(true);
    else if (type === "category") setShowCategoryModal(true);
    else if (type === "keyword") setShowKeywordModal(true);
  };

  const openDeleteModal = (type, id) => {
    setDeleteType(type);
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleModalSuccess = () => {
    if (currentTab === "parent") refetchParents();
    else if (currentTab === "category") refetchCategories();
    else refetchKeywords();
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

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
      message.error(err?.data?.message || `Failed to delete ${deleteType}`);
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
      setDeleteType(null);
    }
  };

  const closeModals = () => {
    setShowParentModal(false);
    setShowCategoryModal(false);
    setShowKeywordModal(false);
    setEditingItem(null);
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Category Management"
            subtitle="Manage Parent Categories, Categories & Keywords"
            onAdd={() => {
              if (currentTab === "parent") openModal("parent");
              else if (currentTab === "category") openModal("category");
              else openModal("keyword");
            }}
          />

          <div className="card-body">
            {/* Main Tabs */}
            <Tabs
              activeKey={currentTab}
              onChange={handleTabChange}
              className="mb-4"
            >
              <TabPane
                tab={
                  <span>
                    <i className="fas fa-folder me-2" /> Parent Categories
                  </span>
                }
                key="parent"
              />
              <TabPane
                tab={
                  <span>
                    <i className="fas fa-folder me-2" /> Categories
                  </span>
                }
                key="category"
              />
              <TabPane
                tab={
                  <span>
                    <i className="fas fa-tags me-2" /> Keywords
                  </span>
                }
                key="keyword"
              />
            </Tabs>

            {/* Search */}
            <div className="row mb-4">
              <div className="col-lg-6" />
              <div className="col-lg-6 text-lg-end">
                <div style={{ maxWidth: "340px", marginLeft: "auto" }}>
                  <Search
                    placeholder={
                      currentTab === "parent"
                        ? "Search parent categories..."
                        : currentTab === "category"
                          ? "Search categories..."
                          : "Search keywords..."
                    }
                    allowClear
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tables */}
            {currentTab === "parent" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Parent Category Name</th>
                      <th style={{ width: 140 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParents.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.name}</strong>
                        </td>
                        <td>
                          <Tooltip title="Edit">
                            <EditOutlined
                              className="me-3 text-primary"
                              style={{ cursor: "pointer", fontSize: 18 }}
                              onClick={() => openModal("parent", item)}
                            />
                          </Tooltip>
                          <Dropdown
                            overlay={
                              <Menu>
                                <Menu.Item
                                  danger
                                  onClick={() =>
                                    openDeleteModal("parent", item.id)
                                  }
                                >
                                  <DeleteOutlined /> Delete
                                </Menu.Item>
                              </Menu>
                            }
                            trigger={["click"]}
                          >
                            <Button
                              type="text"
                              icon={<MoreOutlined style={{ fontSize: 18 }} />}
                            />
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {currentTab === "category" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Category Name</th>
                      <th>Parent Category</th>
                      <th style={{ width: 140 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((item) => (
                      <tr key={item.categoryId}>
                        <td>
                          <strong>{item.name}</strong>
                        </td>
                        <td className="text-muted">
                          {parentMap[item.parentCategoryId] || "—"}
                        </td>
                        <td>
                          <Tooltip title="Edit">
                            <EditOutlined
                              className="me-3 text-primary"
                              style={{ cursor: "pointer", fontSize: 18 }}
                              onClick={() => openModal("category", item)}
                            />
                          </Tooltip>
                          <Dropdown
                            overlay={
                              <Menu>
                                <Menu.Item
                                  danger
                                  onClick={() =>
                                    openDeleteModal("category", item.categoryId)
                                  }
                                >
                                  <DeleteOutlined /> Delete
                                </Menu.Item>
                              </Menu>
                            }
                            trigger={["click"]}
                          >
                            <Button
                              type="text"
                              icon={<MoreOutlined style={{ fontSize: 18 }} />}
                            />
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {currentTab === "keyword" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Keyword</th>
                      <th>Category</th>
                      <th style={{ width: 140 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKeywords.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.keyword}</strong>
                        </td>
                        <td className="text-muted">
                          {categories.find(
                            (c) => c.categoryId === item.categoryId,
                          )?.name || "—"}
                        </td>
                        <td>
                          <Tooltip title="Edit">
                            <EditOutlined
                              className="me-3 text-primary"
                              style={{ cursor: "pointer", fontSize: 18 }}
                              onClick={() => openModal("keyword", item)}
                            />
                          </Tooltip>
                          <Dropdown
                            overlay={
                              <Menu>
                                <Menu.Item
                                  danger
                                  onClick={() =>
                                    openDeleteModal("keyword", item.id)
                                  }
                                >
                                  <DeleteOutlined /> Delete
                                </Menu.Item>
                              </Menu>
                            }
                            trigger={["click"]}
                          >
                            <Button
                              type="text"
                              icon={<MoreOutlined style={{ fontSize: 18 }} />}
                            />
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <AddParentCategoryModal
          open={showParentModal}
          onClose={closeModals}
          editMode={!!editingItem && editingItem.type === "parent"}
          parentCategoryData={
            editingItem?.type === "parent" ? editingItem : null
          }
          onSuccess={handleModalSuccess}
        />

        <AddCategoryModal
          open={showCategoryModal}
          onClose={closeModals}
          editMode={!!editingItem && editingItem.type === "category"}
          categoryData={editingItem?.type === "category" ? editingItem : null}
          onSuccess={handleModalSuccess}
        />

        <AddKeywordModal
          open={showKeywordModal}
          onClose={closeModals}
          editData={editingItem?.type === "keyword" ? editingItem : null}
          onSuccess={handleModalSuccess}
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
        />
      </div>
    </div>
  );
};

export default CategoryManagement;
