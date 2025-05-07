import React, { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import logo from "../../assets/img/logo.png";
import { useGetProfileQuery } from "../../api/userApi";
import { Dropdown, Button, Nav } from "react-bootstrap";
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
  MdPointOfSale,
  MdPermIdentity,
  MdDashboard,
} from "react-icons/md";
import { BiCalculator, BiFullscreen, BiLogOut } from "react-icons/bi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import img from "../../assets/img/avatar/avatar-1.jpg";
import SearchDropdown from "../Search/SearchDropdown";
import CalculatorModal from "./Calculator";
import { useLogoutMutation } from "../../api/authApi";

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const navigate = useNavigate();
  const { data: user, isLoading, error } = useGetProfileQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [showModal, setShowModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      localStorage.removeItem("token");
      toast.success("Logged out successfully!");
      navigate("/login");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
      console.error("Logout failed", error);
    }
  };

  const handleSidebarToggle = () => {
    console.log("Header: Toggling sidebar, current state:", isSidebarOpen);
    toggleSidebar(!isSidebarOpen); // Toggle parent state
  };

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="header pos-header">
      <div className="main-header d-flex align-items-center">
        {/* Logo Section */}
        <div className="header-left">
          <Link to="/" className="logo">
            <img src={logo} alt="Logo" className="img-fluid" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="link"
          className="mobile_btn p-0"
          onClick={handleSidebarToggle}
          aria-label="Toggle sidebar"
        >
          <span className="bar-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </Button>

        {/* User Menu */}
        <Nav className="user-menu ms-auto d-flex align-items-center">
          {/* Search Bar */}
          <Nav.Item className="nav-searchinputs me-3">
            <div className="top-nav-search d-flex align-items-center">
              <Button variant="link" className="responsive-search p-0">
                <FaSearch />
              </Button>
              <SearchDropdown />
            </div>
          </Nav.Item>

          {/* Add New Dropdown */}
          <Nav.Item className="dropdown link-nav me-3">
            <Dropdown>
              <Dropdown.Toggle
                variant="primary"
                className="d-flex align-items-center"
              >
                <FaCartPlus className="me-1" /> Add New
              </Dropdown.Toggle>
              <Dropdown.Menu className="p-3" style={{ minWidth: "600px" }}>
                <div className="row g-2">
                  {[
                    {
                      link: "/inventory/categories-keywords",
                      icon: <MdCategory />,
                      text: "Category",
                    },
                    {
                      link: "/inventory/categories-keywords",
                      icon: <FaTruck />,
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
                      icon: <FaUsers />,
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
                      icon: <FaStore />,
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
                    <div key={index} className="col-md-3 col-6">
                      <Link
                        to={item.link}
                        className="link-item d-block text-center"
                      >
                        <span className="link-icon d-block mb-1">
                          {item.icon}
                        </span>
                        <p className="mb-0">{item.text}</p>
                      </Link>
                    </div>
                  ))}
                </div>
              </Dropdown.Menu>
            </Dropdown>
          </Nav.Item>

          {/* POS Button */}
          {currentPath !== "/pos" && (
            <Nav.Item className="pos-nav me-3">
              <Button
                as={Link}
                to="/pos"
                variant="dark"
                className="d-flex align-items-center"
              >
                <MdPointOfSale className="me-1" /> POS
              </Button>
            </Nav.Item>
          )}

          {/* Calculator Button */}
          {currentPath === "/pos" && (
            <Nav.Item className="nav-item-box me-3">
              <Button
                variant="link"
                onClick={() => setShowModal(true)}
                className="p-0"
                title="Open Calculator"
              >
                <BiCalculator />
              </Button>
            </Nav.Item>
          )}

          {/* Home Button */}
          {currentPath !== "/" && (
            <Nav.Item className="pos-nav me-3">
              <Button
                as={Link}
                to="/"
                variant="dark"
                className="d-flex align-items-center"
              >
                <MdDashboard className="me-1" /> Home
              </Button>
            </Nav.Item>
          )}

          {/* Fullscreen Toggle */}
          <Nav.Item className="nav-item-box me-3">
            <Button
              variant="link"
              onClick={handleFullscreenToggle}
              className="p-0"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <BiFullscreen />
            </Button>
          </Nav.Item>

          {/* User Profile Dropdown */}
          <Nav.Item className="dropdown profile-nav">
            {isLoading ? (
              <span className="user-letter">Loading...</span>
            ) : error ? (
              <span className="user-letter">Error loading profile</span>
            ) : user ? (
              <Dropdown align="end">
                <Dropdown.Toggle
                  variant="link"
                  id="dropdown-profile"
                  className="p-0"
                >
                  <span className="user-info">
                    <span className="user-letter">
                      <img
                        src={user?.user?.profileImage || img}
                        alt="User"
                        className="img-fluid rounded-circle"
                        style={{ width: "40px", height: "40px" }}
                      />
                    </span>
                  </span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="menu-drop-user">
                  <div className="profileset d-flex align-items-center p-2">
                    <span className="user-img me-2">
                      <img
                        src={user?.user?.profileImage || img}
                        alt="User"
                        className="img-fluid rounded-circle"
                        style={{ width: "50px", height: "50px" }}
                      />
                    </span>
                    <div>
                      <h6 className="fw-medium mb-0">{user?.user?.name}</h6>
                      <p className="mb-0">{user?.user?.roles}</p>
                    </div>
                  </div>
                  <Dropdown.Item as={Link} to={`/u/${user?.user?.userId}`}>
                    <FaUserCircle className="me-2" /> Profile
                  </Dropdown.Item>
                  <Dropdown.Item onClick={handleLogout} disabled={isLoggingOut}>
                    <BiLogOut className="me-2" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : null}
          </Nav.Item>
        </Nav>
      </div>

      {/* Calculator Modal */}
      {showModal && <CalculatorModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Header;
