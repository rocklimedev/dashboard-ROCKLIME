import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import PageHeader from "../Common/PageHeader";
import Actions from "../Common/Actions";
import {
  useGetAllProductsQuery,
  useDeleteProductMutation, // Add this import
} from "../../api/productApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import DataTablePagination from "../Common/DataTablePagination";
import TableHeader from "./TableHeader";
import DeleteModal from "../Common/DeleteModal";
import StockModal from "../Common/StockModal";
import HistoryModal from "../Common/HistoryModal";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify"; // Add toast for notifications
import "react-toastify/dist/ReactToastify.css";

const ProductList = () => {
  const navigate = useNavigate();
  const { data, error, isLoading } = useGetAllProductsQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: brandsData } = useGetAllBrandsQuery();
  const { data: customersData } = useGetCustomersQuery();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation(); // Add mutation

  const products = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];

  const categories = Array.isArray(categoriesData?.categories)
    ? categoriesData.categories
    : [];

  const brands = Array.isArray(brandsData) ? brandsData : [];

  const customers = Array.isArray(customersData?.data)
    ? customersData.data
    : [];

  const [currentPage, setCurrentPage] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isStockModalVisible, setStockModalVisible] = useState(false);
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [stockHistoryMap, setStockHistoryMap] = useState({});

  const [filters, setFilters] = useState({
    createdBy: null,
    category: null,
    brand: null,
    sortBy: null,
    search: "",
    company_code: "",
  });

  const itemsPerPage = 20;

  const getBrandsName = (brandId) => {
    if (!brandId) return "NOT BRANDED";
    const brand = brands.find((b) => b.id === brandId);
    return brand ? brand.brandName : "NOT BRANDED";
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.categoryId === categoryId);
    return category ? category.name : "Uncategorized";
  };

  const applyFilters = (customers = []) => {
    if (!products) return [];

    let filtered = products.filter((product) => {
      const customer = customers.find((c) => c._id === product.customerId);
      const createdByName = customer?.name || "";

      const matchesCreator =
        !filters.createdBy || createdByName === filters.createdBy;

      const matchesCategory =
        !filters.category || product.categoryId === filters.category;

      const matchesBrand = !filters.brand || product.brandId === filters.brand;

      const searchTerm = filters.search?.toLowerCase() || "";
      const matchesSearch =
        !searchTerm ||
        (product.name?.toLowerCase() || "").includes(searchTerm) ||
        (product.product_code?.toLowerCase() || "").includes(searchTerm) ||
        (product.company_code?.toLowerCase() || "").includes(searchTerm);

      let matchesDate = true;
      if (filters.sortBy === "Last 7 Days") {
        const daysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = new Date(product.createdAt) >= daysAgo;
      } else if (filters.sortBy === "Last Month") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        matchesDate = new Date(product.createdAt) >= oneMonthAgo;
      }

      return (
        matchesCreator &&
        matchesCategory &&
        matchesBrand &&
        matchesSearch &&
        matchesDate
      );
    });

    if (filters.sortBy === "Ascending") {
      filtered.sort((a, b) => a.name?.localeCompare(b.name || ""));
    } else if (filters.sortBy === "Descending") {
      filtered.sort((a, b) => b.name?.localeCompare(a.name || ""));
    } else if (filters.sortBy === "Recently Added") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return filtered;
  };

  const filteredProducts = applyFilters(customers);

  useEffect(() => {
    if (
      filteredProducts.length > 0 &&
      currentPage >= Math.ceil(filteredProducts.length / itemsPerPage)
    ) {
      setCurrentPage(0);
    }
  }, [filteredProducts.length, currentPage]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching products: {JSON.stringify(error)}</p>;
  if (products.length === 0) return <p>No products available.</p>;

  const offset = currentPage * itemsPerPage;
  const currentItems = filteredProducts.slice(offset, offset + itemsPerPage);

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct?.productId) {
      toast.error("No product selected for deletion");
      setModalVisible(false);
      return;
    }

    try {
      await deleteProduct(selectedProduct.productId).unwrap();
      toast.success("Product deleted successfully!");
      // Adjust pagination if the current page becomes empty
      if (currentItems.length === 1 && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(
        `Failed to delete product: ${error.data?.message || "Unknown error"}`
      );
    } finally {
      setModalVisible(false);
      setSelectedProduct(null);
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
    const updatedStock = {
      ...stockData,
      productId: selectedProduct.productId,
      date: new Date(),
    };

    setStockHistoryMap((prev) => {
      const productId = selectedProduct.productId;
      const newHistory = [...(prev[productId] || []), updatedStock];
      return { ...prev, [productId]: newHistory };
    });

    setStockModalVisible(false);
  };

  const handleAddProduct = () => {
    navigate("/inventory/product/add");
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockModalVisible(true);
  };

  const openHistoryModal = (product) => {
    setSelectedProduct(product);
    setHistoryModalVisible(true);
  };

  return (
    <div className="page-wrapper">
      <ToastContainer />
      <div className="content">
        <PageHeader
          title="Products"
          subtitle="Manage your product inventory"
          onAdd={handleAddProduct}
        />

        <div className="card">
          <TableHeader filters={filters} setFilters={setFilters} />

          <div className="card-body p-0">
            <div className="table-responsive">
              {filteredProducts.length === 0 ? (
                <p className="text-center mt-3">
                  No products match your search.
                </p>
              ) : (
                <table className="table datatable">
                  <thead className="thead-light">
                    <tr>
                      <th>#</th>
                      <th>Product Name</th>
                      <th>Product Code</th>
                      <th>Company Code</th>
                      <th>Category</th>
                      <th>Brand</th>
                      <th>Stock</th>
                      <th>Stock In/Out - History</th>
                      <th>Created By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((product) => (
                      <tr key={product.productId}>
                        <td>
                          <span>
                            <img
                              className="img-fluid"
                              src={product?.images}
                              style={{
                                maxHeight: "300px",
                                objectFit: "contain",
                              }}
                              alt={product.company_code}
                            />{" "}
                          </span>
                        </td>
                        <td> {product.name || "N/A"}</td>
                        <td>{product.product_code || "N/A"}</td>
                        <td>{product.company_code || "N/A"}</td>
                        <td>{getCategoryName(product.categoryId)}</td>
                        <td>{getBrandsName(product.brandId)}</td>
                        <td>{product.quantity ?? 0}</td>
                        <td>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => openStockModal(product)}
                            className="me-2"
                          >
                            Stock
                          </Button>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => openHistoryModal(product)}
                          >
                            History
                          </Button>
                        </td>
                        <td>
                          {customers.find((c) => c._id === product.customerId)
                            ?.name || "Unknown"}
                        </td>
                        <td>
                          <Actions
                            viewUrl={`/product/${product.productId}`}
                            editUrl={`/product/${product.productId}/edit`}
                            onDelete={() => handleDeleteClick(product)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {filteredProducts.length > 0 && (
            <DataTablePagination
              currentPage={currentPage}
              onPageChange={setCurrentPage} // ✅ match the expected prop
              totalItems={filteredProducts.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <DeleteModal
        isVisible={isModalVisible}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setModalVisible(false);
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
        />
      )}
      {isHistoryModalVisible && selectedProduct && (
        <HistoryModal
          show={isHistoryModalVisible}
          onHide={() => setHistoryModalVisible(false)}
          product={selectedProduct}
        />
      )}
    </div>
  );
};

export default ProductList;
