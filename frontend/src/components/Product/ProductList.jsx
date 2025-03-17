import React, { useState, useEffect } from "react";
import PageHeader from "../Common/PageHeader";
import Actions from "../Common/Actions";
import { useGetAllProductsQuery } from "../../api/productApi";
import DataTablePagination from "../Common/DataTablePagination";
import TableHeader from "../Common/TableHeader";
import DeleteModal from "../Common/DeleteModal";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import StockModal from "../Common/StockModal";
import HistoryModal from "../Common/HistoryModal";
import { useNavigate } from "react-router-dom";

const ProductList = () => {
  const navigate = useNavigate();
  const { data, error, isLoading } = useGetAllProductsQuery();
  const products = Array.isArray(data) ? data : [];
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: brandsData } = useGetAllBrandsQuery();
  const categories = Array.isArray(categoriesData?.categories)
    ? categoriesData.categories
    : [];
  const brands = Array.isArray(brandsData) ? brandsData : [];

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
  const itemsPerPage = 20;

  useEffect(() => {
    if (currentPage >= Math.ceil(products.length / itemsPerPage)) {
      setCurrentPage(0);
    }
  }, [products.length, currentPage]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching products.</p>;
  if (products.length === 0) return <p>No products available.</p>;

  const offset = currentPage * itemsPerPage;
  const currentItems = products.slice(offset, offset + itemsPerPage);

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleConfirmDelete = () => {
    console.log("Deleting product:", selectedProduct);
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
    console.log("Stock updated:", stockData);
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
          <TableHeader />
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Product Name</th>
                    <th>Product Code</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Stock In/Out/History</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((product) => (
                    <tr key={product.productId}>
                      <td>{product.name}</td>
                      <td>{product.product_code}</td>
                      <td>{getCategoryName(product.categoryId)}</td>
                      <td>{getBrandsName(product.brandId)}</td>
                      <td>{product.sellingPrice}</td>
                      <td>{product.quantity}</td>
                      <td>
                        <button
                          type="button"
                          class="btn btn-secondary"
                          onClick={() => openStockModal(product)}
                        >
                          Stock
                        </button>
                        <button
                          type="button"
                          class="btn btn-secondary"
                          onClick={() => openHistoryModal(product)}
                        >
                          History
                        </button>
                      </td>

                      <td>
                        {new Date(product.createdAt).toLocaleDateString()}
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
            </div>
          </div>
        </div>

        <DataTablePagination
          totalItems={products.length}
          itemNo={itemsPerPage}
          onPageChange={(selectedPage) => setCurrentPage(selectedPage - 1)}
        />

        <DeleteModal
          item={selectedProduct}
          itemType="Product"
          isVisible={isModalVisible}
          onConfirm={handleConfirmDelete}
          onCancel={() => setModalVisible(false)}
        />

        <StockModal
          show={isStockModalVisible}
          onHide={() => setStockModalVisible(false)}
          onSubmit={handleStockSubmit}
          product={selectedProduct}
        />
        <HistoryModal
          show={isHistoryModalVisible}
          onHide={() => setHistoryModalVisible(false)}
          history={stockHistory}
          product={selectedProduct}
        />
      </div>
    </div>
  );
};

export default ProductList;
