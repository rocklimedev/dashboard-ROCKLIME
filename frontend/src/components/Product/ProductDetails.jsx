import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useGetProductByIdQuery } from "../../api/productApi";
import axios from "axios";
import JsBarcode from "jsbarcode"; // Import JsBarcode for barcode generation

const ProductDetails = () => {
  const { id } = useParams(); // Get product ID from URL
  const { data: product, error, isLoading } = useGetProductByIdQuery(id); // Fetch product details
  const [imageUrl, setImageUrl] = useState(""); // State for storing the image URL
  const [barcodeData, setBarcodeData] = useState(""); // State to store UUID for barcode generation

  // Function to check for the existence of the image with various formats
  const checkProductImage = async (companyCode) => {
    const formats = ["png", "jpg", "jpeg"]; // List of formats to check
    for (let format of formats) {
      try {
        const imageUrl = `https://static.cmtradingco.com/product_images/${companyCode}.${format}`;
        const response = await axios.head(imageUrl); // Use HEAD request to check if the image exists
        if (response.status === 200) {
          setImageUrl(imageUrl); // If image exists, set the URL
          return; // Exit the loop once a valid image is found
        }
      } catch (error) {
        // If image doesn't exist in this format, continue to the next format
        continue;
      }
    }

    // If no image is found, set the placeholder
    setImageUrl("assets/img/products/default.jpg");
  };

  // Generate barcode based on UUID
  const generateBarcode = (uuid) => {
    if (uuid) {
      JsBarcode("#barcode", uuid, {
        format: "CODE128", // Barcode format
        lineColor: "#000", // Color of the barcode lines
        width: 2, // Width of the barcode lines
        height: 40, // Height of the barcode
        displayValue: true, // Show the UUID value under the barcode
      });
    }
  };

  // Run the check on product load and barcode generation
  useEffect(() => {
    if (product?.company_code) {
      checkProductImage(product.company_code);
    }

    if (product?.product_code) {
      setBarcodeData(product.product_code); // Set the UUID (product_code in this case) for barcode
    }
  }, [product]);

  useEffect(() => {
    if (barcodeData) {
      generateBarcode(barcodeData); // Generate the barcode when UUID changes
    }
  }, [barcodeData]);

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
                  {/* Render Barcode */}
                  <svg id="barcode" /> {/* Barcode will be rendered here */}
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
                    {/* Display the product image based on the company code */}
                    <div className="slider-product">
                      <img
                        src={imageUrl}
                        alt={product?.company_code || "Product Image"}
                      />
                      <h4>{product?.company_code || "Image"}</h4>
                    </div>
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
