import React from "react";
import mainWrapper from "../../assets/img/products/product_page_title.png";
import surfaces from "../../assets/img/icons/products/surfaces.png";
import fittings from "../../assets/img/icons/products/sanitary.png";
import wellness from "../../assets/img/icons/products/wellness.png";
import adhesive from "../../assets/img/icons/products/adhessive.png";
import "./productwrapper.css";
import { Link } from "react-router-dom";
const NewProductWrapper = () => {
  // Define categories data for better maintainability
  const categories = [
    {
      name: "Surfaces",
      image: surfaces,
      alt: "Surface products",
      url: "/inventory/list/:id",
    },
    {
      name: "CP Fittings",
      image: fittings,
      alt: "CP fittings products",
      url: "#",
    },
    { name: "Wellness", image: wellness, alt: "Wellness products", url: "#" },
    { name: "Adhesive", image: adhesive, alt: "Adhesive products", url: "#" },
  ];

  return (
    <section className="page-wrapper">
      <div className="content">
        {/* Categories grid for responsive layout */}
        <div className="categories-wrapper">
          {categories.map((category, index) => (
            <div key={index} className="categories-card">
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

export default NewProductWrapper;
