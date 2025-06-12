import React from "react";
import mainWrapper from "../../assets/img/products/product_page_title.png";
import surfaces from "../../assets/img/products/surfaces.jpg";
import fittings from "../../assets/img/products/cp_fittings.png";
import wellness from "../../assets/img/products/wellness.jpg";
import adhesive from "../../assets/img/products/adhesive.jpg";
import "./productwrapper.css";
const ProductWrapper = () => {
  // Define categories data for better maintainability
  const categories = [
    { name: "TILES", image: surfaces, alt: "TILES" },
    { name: "MOSAICS", image: fittings, alt: "MOSAICS" },
    { name: "HANDMADE TILES", image: wellness, alt: "HANDMADE TILES" },
  ];

  return (
    <section className="page-wrapper">
      <div className="content">
        {/* Hero image with proper alt text */}
        <img
          src={mainWrapper}
          alt="Product page banner"
          className="product-main-wrapper"
        />
        {/* Categories grid for responsive layout */}
        <div className="categories-wrapper">
          {categories.map((category, index) => (
            <div key={index} className="categories-card">
              <img
                src={category.image}
                alt={category.alt}
                className="categories-img"
              />
              <h2 className="categories-text">{category.name}</h2>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductWrapper;
