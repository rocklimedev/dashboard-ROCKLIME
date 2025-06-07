import React from "react";
import mainWrapper from "../../assets/img/products/product_page_title.png";
import surfaces from "../../assets/img/products/surfaces.jpg";
import fittings from "../../assets/img/products/cp_fittings.png";
import wellness from "../../assets/img/products/wellness.jpg";
import adhesive from "../../assets/img/products/adhesive.jpg";
import "./productwrapper.css";
const NewProductWrapper = () => {
  // Define categories data for better maintainability
  const categories = [
    { name: "Surfaces", image: surfaces, alt: "Surface products" },
    { name: "CP Fittings", image: fittings, alt: "CP fittings products" },
    { name: "Wellness", image: wellness, alt: "Wellness products" },
    { name: "Adhesive", image: adhesive, alt: "Adhesive products" },
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

export default NewProductWrapper;
