import React, { useState, useEffect } from "react";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useAddProductToCartMutation } from "../../api/cartApi";
import { useGetProfileQuery } from "../../api/userApi";
import DataTablePagination from "../Common/DataTablePagination";
import pos from "../../assets/img/default.png";
import { toast } from "react-toastify";

const POSProducts = ({ products = [] }) => {
  const { data: productsData, error, isLoading } = useGetAllProductsQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: user, isLoading: userLoading } = useGetProfileQuery();

  const userId = user?.user?.userId;
  const [addProductToCart, { isLoading: cartLoading }] =
    useAddProductToCartMutation();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;

  const categories = Array.isArray(categoriesData?.categories)
    ? categoriesData.categories
    : [];

  const baseProducts = Array.isArray(products) ? products : [];

  const displayedProducts = baseProducts.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (currentPage >= Math.ceil(displayedProducts.length / itemsPerPage)) {
      setCurrentPage(0);
    }
  }, [displayedProducts.length, currentPage]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const getCategoryName = (categoryId) => {
    return (
      categories.find((cat) => cat.categoryId === categoryId)?.name ||
      "Uncategorized"
    );
  };

  const handleAddToCart = async (product) => {
    if (!userId) {
      toast.error("User not logged in!");
      return;
    }

    const productId = product.productId || product.id;
    if (!productId) {
      toast.error("Invalid product ID");
      return;
    }

    try {
      await addProductToCart({ userId, productId }).unwrap();
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error(`Error: ${error.data?.message || "Unknown error"}`);
    }
  };

  if (isLoading || userLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching products.</p>;
  if (!displayedProducts.length) return <p>No products available.</p>;

  const offset = currentPage * itemsPerPage;
  const currentItems = displayedProducts.slice(offset, offset + itemsPerPage);

  return (
    <div className="pos-products">
      <div className="tabs_container">
        <div className="tab_content active">
          <div className="row g-3">
            {currentItems.map((product) => (
              <div
                key={product.id}
                className="col-sm-6 col-md-6 col-lg-4 col-xl-3"
              >
                <div className="product-info card mb-0">
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="pro-img"
                  >
                    <img src={product.images || pos} alt={product.name} />
                    <span
                      onClick={() => !cartLoading && handleAddToCart(product)}
                      style={{ cursor: "pointer" }}
                    >
                      <i className="ti ti-circle-check-filled"></i>
                    </span>
                  </a>
                  <h6 className="cat-name">
                    <a href="#" onClick={(e) => e.preventDefault()}>
                      {getCategoryName(product.categoryId)}
                    </a>
                  </h6>
                  <h6 className="product-name">
                    <a href="#" onClick={(e) => e.preventDefault()}>
                      {product.name}
                    </a>
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

        <DataTablePagination
          totalItems={displayedProducts.length}
          itemNo={itemsPerPage}
          onPageChange={(selectedPage) => setCurrentPage(selectedPage - 1)}
        />
      </div>
    </div>
  );
};

export default POSProducts;
