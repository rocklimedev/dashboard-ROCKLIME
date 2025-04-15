import React from "react";
import { useGetAllProductsQuery } from "../../api/productApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useGetAllCategoriesQuery } from "../../api/categoryApi";
import { useGetCustomersQuery } from "../../api/customerApi";

const TableHeader = ({ filters, setFilters }) => {
  const { data: customersData } = useGetCustomersQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();
  const { data: brandsData } = useGetAllBrandsQuery();
  const { data: productsData } = useGetAllProductsQuery();

  const handleFilterChange = (field, value) => {
    const updatedFilters = { ...filters, [field]: value };
    setFilters(updatedFilters);
  };

  const handleClearFilter = (field) => {
    handleFilterChange(field, field === "search" ? "" : null);
  };

  const handleSearchChange = (e) => {
    handleFilterChange("search", e.target.value);
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
      {/* ===== SEARCH BOX ===== */}
      <div className="search-set">
        <div className="search-input">
          <span className="btn-searchset">
            <i className="ti ti-search fs-14 feather-search"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Search products..."
            value={filters.search || ""}
            onChange={handleSearchChange}
          />
          {filters.search && (
            <i
              className="ti ti-x fs-16 position-absolute end-0 me-3 mt-2 cursor-pointer"
              onClick={() => handleClearFilter("search")}
            ></i>
          )}
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
                  onClick={() => handleFilterChange("category", cat.categoryId)} // Use categoryId
                  className="dropdown-item rounded-1"
                >
                  {cat.name}
                </a>
              </li>
            ))}
          </ul>
          {filters.category && (
            <div className="position-absolute top-0 start-100 translate-middle badge bg-primary text-white px-2 py-1 rounded-pill d-flex align-items-center">
              <span className="me-1">
                {categoriesData?.categories?.find(
                  (cat) => cat.categoryId === filters.category
                )?.name || filters.category}
              </span>
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
                  onClick={() => handleFilterChange("brand", brand.id)} // Use brand id
                  className="dropdown-item rounded-1"
                >
                  {brand.brandName}
                </a>
              </li>
            ))}
          </ul>
          {filters.brand && (
            <div className="position-absolute top-0 start-100 translate-middle badge bg-primary text-white px-2 py-1 rounded-pill d-flex align-items-center">
              <span className="me-1">
                {brandsData?.find((b) => b.id === filters.brand)?.brandName ||
                  filters.brand}
              </span>
              <i
                className="ti ti-x cursor-pointer"
                onClick={() => handleClearFilter("brand")}
              ></i>
            </div>
          )}
        </div>

        {/* ===== CREATED BY FILTER ===== */}
        <div className="dropdown position-relative me-2">
          <a
            href="#"
            className="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
            data-bs-toggle="dropdown"
          >
            Created By
          </a>
          <ul className="dropdown-menu dropdown-menu-end p-3">
            {createdByList?.map((name, i) => (
              <li key={i}>
                <a
                  href="#"
                  onClick={() => handleFilterChange("createdBy", name)}
                  className="dropdown-item rounded-1"
                >
                  {name}
                </a>
              </li>
            ))}
          </ul>
          {filters.createdBy && (
            <div className="position-absolute top-0 start-100 translate-middle badge bg-primary text-white px-2 py-1 rounded-pill d-flex align-items-center">
              <span className="me-1">{filters.createdBy}</span>
              <i
                className="ti ti-x cursor-pointer"
                onClick={() => handleClearFilter("createdBy")}
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
            Sort By: {filters.sortBy || "Last 7 Days"}
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
