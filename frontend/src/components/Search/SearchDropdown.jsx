import React from "react";
import { MdSearch } from "react-icons/md";
import { BiCommand } from "react-icons/bi";
const SearchDropdown = () => {
  return (
    <form className="dropdown">
      <div
        className="searchinputs input-group dropdown-toggle"
        id="dropdownMenuClickable"
        data-bs-toggle="dropdown"
        data-bs-auto-close="outside"
      >
        <input type="text" placeholder="Search" />
        <div className="search-addon">
          <span>
            <MdSearch />
          </span>
        </div>
        <span className="input-group-text">
          <kbd className="d-flex align-items-center">
            <BiCommand />K
          </kbd>
        </span>
      </div>
      <div
        class="dropdown-menu search-dropdown"
        aria-labelledby="dropdownMenuClickable"
      >
        <div class="search-info">
          <h6>
            <span>
              <i data-feather="search" class="feather-16"></i>
            </span>
            Recent Searches
          </h6>
          <ul class="search-tags">
            <li>
              <a href="javascript:void(0);">Products</a>
            </li>
            <li>
              <a href="javascript:void(0);">Sales</a>
            </li>
            <li>
              <a href="javascript:void(0);">Applications</a>
            </li>
          </ul>
        </div>
        <div class="search-info">
          <h6>
            <span>
              <i data-feather="help-circle" class="feather-16"></i>
            </span>
            Help
          </h6>
          <p>
            How to Change Product Volume from 0 to 200 on Inventory management
          </p>
          <p>Change Product Name</p>
        </div>
        <div class="search-info">
          <h6>
            <span>
              <i data-feather="user" class="feather-16"></i>
            </span>
            Customers
          </h6>
          <ul class="customers">
            <li>
              <a href="javascript:void(0);">
                Aron Varu
                <img
                  src="assets/img/profiles/avator1.jpg"
                  alt="Img"
                  class="img-fluid"
                />
              </a>
            </li>
            <li>
              <a href="javascript:void(0);">
                Jonita
                <img
                  src="assets/img/profiles/avatar-01.jpg"
                  alt="Img"
                  class="img-fluid"
                />
              </a>
            </li>
            <li>
              <a href="javascript:void(0);">
                Aaron
                <img
                  src="assets/img/profiles/avatar-10.jpg"
                  alt="Img"
                  class="img-fluid"
                />
              </a>
            </li>
          </ul>
        </div>
      </div>
    </form>
  );
};

export default SearchDropdown;
