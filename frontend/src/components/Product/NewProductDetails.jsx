import React from "react";
import "./newproduct.css";
import image from "../../assets/img/products/adhesive.jpg";
const NewProductDetails = () => {
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="product-wrapper">
          <div className="product-image-card">
            <img src={image} alt="" />
          </div>

          <button className="add-to-cart-button">Add to Cart</button>
        </div>
      </div>
    </div>
  );
};

export default NewProductDetails;
