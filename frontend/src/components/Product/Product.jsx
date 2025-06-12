import React from "react";
import mainWrapper from "../../assets/img/products/product_page_title.png";
import surfaces from "../../assets/img/products/surfaces.jpg";
import fittings from "../../assets/img/products/cp_fittings.png";
import wellness from "../../assets/img/products/wellness.jpg";
import adhesive from "../../assets/img/products/adhesive.jpg";
import "./productwrapper.css";
const Product = () => {
  const categories = [
    { name: "TILES", image: surfaces, alt: "TILES" },
    { name: "MOSAICS", image: fittings, alt: "MOSAICS" },
    { name: "HANDMADE TILES", image: wellness, alt: "HANDMADE TILES" },
    { name: "HANJI HANJI", image: wellness, alt: "ARPIT " },
    { name: "HANJI HANJI", image: wellness, alt: "ARPIT " },
    { name: "HANJI HANJI", image: wellness, alt: "ARPIT " },
    { name: "HANJI HANJI", image: wellness, alt: "ARPIT " },
    { name: "HANJI HANJI", image: wellness, alt: "ARPIT " },
    { name: "HANJI HANJI", image: wellness, alt: "ARPIT " },
    { name: "HANJI HANJI", image: wellness, alt: "ARPIT " },
    { name: "HANJI HANJI", image: wellness, alt: "ARPIT " },
    { name: "HANJI HANJI", image: wellness, alt: "ARPIT " },
    { name: "HANJI HANJI", image: wellness, alt: "ARPIT " },
    { name: "HANJI HANJI", image: wellness, alt: "ARPIT " },
    { name: "HANJI HANJI", image: wellness, alt: "ARPIT " },
  ];
  return (
    <section className="page-wrapper">
      <div className="content">
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

export default Product;
