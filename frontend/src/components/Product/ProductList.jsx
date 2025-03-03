import React, { useState, useEffect } from "react";
import PageHeader from "../Common/PageHeader";
import Actions from "../Common/Actions";
import { useGetAllProductsQuery } from "../../api/productApi";
import DataTablePagination from "../Common/DataTablePagination";
import TableHeader from "../Common/TableHeader";
import DeleteModal from "../Common/DeleteModal";

const ProductList = () => {
  const { data, error, isLoading } = useGetAllProductsQuery();
  const products = Array.isArray(data) ? data : [];

  console.log("Total products:", products.length);

  const [currentPage, setCurrentPage] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const itemsPerPage = 20;

  useEffect(() => {
    if (currentPage >= Math.ceil(products.length / itemsPerPage)) {
      setCurrentPage(0); // Reset if out of bounds
    }
  }, [products.length, currentPage]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching products.</p>;
  if (products.length === 0) return <p>No products available.</p>;

  const offset = currentPage * itemsPerPage;
  const currentItems = products.slice(offset, offset + itemsPerPage);

  console.log("Current Page:", currentPage);
  console.log("Offset:", offset);
  console.log("Current Items:", currentItems);

  // Open delete modal
  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    console.log("Deleting product:", selectedProduct);
    // TODO: Replace with API call to delete product
    setModalVisible(false);
  };

  // Close modal
  const handleCancelDelete = () => {
    setModalVisible(false);
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader />

        <div className="card">
          <TableHeader />
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th class="no-sort">
                      <label class="checkboxs">
                        <input type="checkbox" id="select-all" />
                        <span class="checkmarks"></span>
                      </label>
                    </th>
                    <th>Product Name</th>
                    <th>Product Code</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Created By</th>
                    <th className="no-sort">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((product) => (
                    <tr key={product.productId}>
                      <td>
                        <label class="checkboxs">
                          <input type="checkbox" />
                          <span class="checkmarks"></span>
                        </label>
                      </td>
                      <td>{product.name}</td>
                      <td>{product.product_code}</td>
                      <td>{product.categoryId}</td>
                      <td>{product.brandId}</td>
                      <td>{product.sellingPrice}</td>
                      <td>{product.quantity}</td>
                      <td>James Kirwin</td>
                      <td>
                        <Actions onDelete={() => handleDeleteClick(product)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <DataTablePagination
          totalItems={products.length}
          itemNo={itemsPerPage}
          onPageChange={(selectedPage) => setCurrentPage(selectedPage - 1)}
        />

        {/* Delete Confirmation Modal */}
        <DeleteModal
          item={selectedProduct}
          itemType="Product"
          isVisible={isModalVisible}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </div>
    </div>
  );
};

export default ProductList;
