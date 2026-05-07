import React, { useState, useMemo } from "react";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import Avatar from "react-avatar";

import {
  useGetAllBrandsQuery,
  useDeleteBrandMutation,
} from "../../api/brandsApi";

import {
  useGetBrandParentCategoriesQuery,
  useDeleteBrandParentCategoryMutation,
} from "../../api/brandParentCategoryApi";

// Product Meta API
import {
  useGetAllProductMetaQuery,
  useDeleteProductMetaMutation,
} from "../../api/productMetaApi";

import {
  Dropdown,
  Menu,
  Button,
  Pagination,
  Tooltip,
  message,
  Tabs,
  Input,
} from "antd";
import DeleteModal from "../../components/Common/DeleteModal";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../../components/Common/PageHeader";

// Modals
import BrandFormModal from "../../components/Brands/BrandFormModal";
import BrandParentCategoryFormModal from "../../components/Brands/BrandParentCategoryFormModal";
import ProductMetaFormModal from "../../components/modals/ProductMetaModal";
const { TabPane } = Tabs;
const { Search } = Input;

const BrandList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentTab = searchParams.get("tab") || "brands";

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeBrandTab, setActiveBrandTab] = useState("All");

  const itemsPerPage = 20;

  // Modal States
  const [brandModalVisible, setBrandModalVisible] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [metaModalVisible, setMetaModalVisible] = useState(false);
  const [editingMeta, setEditingMeta] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Queries
  const { data: brandsData, refetch: refetchBrands } = useGetAllBrandsQuery();
  const { data: categoriesData, refetch: refetchCategories } =
    useGetBrandParentCategoriesQuery();
  const { data: metaData, refetch: refetchMeta } = useGetAllProductMetaQuery();

  const allBrands = brandsData?.brands || brandsData || [];
  const brandParentCategories = categoriesData || [];
  const allMetaFields = metaData || [];

  // Mutations
  const [deleteBrand, { isLoading: isDeletingBrand }] =
    useDeleteBrandMutation();
  const [deleteBrandParentCategory, { isLoading: isDeletingCategory }] =
    useDeleteBrandParentCategoryMutation();
  const [deleteProductMeta, { isLoading: isDeletingMeta }] =
    useDeleteProductMetaMutation();

  const safeJoin = (items) =>
    Array.isArray(items)
      ? items.map((i) => i?.name || i?.brandName || i).join(", ")
      : "—";

  // Grouped Brands
  const groupedBrands = useMemo(() => {
    const groups = { All: [...allBrands] };

    brandParentCategories.forEach((category) => {
      const brandsInCategory = allBrands.filter((brand) =>
        brand.brandParentCategories?.some(
          (bpc) =>
            bpc.id === category.id || bpc.brandParentCategoryId === category.id,
        ),
      );
      groups[category.name] = brandsInCategory;
    });

    return groups;
  }, [allBrands, brandParentCategories]);

  // Filtered Data
  const filteredBrands = useMemo(() => {
    let result = groupedBrands[activeBrandTab] || [];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((brand) =>
        [brand.brandName, brand.brandSlug]
          .filter(Boolean)
          .some((field) => field.toString().toLowerCase().includes(term)),
      );
    }
    return result;
  }, [groupedBrands, activeBrandTab, searchTerm]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return brandParentCategories;
    const term = searchTerm.toLowerCase();
    return brandParentCategories.filter((cat) =>
      [cat.name, cat.slug].some((field) =>
        field?.toString().toLowerCase().includes(term),
      ),
    );
  }, [brandParentCategories, searchTerm]);

  const filteredMeta = useMemo(() => {
    if (!searchTerm.trim()) return allMetaFields;
    const term = searchTerm.toLowerCase();
    return allMetaFields.filter((meta) =>
      [meta.title, meta.slug, meta.fieldType, meta.unit]
        .filter(Boolean)
        .some((field) => field.toString().toLowerCase().includes(term)),
    );
  }, [allMetaFields, searchTerm]);

  const activeMainTab =
    currentTab === "categories"
      ? "categories"
      : currentTab === "meta"
        ? "meta"
        : "brands";

  // Handle Tab Change
  const handleTabChange = (key) => {
    setSearchParams({ tab: key });
    if (key !== activeMainTab) {
      setSearchTerm("");
    }
  };

  // Modal Handlers
  const openBrandModal = (brand = null) => {
    setEditingBrand(brand);
    setBrandModalVisible(true);
  };

  const openCategoryModal = (category = null) => {
    setEditingCategory(category);
    setCategoryModalVisible(true);
  };

  const openMetaModal = (meta = null) => {
    setEditingMeta(meta);
    setMetaModalVisible(true);
  };

  const openDeleteModal = (type, id) => {
    setDeleteType(type);
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteType === "brand") {
        await deleteBrand(deleteId).unwrap();
        message.success("Brand deleted successfully");
        refetchBrands();
      } else if (deleteType === "category") {
        await deleteBrandParentCategory(deleteId).unwrap();
        message.success("Brand Category deleted successfully");
        refetchCategories();
      } else if (deleteType === "meta") {
        await deleteProductMeta(deleteId).unwrap();
        message.success("Meta field deleted successfully");
        refetchMeta();
      }
    } catch (err) {
      message.error(`Failed to delete ${deleteType}`);
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
      setDeleteType(null);
    }
  };

  const handleModalSuccess = () => {
    if (activeMainTab === "brands") refetchBrands();
    else if (activeMainTab === "categories") refetchCategories();
    else refetchMeta();
  };

  const handleViewBrand = (brand) => navigate(`/store/${brand.id}`);
  const handleEditBrand = (brand) => openBrandModal(brand);
  const handleViewCategory = (category) =>
    navigate(`/category-selector/${category.id}`);
  const handleEditCategory = (category) => openCategoryModal(category);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="card">
          <PageHeader
            title="Brands & Meta Management"
            subtitle="Manage Brands, Categories and Product Meta Fields"
            onAdd={() =>
              activeMainTab === "brands"
                ? openBrandModal()
                : activeMainTab === "categories"
                  ? openCategoryModal()
                  : openMetaModal()
            }
          />

          <div className="card-body">
            {/* Main Tabs */}
            <Tabs
              activeKey={activeMainTab}
              onChange={handleTabChange}
              className="mb-4"
            >
              <TabPane tab="Brands" key="brands" />
              <TabPane tab="Brand Categories" key="categories" />
              <TabPane tab="Meta Fields" key="meta" />
            </Tabs>

            {/* Search & Filter */}
            <div className="row mb-4 align-items-center">
              <div className="col-lg-6">
                {activeMainTab === "brands" && (
                  <div className="d-flex align-items-center gap-3 flex-wrap">
                    <div className="btn-group flex-wrap">
                      {["All", ...brandParentCategories.map((c) => c.name)].map(
                        (tab) => (
                          <button
                            key={tab}
                            className={`btn btn-sm ${
                              activeBrandTab === tab
                                ? "btn-primary"
                                : "btn-outline-secondary"
                            }`}
                            onClick={() => setActiveBrandTab(tab)}
                          >
                            {tab} ({groupedBrands[tab]?.length || 0})
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="col-lg-6 text-lg-end">
                <div style={{ maxWidth: "340px", marginLeft: "auto" }}>
                  <Search
                    placeholder={
                      activeMainTab === "brands"
                        ? "Search by brand name or slug..."
                        : activeMainTab === "categories"
                          ? "Search categories..."
                          : "Search meta fields by title, slug or type..."
                    }
                    allowClear
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Brands Table */}
            {activeMainTab === "brands" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 70 }}>Logo</th>
                      <th>Brand Name</th>
                      <th>Slug</th>
                      <th>Parent Categories</th>
                      <th style={{ width: 120 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBrands.map((brand) => (
                      <tr key={brand.id}>
                        <td>
                          <Avatar
                            src={brand.logo || undefined}
                            name={brand.brandName || "No Logo"}
                            size="40"
                            round
                          />
                        </td>
                        <td>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleViewBrand(brand);
                            }}
                            className="text-primary fw-medium"
                          >
                            {brand.brandName}
                          </a>
                        </td>
                        <td className="text-muted">{brand.brandSlug}</td>
                        <td>
                          <span className="badge bg-light text-dark">
                            {safeJoin(brand.brandParentCategories)}
                          </span>
                        </td>
                        <td>
                          <Tooltip title="Edit">
                            <EditOutlined
                              className="me-3 text-primary"
                              style={{ cursor: "pointer", fontSize: 18 }}
                              onClick={() => handleEditBrand(brand)}
                            />
                          </Tooltip>
                          <Dropdown
                            overlay={
                              <Menu>
                                <Menu.Item
                                  onClick={() => handleViewBrand(brand)}
                                >
                                  <EyeOutlined /> View
                                </Menu.Item>
                                <Menu.Item
                                  onClick={() => navigate(`/bulk-import/`)}
                                >
                                  <EyeOutlined /> Bulk Import
                                </Menu.Item>
                                <Menu.Item
                                  danger
                                  onClick={() =>
                                    openDeleteModal("brand", brand.id)
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

            {/* Brand Categories Table */}
            {activeMainTab === "categories" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Slug</th>
                      <th>Attached Brands</th>
                      <th style={{ width: 120 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr key={category.id}>
                        <td>
                          <strong>{category.name}</strong>
                        </td>
                        <td className="text-muted">{category.slug}</td>
                        <td>
                          <span className="badge bg-primary">
                            {category.brands?.length || 0} Brands
                          </span>
                        </td>
                        <td>
                          <Tooltip title="Edit">
                            <EditOutlined
                              className="me-3 text-primary"
                              style={{ cursor: "pointer", fontSize: 18 }}
                              onClick={() => handleEditCategory(category)}
                            />
                          </Tooltip>
                          <Dropdown
                            overlay={
                              <Menu>
                                <Menu.Item
                                  onClick={() => handleViewCategory(category)}
                                >
                                  <EyeOutlined /> View Details
                                </Menu.Item>
                                <Menu.Item
                                  danger
                                  onClick={() =>
                                    openDeleteModal("category", category.id)
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

            {/* Meta Fields Table */}
            {activeMainTab === "meta" && (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Title</th>
                      <th>Slug</th>
                      <th>Field Type</th>
                      <th>Unit</th>
                      <th style={{ width: 140 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMeta.map((meta) => (
                      <tr key={meta.id}>
                        <td>
                          <strong>{meta.title}</strong>
                        </td>
                        <td className="text-muted">{meta.slug || "—"}</td>
                        <td>
                          <span className="badge bg-info">
                            {meta.fieldType}
                          </span>
                        </td>
                        <td>{meta.unit || "—"}</td>
                        <td>
                          <Tooltip title="Edit">
                            <EditOutlined
                              className="me-3 text-primary"
                              style={{ cursor: "pointer", fontSize: 18 }}
                              onClick={() => openMetaModal(meta)}
                            />
                          </Tooltip>

                          <Dropdown
                            overlay={
                              <Menu>
                                <Menu.Item
                                  danger
                                  onClick={() =>
                                    openDeleteModal("meta", meta.id)
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

                {filteredMeta.length === 0 && (
                  <p className="text-center text-muted py-5">
                    No meta fields found.
                  </p>
                )}
              </div>
            )}

            {/* Pagination - Only for Brands */}
            {activeMainTab === "brands" && allBrands.length > itemsPerPage && (
              <div className="d-flex justify-content-end mt-4">
                <Pagination
                  current={currentPage}
                  pageSize={itemsPerPage}
                  total={allBrands.length}
                  onChange={setCurrentPage}
                  showSizeChanger={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <BrandFormModal
          visible={brandModalVisible}
          onCancel={() => {
            setBrandModalVisible(false);
            setEditingBrand(null);
          }}
          editingBrand={editingBrand}
          onSuccess={handleModalSuccess}
        />

        <BrandParentCategoryFormModal
          visible={categoryModalVisible}
          onCancel={() => {
            setCategoryModalVisible(false);
            setEditingCategory(null);
          }}
          editingCategory={editingCategory}
          onSuccess={handleModalSuccess}
        />

        <ProductMetaFormModal
          visible={metaModalVisible}
          onCancel={() => {
            setMetaModalVisible(false);
            setEditingMeta(null);
          }}
          editingMeta={editingMeta}
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
            deleteType === "brand"
              ? "Brand"
              : deleteType === "category"
                ? "Brand Category"
                : "Meta Field"
          }
          isLoading={
            deleteType === "brand"
              ? isDeletingBrand
              : deleteType === "category"
                ? isDeletingCategory
                : isDeletingMeta
          }
        />
      </div>
    </div>
  );
};

export default BrandList;
