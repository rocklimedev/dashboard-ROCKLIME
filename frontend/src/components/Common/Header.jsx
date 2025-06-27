import React, { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import logo from "../../assets/img/logo.png";
import { useGetProfileQuery } from "../../api/userApi";
import { Dropdown, Button, Menu } from "antd";
import { FaSearch, FaUserCircle } from "react-icons/fa";
import { BiFullscreen, BiLogOut } from "react-icons/bi";
import { toast } from "sonner";
import Avatar from "react-avatar";
import SearchDropdown from "../Search/SearchDropdown";
import { useLogoutMutation } from "../../api/authApi";
import styles from "./Header.module.css";

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

  // Define the dropdown menu for the user profile
  const userMenu = (
    <Menu className="menu-drop-user">
      <Menu.Item
        key="profile-header"
        className="profileset d-flex align-items-center p-2"
      >
        <span className="user-img me-2">
          <Avatar
            name={user?.user?.name}
            src={user?.user?.profileImage}
            size="50"
            round={true}
            className="img-fluid"
          />
        </span>
        <div>
          <h6 className="fw-medium mb-0">{user?.user?.name}</h6>
          <p className="mb-0">{user?.user?.roles}</p>
        </div>
      </Menu.Item>
      <Menu.Item key="profile">
        <Link to={`/u/${user?.user?.userId}`}>
          <FaUserCircle className="me-2" /> Profile
        </Link>
      </Menu.Item>
      <Menu.Item key="logout" onClick={handleLogout} disabled={isLoggingOut}>
        <BiLogOut className="me-2" />
        {isLoggingOut ? "Logging out..." : "Logout"}
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="header pos-header">
      <div className={styles.mainHeader}>
        {/* Logo Section */}

        {/* Mobile Menu Button */}
        <Button
          type="link"
          className={styles.mobileBtn}
          onClick={() => toggleSidebar(!isSidebarOpen)}
        >
          <span className="bar-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </Button>

        {/* User Menu */}
        <div className={styles.userMenu}>
          {/* Search Bar */}
          <div className={styles.navSearchInputs}>
            <div className="top-nav-search d-flex align-items-center">
              <Button type="link" className={styles.responsiveSearch}>
                <FaSearch />
              </Button>
              <SearchDropdown />
            </div>
          </div>

          {/* Fullscreen Toggle */}
          <div className={styles.navItemBox}>
            <Button
              type="link"
              onClick={handleFullscreenToggle}
              className={styles.fullscreenBtn}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <BiFullscreen />
            </Button>
          </div>

          {/* User Profile Dropdown */}
          <div className={styles.dropdownProfileNav}>
            {isLoading ? (
              <span className="user-letter">Loading...</span>
            ) : error ? (
              <span className="user-letter">Error loading profile</span>
            ) : user ? (
              <Dropdown
                overlay={userMenu}
                trigger={["click"]}
                overlayClassName={styles.dropdownOverlay}
                arrow={false}
              >
                <div className={styles.dropdownToggle}>
                  <span className="user-info">
                    <span className="user-letter">
                      <Avatar
                        name={user?.user?.name}
                        src={user?.user?.profileImage}
                        size="40"
                        round={true}
                        className="img-fluid"
                      />
                    </span>
                  </span>
                </div>
              </Dropdown>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
