import React from "react";
import { Link } from "react-router-dom";
import { useGetProfileQuery } from "../../api/userApi";
import {
  FaSearch,
  FaPlusCircle,
  FaShoppingCart,
  FaUsers,
  FaUser,
  FaTruck,
  FaClipboardList,
  FaStore,
} from "react-icons/fa";
import {
  MdCategory,
  MdOutlineShoppingBag,
  MdOutlinePointOfSale,
} from "react-icons/md";

const Header = () => {
  const { data: user, isLoading, error } = useGetProfileQuery();

  return (
    <div className="header">
      <div className="main-header">
        {/* Logo Section */}
        <div className="header-left active">
          <Link to="/" className="logo logo-normal">
            <img src="/assets/img/logo.svg" alt="Logo" />
          </Link>
          <Link to="/" className="logo logo-white">
            <img src="/assets/img/logo-white.svg" alt="Logo" />
          </Link>
          <Link to="/" className="logo-small">
            <img src="/assets/img/logo-small.png" alt="Logo" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button id="mobile_btn" className="mobile_btn">
          <span className="bar-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* User Menu */}
        <ul className="nav user-menu">
          {/* Search Bar */}
          <li className="nav-item nav-searchinputs">
            <div className="top-nav-search">
              <button className="responsive-search">
                <i className="fa fa-search"></i>
              </button>
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
                      <i className="ti ti-search"></i>
                    </span>
                  </div>
                  <span className="input-group-text">
                    <kbd className="d-flex align-items-center">
                      <img
                        src="/assets/img/icons/command.svg"
                        alt="Cmd"
                        className="me-1"
                      />
                      K
                    </kbd>
                  </span>
                </div>
              </form>
            </div>
          </li>

          {/* Store Dropdown */}
          <li className="nav-item dropdown has-arrow main-drop select-store-dropdown">
            <button
              className="dropdown-toggle nav-link select-store"
              data-bs-toggle="dropdown"
            >
              <span className="user-info">
                <span className="user-letter">
                  <img
                    src="/assets/img/store/store-01.png"
                    alt="Store Logo"
                    className="img-fluid"
                  />
                </span>
                <span className="user-detail">
                  <span className="user-name">Freshmart</span>
                </span>
              </span>
            </button>
            <div className="dropdown-menu dropdown-menu-right">
              <button className="dropdown-item">
                <img
                  src="/assets/img/store/store-02.png"
                  alt="Store"
                  className="img-fluid"
                />{" "}
                Grocery Apex
              </button>
              <button className="dropdown-item">
                <img
                  src="/assets/img/store/store-03.png"
                  alt="Store"
                  className="img-fluid"
                />{" "}
                Grocery Bevy
              </button>
              <button className="dropdown-item">
                <img
                  src="/assets/img/store/store-04.png"
                  alt="Store"
                  className="img-fluid"
                />{" "}
                Grocery Eden
              </button>
            </div>
          </li>

          {/* Add New Button */}
          <li className="nav-item dropdown link-nav">
            <button
              className="btn btn-primary btn-md d-inline-flex align-items-center"
              data-bs-toggle="dropdown"
            >
              <i className="ti ti-circle-plus me-1"></i> Add New
            </button>
            <div className="dropdown-menu dropdown-xl dropdown-menu-center">
              <div className="row g-2">
                {[
                  {
                    link: "category-list.html",
                    icon: <MdCategory />,
                    text: "Category",
                  },
                  {
                    link: "add-product.html",
                    icon: <FaPlusCircle />,
                    text: "Product",
                  },
                  {
                    link: "category-list.html",
                    icon: <MdOutlineShoppingBag />,
                    text: "Purchase",
                  },
                  {
                    link: "online-orders.html",
                    icon: <FaShoppingCart />,
                    text: "Sale",
                  },
                  {
                    link: "expense-list.html",
                    icon: <FaClipboardList />,
                    text: "Expense",
                  },
                  {
                    link: "quotation-list.html",
                    icon: <FaStore />,
                    text: "Quotation",
                  },
                  {
                    link: "sales-returns.html",
                    icon: <FaClipboardList />,
                    text: "Return",
                  },
                  { link: "users.html", icon: <FaUser />, text: "User" },
                  {
                    link: "customers.html",
                    icon: <FaUsers />,
                    text: "Customer",
                  },
                  {
                    link: "suppliers.html",
                    icon: <FaUser />,
                    text: "Supplier",
                  },
                  {
                    link: "stock-transfer.html",
                    icon: <FaTruck />,
                    text: "Transfer",
                  },
                ].map((item, index) => (
                  <div key={index} className="col-md-2">
                    <Link to={item.link} className="link-item">
                      <span className="link-icon">
                        <i className={`ti ${item.icon}`}></i>
                      </span>
                      <p>{item.text}</p>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </li>

          {/* POS Button */}
          <li className="nav-item pos-nav">
            <Link to="/pos" className="btn btn-secondary">
              <i className="ti ti-point-of-sale"></i> POS
            </Link>
          </li>

          {/* User Profile */}
          <li className="nav-item dropdown">
            {isLoading ? (
              <span>Loading...</span>
            ) : error ? (
              <span>Error loading profile</span>
            ) : user ? (
              <button
                className="dropdown-toggle nav-link"
                data-bs-toggle="dropdown"
              >
                <span className="user-info">
                  <span className="user-letter">
                    <img
                      src={
                        user.profileImage || "/assets/img/default-avatar.png"
                      }
                      alt="User"
                      className="img-fluid"
                    />
                  </span>
                  <span className="user-detail">
                    <span className="user-name">{user.name}</span>
                  </span>
                </span>
              </button>
            ) : null}
            <div className="dropdown-menu dropdown-menu-right">
              <Link to="/profile" className="dropdown-item">
                Profile
              </Link>
              <Link to="/settings" className="dropdown-item">
                Settings
              </Link>
              <button className="dropdown-item">Logout</button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Header;
