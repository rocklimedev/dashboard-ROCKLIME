import React, { useState, useEffect } from "react";
import PageHeader from "../Common/PageHeader";
import Actions from "../Common/Actions";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import DataTablePagination from "../Common/DataTablePagination";
import TableHeader from "./TableHeader";
import DeleteModal from "../Common/DeleteModal";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import StockModal from "../Common/StockModal";
import HistoryModal from "../Common/HistoryModal";
import { useNavigate } from "react-router-dom";

const ProductList = () => {
  const navigate = useNavigate();
  const { data, error, isLoading } = useGetAllProductsQuery();

  const products = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: brandsData } = useGetAllBrandsQuery();
  const { data: customersData } = useGetCustomersQuery();
  const categories = Array.isArray(categoriesData?.categories)
    ? categoriesData.categories
    : [];
  const brands = Array.isArray(brandsData) ? brandsData : [];
  const customers = Array.isArray(customersData?.data)
    ? customersData.data
    : [];

  const getBrandsName = (brandId) => {
    if (!brandId) return "NOT BRANDED";
    const brand = brands.find((b) => b.id === brandId);
    return brand ? brand.brandName : "NOT BRANDED";
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.categoryId === categoryId);
    return category ? category.name : "Uncategorized";
  };

  const [currentPage, setCurrentPage] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isStockModalVisible, setStockModalVisible] = useState(false);
  const [isHistoryModalVisible, setHistoryModalVisible] = useState(false);
  const [stockHistory, setStockHistory] = useState([]);
  const [filters, setFilters] = useState({
    createdBy: null,
    category: null,
    brand: null,
    sortBy: null, // Disable default date filter
    search: "",
    company_code: "", // Added company_code filter
  });
  const itemsPerPage = 20;

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

      const matchesSearch =
        !filters.search ||
        (product.name &&
          product.name.toLowerCase().includes(filters.search.toLowerCase())) ||
        (product.product_code &&
          product.product_code
            .toLowerCase()
            .includes(filters.search.toLowerCase())) ||
        (product.company_code &&
          product.company_code
            .toLowerCase()
            .includes(filters.company_code.toLowerCase())); // Added company_code search

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

    // Apply sorting
    if (filters.sortBy === "Ascending") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sortBy === "Descending") {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    } else if (filters.sortBy === "Recently Added") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return filtered;
  };

  const filteredProducts = applyFilters(customers);

  useEffect(() => {
    if (currentPage >= Math.ceil(filteredProducts.length / itemsPerPage)) {
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

  const handleConfirmDelete = () => {
    setModalVisible(false);
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
    setStockHistory([...stockHistory, { ...stockData, date: new Date() }]);
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockModalVisible(true);
  };

  const openHistoryModal = (product) => {
    setSelectedProduct(product);
    setHistoryModalVisible(true);
  };

  const handleAddProduct = () => {
    navigate("/inventory/product/add");
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Products"
          subtitle="Manage your product inventory"
          onAdd={() => handleAddProduct()}
        />

        <div className="card">
          <TableHeader filters={filters} setFilters={setFilters} />

          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Product Name</th>
                    <th>Product Code</th>
                    <th>Company Code</th> {/* Added Company Code column */}
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Created By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((product) => (
                    <tr key={product.productId}>
                      <td>{product.name}</td>
                      <td>{product.product_code}</td>
                      <td>{product.company_code}</td>{" "}
                      {/* Display Company Code */}
                      <td>{getCategoryName(product.categoryId)}</td>
                      <td>{getBrandsName(product.brandId)}</td>
                      <td>
                        {
                          customers.find((c) => c._id === product.customerId)
                            ?.name
                        }
                      </td>
                      <td>
                        <Actions
                          onEdit={() =>
                            navigate(
                              `/inventory/product/edit/${product.productId}`
                            )
                          }
                          onDelete={() => handleDeleteClick(product)}
                          onStock={() => handleStockClick(product)}
                          onHistory={() => handleHistoryClick(product)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DataTablePagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={filteredProducts.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>

      {/* Modals for delete, stock, and history */}
      <DeleteModal
        isVisible={isModalVisible}
        onConfirm={handleConfirmDelete}
        onCancel={() => setModalVisible(false)}
        product={selectedProduct}
      />
      <StockModal
        isVisible={isStockModalVisible}
        onSubmit={handleStockSubmit}
        onClose={() => setStockModalVisible(false)}
        product={selectedProduct}
      />
      <HistoryModal
        isVisible={isHistoryModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        stockHistory={stockHistory}
      />
    </div>
  );
};

export default ProductList;
