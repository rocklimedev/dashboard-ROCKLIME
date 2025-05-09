import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useGetProductByIdQuery } from "../../api/productApi";
import { useGetCategoryByIdQuery } from "../../api/categoryApi";
import { useGetParentCategoryByIdQuery } from "../../api/parentCategoryApi";
import { useGetBrandByIdQuery } from "../../api/brandsApi";
import JsBarcode from "jsbarcode";
import { toast } from "react-toastify";
import Loader from "../../components/Common/Loader";
import noimage from "../../assets/img/default.png";
const ProductDetails = () => {
  const { id } = useParams();
  const {
    data: product,
    error: productError,
    isLoading: isProductLoading,
  } = useGetProductByIdQuery(id);
  const { data: categoryData, isLoading: isCategoryLoading } =
    useGetCategoryByIdQuery(product?.categoryId, {
      skip: !product?.categoryId,
    });
  const { data: parentCategoryData, isLoading: isParentCategoryLoading } =
    useGetParentCategoryByIdQuery(categoryData?.category?.parentCategoryId, {
      skip: !categoryData?.category?.parentCategoryId,
    });
  const {
    data: brandData,
    isLoading: isBrandLoading,
    error: brandError,
  } = useGetBrandByIdQuery(product?.brandId, { skip: !product?.brandId });
  const [barcodeData, setBarcodeData] = useState("");
  const barcodeRef = useRef(null);

  // Parse images from product.images
  const getParsedImages = (imageField) => {
    if (!imageField) return [];

    try {
      // Handle JSON string
      if (typeof imageField === "string") {
        const parsed = JSON.parse(imageField);
        if (Array.isArray(parsed))
          return parsed.filter((img) => img && typeof img === "string");
        if (typeof parsed === "string" && parsed.startsWith("http"))
          return [parsed];
      }
      // Handle array directly
      if (Array.isArray(imageField)) {
        return imageField.filter((img) => img && typeof img === "string");
      }
      return [];
    } catch (err) {
      // Fallback for raw string URLs
      if (typeof imageField === "string" && imageField.startsWith("http")) {
        return [imageField];
      }
      return [];
    }
  };

  // Generate barcode
  const generateBarcode = (code) => {
    if (code && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, code, {
          format: "CODE128",
          lineColor: "#000",
          width: 2,
          height: 40,
          displayValue: true,
        });
      } catch (error) {
        toast.error("Failed to generate barcode.");
      }
    }
  };

  // Print barcode
  const handlePrint = () => {
    if (barcodeRef.current) {
      const canvas = barcodeRef.current;
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <body onload="window.print();window.close()">
            <img src="${canvas.toDataURL()}" />
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast.error("No barcode available to print.");
    }
  };

  // Set barcode and log images
  useEffect(() => {
    if (product?.product_code) {
      setBarcodeData(product.product_code);
    }
  }, [product]);

  // Generate barcode when barcodeData changes
  useEffect(() => {
    if (barcodeData) {
      generateBarcode(barcodeData);
    }
  }, [barcodeData]);

  // Handle brand error
  useEffect(() => {
    if (brandError) {
      toast.error("Failed to load brand information.");
    }
  }, [brandError]);

  if (
    isProductLoading ||
    isCategoryLoading ||
    isParentCategoryLoading ||
    isBrandLoading
  ) {
    return <Loader loading={true} />;
  }

  if (productError) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p className="text-danger">
            Error: {productError.message || "Failed to load product"}
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-wrapper">
        <div className="content text-center">
          <p>Product not found.</p>
        </div>
      </div>
    );
  }

  const images = getParsedImages(product.images);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="page-title">
            <h4>Product Details</h4>
            <h6>Full details of {product.name || "product"}</h6>
          </div>
        </div>

        <div className="row">
          {/* Left Side - Product Details */}
          <div className="col-lg-8 col-sm-12">
            <div className="card">
              <div className="card-body">
                <div className="bar-code-view" aria-label="Product barcode">
                  <svg ref={barcodeRef} aria-hidden="true" />
                  <button
                    className="printimg"
                    onClick={handlePrint}
                    aria-label="Print barcode"
                    disabled={!barcodeData}
                  >
                    <img src="assets/img/icons/printer.svg" alt="Print" />
                  </button>
                </div>
                <div className="productdetails">
                  <ul className="product-bar">
                    <li>
                      <h4>Product</h4>
                      <h6>{product.name || "N/A"}</h6>
                    </li>
                    <li>
                      <h4>Product Group</h4>
                      <h6>{product.productGroup || "N/A"}</h6>
                    </li>
                    <li>
                      <h4>Product Segment</h4>
                      <h6>{product.product_segment || "N/A"}</h6>
                    </li>
                    <li>
                      <h4>Company Code</h4>
                      <h6>{product.company_code || "N/A"}</h6>
                    </li>
                    <li>
                      <h4>Product Code</h4>
                      <h6>{product.product_code || "N/A"}</h6>
                    </li>
                    <li>
                      <h4>Category</h4>
                      <h6>
                        {parentCategoryData?.data?.name ||
                          categoryData?.category?.name ||
                          "N/A"}
                      </h6>
                    </li>
                    <li>
                      <h4>Sub Category</h4>
                      <h6>{categoryData?.category?.name || "None"}</h6>
                    </li>
                    <li>
                      <h4>Brand</h4>
                      <h6>{brandData?.brandName || "N/A"}</h6>
                    </li>
                    <li>
                      <h4>Tax</h4>
                      <h6>
                        {product.tax
                          ? `${Number(product.tax).toFixed(2)}%`
                          : "0.00%"}
                      </h6>
                    </li>
                    <li>
                      <h4>Price</h4>
                      <h6>
                        {product.sellingPrice
                          ? `₹${Number(product.sellingPrice).toFixed(2)}`
                          : "N/A"}
                      </h6>
                    </li>
                    <li>
                      <h4>Stock Quantity</h4>
                      <h6>{product.quantity || "0"}</h6>
                    </li>
                    <li>
                      <h4>Alert Quantity</h4>
                      <h6>{product.alert_quantity || "0"}</h6>
                    </li>
                    <li>
                      <h4>Description</h4>
                      <h6>
                        {product.description || "No description available"}
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
                    {images.length > 0 ? (
                      images.map((img, idx) => (
                        <div className="slider-product" key={idx}>
                          <img
                            src={img}
                            alt={product?.name || "Product Image"}
                            className="img-fluid"
                            style={{
                              maxHeight: "300px",
                              objectFit: "contain",
                            }}
                            onError={(e) => {
                              e.target.src = noimage;
                            }}
                          />
                          <h4>{product?.company_code || `Image ${idx + 1}`}</h4>
                        </div>
                      ))
                    ) : (
                      <div className="slider-product">
                        <img
                          src={noimage}
                          alt="No Image"
                          className="img-fluid"
                          style={{
                            maxHeight: "300px",
                            objectFit: "contain",
                          }}
                        />
                        <h4>No images available</h4>
                      </div>
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
