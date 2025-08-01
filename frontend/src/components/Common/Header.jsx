import React, { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useGetProfileQuery } from "../../api/userApi";
import { Dropdown, Button, Menu } from "antd";
import { FaSearch, FaUserCircle } from "react-icons/fa";
import { BiFullscreen, BiLogOut } from "react-icons/bi";
import { toast } from "sonner";
import Avatar from "react-avatar";
import SearchDropdown from "../Search/SearchDropdown";
import logo from "../../assets/img/logo.png";
import logo_small from "../../assets/img/fav_icon.png";
import { CgShoppingCart } from "react-icons/cg";
import { useLogoutMutation } from "../../api/authApi";
import { MdListAlt } from "react-icons/md";
// Add custom CSS to ensure avatar is circular
const styles = `
  .circular-avatar {
    width: 100% !important;
    height: 100% !important;
    border-radius: 50% !important;
    object-fit: cover;
    display: inline-block;
    overflow: hidden;
  }
  .avatar-container {
    width: 40px;
    height: 40px;
    display: inline-block;
  }
  .menu-avatar-container {
    width: 50px;
    height: 50px;
    display: inline-block;
  }
`;

// Inject styles into the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user, isLoading, error } = useGetProfileQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
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

  const userMenu = (
    <Menu className="shadow-sm rounded menu-drop-user" style={{ zIndex: 1000 }}>
      <Menu.Item
        key="profile-header"
        className="d-flex align-items-center p-3 profileset"
      >
        <span className="menu-avatar-container me-2">
          <Avatar
            name={user?.user?.name || "John Smilga"}
            src={user?.user?.profileImage || "/assets/img/profiles/avator1.jpg"}
            size="50"
            round={true}
            className="circular-avatar"
            color="#e31e24" // Add red background
          />
        </span>
        <div>
          <h6 className="fw-medium mb-0">
            {user?.user?.name || "John Smilga"}
          </h6>
          <p className="mb-0">{user?.user?.roles?.join(", ") || "Admin"}</p>
        </div>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="profile">
        <div onClick={() => navigate(`/u/${user?.user?.userId || "profile"}`)}>
          <FaUserCircle className="me-2" /> My Profile
        </div>
      </Menu.Item>
      <Menu.Item key="attendance">
        <div onClick={() => navigate(`/u/${user?.user?.userId}/attendance`)}>
          <MdListAlt className="me-2" /> Your Attendance
        </div>
      </Menu.Item>
      <Menu.Item key="settings">
        <div onClick={() => navigate("/settings")}>
          <i className="ti ti-settings-2 me-2" /> Settings
        </div>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="logout"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="d-flex align-items-center logout pb-0"
      >
        <BiLogOut className="me-2" />
        {isLoggingOut ? "Logging out..." : "Logout"}
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="header">
      <div className="main-header">
        <div className="header-left active">
          <Link to="/" className="logo logo-normal">
            <img src={logo} alt="Logo" />
          </Link>
          <Link to="/" className="logo logo-white">
            <img src={logo_small} alt="Logo" />
          </Link>
          <Link to="/" className="logo-small">
            <img src={logo_small} alt="Logo" />
          </Link>
        </div>

        <Button
          type="link"
          className="mobile_btn d-md-none"
          onClick={() => toggleSidebar(!isSidebarOpen)}
          aria-label="Toggle sidebar"
          id="mobile_btn"
        >
          <span className="bar-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </Button>

        <ul className="nav user-menu">
          <li className="nav-item nav-searchinputs">
            {/* <div className="top-nav-search">
              <Button
                type="link"
                className="responsive-search d-md-none"
                aria-label="Search"
              >
                <FaSearch />
              </Button>
              <div className="d-none d-md-block">
                <SearchDropdown />
              </div>
            </div> */}
          </li>
          <li className="nav-item nav-item-box">
            <Button
              type="link"
              id="btnFullscreen"
              onClick={handleFullscreenToggle}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <BiFullscreen />
            </Button>
          </li>
          <li className="nav-item nav-item-box">
            <Link to="/cart">
              <CgShoppingCart />
            </Link>
          </li>
          <li className="nav-item dropdown main-drop profile-nav">
            {isLoading ? (
              <span className="text-muted">Loading...</span>
            ) : error ? (
              <span className="text-danger">Error loading profile</span>
            ) : user ? (
              <Dropdown overlay={userMenu} trigger={["click"]}>
                <a
                  href="#"
                  className="nav-link userset"
                  onClick={(e) => e.preventDefault()}
                >
                  <span className="user-info p-0">
                    <span className="user-letter avatar-container">
                      <Avatar
                        name={user?.user?.name || "John Smilga"}
                        src={
                          user?.user?.profileImage ||
                          "/assets/img/profiles/avator1.jpg"
                        }
                        size="40"
                        round={true}
                        className="circular-avatar"
                        color="#e31e24" // Add red background
                      />
                    </span>
                  </span>
                </a>
              </Dropdown>
            ) : null}
          </li>
        </ul>

        <div className="dropdown mobile-user-menu">
          <Dropdown
            overlay={
              <Menu className="dropdown-menu dropdown-menu-right">
                <Menu.Item key="profile">
                  <div
                    onClick={() =>
                      navigate(`/u/${user?.user?.userId || "profile"}`)
                    }
                  >
                    My Profile
                  </div>
                </Menu.Item>
                <Menu.Item key="settings">
                  <div onClick={() => navigate("/settings")}>Settings</div>
                </Menu.Item>
                <Menu.Item
                  key="logout"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </Menu.Item>
              </Menu>
            }
            trigger={["click"]}
          >
            <a
              href="#"
              className="nav-link dropdown-toggle"
              onClick={(e) => e.preventDefault()}
            >
              <i className="fa fa-ellipsis-v" />
            </a>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default Header;
