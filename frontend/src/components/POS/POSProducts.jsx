import React, { useState, useEffect } from "react";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useAddToCartMutation } from "../../api/cartApi";
import { useGetProfileQuery } from "../../api/userApi"; // Fetch user data
import DataTablePagination from "../Common/DataTablePagination";
import pos from "../../assets/img/products/pos-product-01.jpg";

const POSProducts = () => {
  const { data: productsData, error, isLoading } = useGetAllProductsQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: user, isLoading: userLoading } = useGetProfileQuery(); // Fetch logged-in user
  const [addToCart] = useAddToCartMutation();

  const userId = user?.user?.userId; // Ensure userId is fetched correctly

  const products = Array.isArray(productsData) ? productsData : [];
  const categories = Array.isArray(categoriesData?.categories)
    ? categoriesData.categories
    : [];

  // Function to get category name
  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.categoryId === categoryId);
    return category ? category.name : "Uncategorized";
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    if (currentPage >= Math.ceil(products.length / itemsPerPage)) {
      setCurrentPage(0);
    }
  }, [products.length, currentPage]);

  // Handle add to cart
  const handleAddToCart = async (product) => {
    if (!userId) {
      alert("User not logged in!");
      return;
    }

    try {
      await addToCart({
        userId, // Include userId
        productId: product.id,
        quantity: 1,
      }).unwrap();

      alert(`${product.name} added to cart!`);
    } catch (error) {
      console.error("Failed to add to cart", error);
      alert("Error adding product to cart.");
    }
  };

  // Handle API loading and error states
  if (isLoading || userLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching products.</p>;
  if (products.length === 0) return <p>No products available.</p>;

  // Pagination logic
  const offset = currentPage * itemsPerPage;
  const currentItems = products.slice(offset, offset + itemsPerPage);

  return (
    <div className="pos-products">
      <div className="tabs_container">
        <div className="tab_content active" data-tab="all">
          <div className="row g-3">
            {currentItems.map((product) => (
              <div
                key={product.id}
                className="col-sm-6 col-md-6 col-lg-4 col-xl-3"
              >
                <div className="product-info card mb-0">
                  <a href="javascript:void(0);" className="pro-img">
                    <img src={product.image || pos} alt={product.name} />
                    <span
                      onClick={() => handleAddToCart(product)}
                      style={{ cursor: "pointer" }}
                    >
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
                    <p>₹{product.sellingPrice}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Component */}
        <DataTablePagination
          totalItems={products.length}
          itemNo={itemsPerPage}
          onPageChange={(selectedPage) => setCurrentPage(selectedPage - 1)}
        />
      </div>
    </div>
  );
};

export default POSProducts;
