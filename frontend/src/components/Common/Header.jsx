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
import { FaCirclePlus } from "react-icons/fa6";
import { toast } from "sonner";
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
    }
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
          onClick={() => toggleSidebar(!isSidebarOpen)} // Toggle between open and closed
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
