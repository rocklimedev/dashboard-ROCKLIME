import React from "react";
import { useParams } from "react-router-dom";
import { useGetProductByIdQuery } from "../../api/productApi";

const ProductDetails = () => {
  const { id } = useParams(); // Get product ID from URL
  const { data: product, error, isLoading } = useGetProductByIdQuery(id); // Fetch product details

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="page-title">
            <h4>Product Details</h4>
            <h6>Full details of a product</h6>
          </div>
        </div>

        <div className="row">
          {/* Left Side - Product Details */}
          <div className="col-lg-8 col-sm-12">
            <div className="card">
              <div className="card-body">
                <div className="bar-code-view">
                  <img src="assets/img/barcode/barcode1.png" alt="barcode" />
                  <a className="printimg">
                    <img src="assets/img/icons/printer.svg" alt="print" />
                  </a>
                </div>
                <div className="productdetails">
                  <ul className="product-bar">
                    <li>
                      <h4>Product</h4>
                      <h6>{product?.name || "N/A"}</h6>
                    </li>
                    <li>
                      <h4>Product Group</h4>
                      <h6>{product?.productGroup || "N/A"}</h6>
                    </li>
                    <li>
                      <h4>Product Segment</h4>
                      <h6>{product?.product_segment || "N/A"}</h6>
                    </li>
                    <li>
                      <h4>Company Code</h4>
                      <h6>{product?.company_code || "N/A"}</h6>
                    </li>
                    <li>
                      <h4>Product Code </h4>
                      <h6>{product?.product_code || "N/A"}</h6>
                    </li>
                    <li>
                      <h4>Category</h4>
                      <h6>{product?.category || "N/A"}</h6>
                    </li>
                    <li>
                      <h4>Sub Category</h4>
                      <h6>{product?.subCategory || "None"}</h6>
                    </li>
                    <li>
                      <h4>Brand</h4>
                      <h6>{product?.brand || "None"}</h6>
                    </li>

                    <li>
                      <h4>Tax</h4>
                      <h6>{product?.tax ? `${product.tax} %` : "0.00 %"}</h6>
                    </li>

                    <li>
                      <h4>Price</h4>
                      <h6>
                        {product?.sellingPrice
                          ? `$${product.sellingPrice}`
                          : "N/A"}
                      </h6>
                    </li>
                    <li>
                      <h4>Status</h4>
                      <h6>{product?.status || "N/A"}</h6>
                    </li>
                    <li>
                      <h4>Description</h4>
                      <h6>
                        {product?.description || "No description available."}
                      </h6>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Product Images */}
          <div className="col-lg-4 col-sm-12">
            <div className="card">
              <div className="card-body">
                <div className="slider-product-details">
                  <div className="owl-carousel owl-theme product-slide">
                    {Array.isArray(product?.images) &&
                    product.images.length > 0 ? (
                      product.images.map((img, index) => (
                        <div className="slider-product" key={index}>
                          <img
                            src={img?.url || "assets/img/products/default.jpg"}
                            alt={img?.filename || "Product Image"}
                          />
                          <h4>{img?.filename || "Image"}</h4>
                          <h6>{img?.size || "Unknown Size"}</h6>
                        </div>
                      ))
                    ) : (
                      <div>No images available</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
