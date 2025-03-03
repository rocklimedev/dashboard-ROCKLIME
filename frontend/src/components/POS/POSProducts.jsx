import React, { useState, useEffect } from "react";
import POSCategories from "./POSCategories";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import DataTablePagination from "../Common/DataTablePagination";

const POSProducts = () => {
  const { data: productsData, error, isLoading } = useGetAllProductsQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();

  const products = Array.isArray(productsData) ? productsData : [];
  const categories = Array.isArray(categoriesData?.categories)
    ? categoriesData.categories
    : [];

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.categoryId === categoryId);
    return category ? category.name : "Uncategorized";
  };

  const [currentPage, setCurrentPage] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  const handleCancelDelete = () => {
    setModalVisible(false);
  };

  return (
    <div className="pos-container">
      <div className="pos-products">
        <div className="tabs_container">
          <div className="tab_content active" data-tab="all">
            <div className="row g-3">
              {currentItems.map((product) => (
                <div
                  key={product.id}
                  className="col-sm-6 col-md-6 col-lg-6 col-xl-4 col-xxl-3"
                >
                  <div className="product-info card mb-0">
                    <a href="javascript:void(0);" className="pro-img">
                      <img
                        src={product.image || "assets/img/default-product.png"}
                        alt={product.name}
                      />
                      <span>
                        <i className="ti ti-circle-check-filled"></i>
                      </span>
                    </a>
                    <h6 className="cat-name">
                      <a href="javascript:void(0);">
                        {getCategoryName(product.categoryId)}
                      </a>
                    </h6>
                    <h6 className="product-name">
                      <a href="javascript:void(0);">{product.name}</a>
                    </h6>
                    <div className="d-flex align-items-center justify-content-between price">
                      <span>{product.quantity} Pcs</span>
                      <p className="text-gray-9 mb-0">
                        ₹{product.sellingPrice}
                      </p>
                      <div className="qty-item m-0">
                        <a
                          href="javascript:void(0);"
                          className="dec d-flex justify-content-center align-items-center"
                        >
                          <i className="ti ti-minus"></i>
                        </a>
                        <input
                          type="text"
                          className="form-control text-center"
                          name="qty"
                          value="1"
                          readOnly
                        />
                        <a
                          href="javascript:void(0);"
                          className="inc d-flex justify-content-center align-items-center"
                        >
                          <i className="ti ti-plus"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DataTablePagination
            totalItems={products.length}
            itemNo={itemsPerPage}
            onPageChange={(selectedPage) => setCurrentPage(selectedPage - 1)}
          />
        </div>
      </div>
      {isModalVisible && (
        <div className="modal">
          <div className="modal-content">
            <p>Are you sure you want to delete {selectedProduct?.name}?</p>
            <button onClick={handleConfirmDelete} className="btn btn-danger">
              Yes
            </button>
            <button onClick={handleCancelDelete} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSProducts;
