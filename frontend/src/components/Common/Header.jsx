import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useGetProfileQuery, useGetUserByIdQuery } from "../../api/userApi";
import {
  FaSearch,
  FaPlusCircle,
  FaShoppingCart,
  FaUsers,
  FaUser,
  FaTruck,
  FaClipboardList,
  FaStore,
  FaCartPlus,
  FaUserCircle,
  FaSignature,
} from "react-icons/fa";
import {
  MdCategory,
  MdOutlineShoppingBag,
  MdOutlinePointOfSale,
  MdSearch,
  MdPointOfSale,
  MdKey,
  MdPermIdentity,
} from "react-icons/md";
import { useLogoutMutation } from "../../api/authApi"; // Import useLogoutMutation
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS
import { FcSettings } from "react-icons/fc";
import { BiCommand, BiFullscreen, BiLogOut } from "react-icons/bi";
import img from "../../assets/img/avatar/avatar-1.jpg";
import SearchDropdown from "../Search/SearchDropdown";
import { FaPerson } from "react-icons/fa6";
const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { data: user, isLoading, error } = useGetProfileQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap(); // Call the mutation
      localStorage.removeItem("token"); // Clear token if stored
      toast.success("Logged out successfully!"); // Show success toast
      navigate("/login"); // Redirect to login page
    } catch (error) {
      toast.error("Logout failed. Please try again."); // Show error toast
      console.error("Logout failed", error);
    }
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!isSidebarOpen);
    toggleSidebar(!isSidebarOpen);
  };
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
        <button
          id="mobile_btn"
          className="mobile_btn"
          onClick={handleSidebarToggle}
        >
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
                <FaSearch />
              </button>
              <SearchDropdown />
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
              <FaCartPlus /> Add New
            </button>
            <div className="dropdown-menu dropdown-xl dropdown-menu-center">
              <div className="row g-2">
                {[
                  {
                    link: "/inventory/categories-keywords",
                    icon: <MdCategory />,
                    text: "Category",
                  },
                  {
                    link: "/inventory/categories-keywords",
                    icon: <MdKey />,
                    text: "Keyword",
                  },
                  {
                    link: "/inventory/product/add",
                    icon: <FaPlusCircle />,
                    text: "Product",
                  },
                  {
                    link: "/pos",
                    icon: <MdOutlineShoppingBag />,
                    text: "Order",
                  },
                  {
                    link: "/quotations/add",
                    icon: <FaShoppingCart />,
                    text: "Quotation",
                  },
                  {
                    link: "/customers/list",
                    icon: <FaClipboardList />,
                    text: "Customer",
                  },

                  {
                    link: "/brands/list",
                    icon: <FaClipboardList />,
                    text: "Brand",
                  },
                  {
                    link: "/super-admin/users",
                    icon: <FaUser />,
                    text: "User",
                  },

                  {
                    link: "/vendors/list",
                    icon: <FaPerson />,
                    text: "Vendor",
                  },
                  {
                    link: "/signature",
                    icon: <FaSignature />,
                    text: "Signature",
                  },
                  {
                    link: "/roles-permissions/list",
                    icon: <MdPermIdentity />,
                    text: "Roles",
                  },
                ].map((item, index) => (
                  <div key={index} className="col-md-2">
                    <Link to={item.link} className="link-item">
                      <span className="link-icon">${item.icon}</span>
                      <p>{item.text}</p>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </li>

          {/* POS Button */}
          <li className="nav-item pos-nav">
            <Link
              to="/pos"
              class="btn btn-dark btn-md d-inline-flex align-items-center"
            >
              <MdPointOfSale /> POS
            </Link>
          </li>
          <li class="nav-item nav-item-box">
            <a href="/settings">
              <FcSettings />
            </a>
          </li>
          <li class="nav-item nav-item-box">
            <a href="javascript:void(0);" id="btnFullscreen">
              <BiFullscreen />
            </a>
          </li>
          {/* User Profile */}
          <li className="nav-item dropdown has-arrow main-drop profile-nav">
            {isLoading ? (
              <span class="user-letter"> Loading...</span>
            ) : error ? (
              <span class="user-letter">Error loading profile</span>
            ) : user ? (
              <button
                className="dropdown-toggle nav-link"
                data-bs-toggle="dropdown"
              >
                <span className="user-info">
                  <span className="user-letter">
                    <img
                      src={user?.user?.profileImage || img}
                      alt="User"
                      className="img-fluid"
                    />
                  </span>
                </span>
              </button>
            ) : null}
            <div className="dropdown-menu menu-drop-user">
              <div class="profileset d-flex align-items-center">
                <span class="user-img me-2">
                  <img src={user?.user?.profileImage || img} alt="Img" />
                </span>
                <div>
                  <h6 class="fw-medium">{user?.user?.name}</h6>
                  <p>Admin</p>
                </div>
              </div>
              <Link to={`/u/${user?.user?.userId}`} className="dropdown-item">
                <FaUserCircle /> Profile
              </Link>
              <Link to="/settings" className="dropdown-item">
                <FcSettings /> Settings
              </Link>
              <button
                className="dropdown-item"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <BiLogOut /> {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </li>
        </ul>
        <div class="dropdown mobile-user-menu">
          {isLoading ? (
            <span class="user-letter"> Loading...</span>
          ) : error ? (
            <span class="user-letter">Error loading profile</span>
          ) : user ? (
            <button
              className="dropdown-toggle nav-link"
              data-bs-toggle="dropdown"
            >
              <span className="user-info">
                <span className="user-letter">
                  <img
                    src={user?.user?.profileImage || img}
                    alt="User"
                    className="img-fluid"
                  />
                </span>
              </span>
            </button>
          ) : null}
          <div class="dropdown-menu dropdown-menu-right">
            <a class="dropdown-item" href="/u/:id">
              My Profile
            </a>
            <a class="dropdown-item" href="/settings/general">
              Settings
            </a>
            <a class="dropdown-item" href="#">
              Logout
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
