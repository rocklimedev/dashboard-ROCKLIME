import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Spin, Empty } from "antd";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import mainWrapper from "../../assets/img/products/product_page_title.png";
import surfaces from "../../assets/img/products/surfaces.jpg";
import fittings from "../../assets/img/products/cp_fittings.png";
import wellness from "../../assets/img/products/wellness.jpg";
import adhesive from "../../assets/img/products/adhesive.jpg";
import "./productwrapper.css";

const Product = () => {
  const { data: categoriesData, isLoading, error } = useGetAllCategoriesQuery();
  const fallbackImages = [surfaces, fittings, wellness, adhesive];

  // Normalize categories data
  const categories = useMemo(() => {
    const cats = Array.isArray(categoriesData?.categories)
      ? categoriesData.categories
      : [];
    return cats.map((cat, index) => ({
      categoryId: cat.categoryId,
      name: cat.name,
      image: cat.imageUrl || fallbackImages[index % fallbackImages.length],
      alt: `${cat.name} products`,
      url: `/products/${cat.categoryId}`,
    }));
  }, [categoriesData]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
        <p>Loading categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <Empty
          description={`Error: ${error?.data?.message || "Unknown error"}`}
        />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="empty-container">
        <Empty description="No categories available." />
      </div>
    );
  }

  return (
    <section className="page-wrapper">
      <div className="content">
        <div className="banner-container">
          <img
            src={mainWrapper}
            alt="Product page banner"
            className="banner-image"
          />
          <div className="banner-overlay">
            <h2 className="banner-title">Our Products</h2>
            <p className="banner-subtitle">
              Explore our wide range of tiles, sanitary ware, adhesives, and
              more.
            </p>
          </div>
        </div>
        <div className="categories-wrapper">
          {categories.map((category) => (
            <div key={category.categoryId} className="categories-card">
              <Link to={category.url}>
                <img
                  src={category.image}
                  alt={category.alt}
                  className="categories-img"
                />
                <h2 className="categories-text">{category.name}</h2>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Product;
