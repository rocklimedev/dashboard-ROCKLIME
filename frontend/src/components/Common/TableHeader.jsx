import React from "react";

const TableHeader = () => {
  return (
    <div class="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
      <div class="search-set">
        <div class="search-input">
          <span class="btn-searchset">
            <i class="ti ti-search fs-14 feather-search"></i>
          </span>
        </div>
      </div>
      <div class="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
        <div class="dropdown me-2">
          <a
            href="javascript:void(0);"
            class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
            data-bs-toggle="dropdown"
          >
            Category
          </a>
          <ul class="dropdown-menu  dropdown-menu-end p-3">
            <li>
              <a href="javascript:void(0);" class="dropdown-item rounded-1">
                Computers
              </a>
            </li>
            <li>
              <a href="javascript:void(0);" class="dropdown-item rounded-1">
                Electronics
              </a>
            </li>
            <li>
              <a href="javascript:void(0);" class="dropdown-item rounded-1">
                Shoe
              </a>
            </li>
            <li>
              <a href="javascript:void(0);" class="dropdown-item rounded-1">
                Electronics
              </a>
            </li>
          </ul>
        </div>
        <div class="dropdown">
          <a
            href="javascript:void(0);"
            class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
            data-bs-toggle="dropdown"
          >
            Brand
          </a>
          <ul class="dropdown-menu  dropdown-menu-end p-3">
            <li>
              <a href="javascript:void(0);" class="dropdown-item rounded-1">
                Lenovo
              </a>
            </li>
            <li>
              <a href="javascript:void(0);" class="dropdown-item rounded-1">
                Beats
              </a>
            </li>
            <li>
              <a href="javascript:void(0);" class="dropdown-item rounded-1">
                Nike
              </a>
            </li>
            <li>
              <a href="javascript:void(0);" class="dropdown-item rounded-1">
                Apple
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TableHeader;
