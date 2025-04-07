import React, { useState } from "react";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetCustomersQuery } from "../../api/customerApi";

const TableHeader = ({ onFilterChange }) => {
  const { data: customersData } = useGetCustomersQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: brandsData } = useGetAllBrandsQuery();
  const { data: productsData } = useGetAllProductsQuery();

  const [selectedFilters, setSelectedFilters] = useState({
    createdBy: null,
    category: null,
    brand: null,
    sortBy: "Last 7 Days",
  });

  const handleFilterChange = (field, value) => {
    const updatedFilters = { ...selectedFilters, [field]: value };
    setSelectedFilters(updatedFilters);
    if (onFilterChange) onFilterChange(updatedFilters);
  };

  const handleClearFilter = (field) => {
    handleFilterChange(field, null);
  };

  const createdByList = [
    ...new Set(
      productsData?.data
        ?.map((p) => {
          const customer = customersData?.data?.find(
            (c) => c._id === p.customerId
          );
          return customer?.name;
        })
        .filter(Boolean)
    ),
  ];

  return (
    <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
      <div className="search-set">
        <div className="search-input">
          <span className="btn-searchset">
            <i className="ti ti-search fs-14 feather-search"></i>
          </span>
        </div>
      </div>

      <div className="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
        {/* ===== CATEGORY FILTER ===== */}
        <div className="dropdown me-2 position-relative">
          <a
            href="#"
            className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
            data-bs-toggle="dropdown"
          >
            Category
          </a>
          <ul className="dropdown-menu dropdown-menu-end p-3">
            {categoriesData?.categories?.map((cat) => (
              <li key={cat.categoryId}>
                <a
                  href="#"
                  onClick={() => handleFilterChange("category", cat.name)}
                  className="dropdown-item rounded-1"
                >
                  {cat.name}
                </a>
              </li>
            ))}
          </ul>

          {/* Filter Badge */}
          {selectedFilters.category && (
            <div className="position-absolute top-0 start-100 translate-middle badge bg-primary text-white px-2 py-1 rounded-pill d-flex align-items-center">
              <span className="me-1">{selectedFilters.category}</span>
              <i
                className="ti ti-x cursor-pointer"
                onClick={() => handleClearFilter("category")}
              ></i>
            </div>
          )}
        </div>

        {/* ===== BRAND FILTER ===== */}
        <div className="dropdown position-relative me-2">
          <a
            href="#"
            className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
            data-bs-toggle="dropdown"
          >
            Brand
          </a>
          <ul className="dropdown-menu dropdown-menu-end p-3">
            {brandsData?.map((brand) => (
              <li key={brand.id}>
                <a
                  href="#"
                  onClick={() => handleFilterChange("brand", brand.brandName)}
                  className="dropdown-item rounded-1"
                >
                  {brand.brandName}
                </a>
              </li>
            ))}
          </ul>

          {/* Filter Badge */}
          {selectedFilters.brand && (
            <div className="position-absolute top-0 start-100 translate-middle badge bg-primary text-white px-2 py-1 rounded-pill d-flex align-items-center">
              <span className="me-1">{selectedFilters.brand}</span>
              <i
                className="ti ti-x cursor-pointer"
                onClick={() => handleClearFilter("brand")}
              ></i>
            </div>
          )}
        </div>

        {/* ===== SORT BY ===== */}
        <div className="dropdown">
          <a
            href="#"
            className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
            data-bs-toggle="dropdown"
          >
            Sort By: {selectedFilters.sortBy}
          </a>
          <ul className="dropdown-menu dropdown-menu-end p-3">
            {[
              "Recently Added",
              "Ascending",
              "Descending",
              "Last Month",
              "Last 7 Days",
            ].map((option, i) => (
              <li key={i}>
                <a
                  href="#"
                  onClick={() => handleFilterChange("sortBy", option)}
                  className="dropdown-item rounded-1"
                >
                  {option}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TableHeader;
