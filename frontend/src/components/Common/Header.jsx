import React, { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetCartQuery } from "../../api/cartApi";
import { useGetNotificationsQuery } from "../../api/notificationApi";
import { Dropdown, Button, Menu } from "antd";
import { FaUserCircle, FaSearch, FaBell } from "react-icons/fa";
import { SettingOutlined } from "@ant-design/icons";
import { BiFullscreen, BiLogOut } from "react-icons/bi";
import { toast } from "sonner";
import Avatar from "react-avatar";
import logo from "../../assets/img/logo.png";
import logo_small from "../../assets/img/fav_icon.png";
import { CgShoppingCart } from "react-icons/cg";
import { useLogoutMutation } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import { FaEllipsisV } from "react-icons/fa";

// CSS styles (unchanged from the provided code)
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
  .cart-badge, .notification-badge {
    position: absolute;
    top: -10px;
    right: -10px;
    background-color: #e31e24;
    color: white;
    border-radius: 50%;
    padding: 2px 6px;
    font-size: 12px;
    font-weight: bold;
  }
  .mobile-user-menu {
    z-index: 1100 !important;
  }
  .mobile-dropdown .ant-dropdown {
    z-index: 1100 !important;
  }
  @media (max-width: 991.96px) {
    .mobile-user-menu {
      display: block !important;
      position: relative;
      right: 10px;
      padding: 0 10px;
    }
    .mobile-menu-button {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px !important;
      padding: 10px !important;
      color: #212b36 !important;
      background: transparent !important;
    }
    .mobile-dropdown .ant-dropdown {
      width: 200px !important;
      max-width: 90vw !important;
      top: 100% !important;
      left: auto !important;
      right: 0 !important;
    }
  }
  .header {
    overflow: visible !important;
  }
  .main-header {
    overflow: visible !important;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    data: user,
    isLoading: isProfileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const [logoutMutation, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { logout } = useAuth();
  const {
    data: cart,
    isLoading: isCartLoading,
    error: cartError,
  } = useGetCartQuery(user?.user?.userId, { skip: !user?.user?.userId });
  const {
    data: notifications,
    isLoading: isNotificationsLoading,
    error: notificationsError,
  } = useGetNotificationsQuery(user?.user?.userId, {
    skip: !user?.user?.userId,
  });

  // Count only unread notifications (read: false)
  const notificationCount =
    notifications?.filter((notification) => !notification.read).length || 0;
  const cartItemCount = cart?.cart?.items?.length || 0;

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
      await logout();
      navigate("/login", { replace: true });
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
    <Menu className="shadow-sm rounded menu-drop-user" style={{ zIndex: 1100 }}>
      <Menu.Item
        key="profile-header"
        className="d-flex align-items-center p-3 profileset"
      >
        <div>
          <h6 className="fw-medium mb-0">
            @{user?.user?.username || "John Smilga"}
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
      <Menu.Item key="settings">
        <div onClick={() => navigate("/settings")}>
          <SettingOutlined className="me-2" /> Settings
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

  const mobileMenuItems = [
    {
      key: "profile",
      label: "My Profile",
      icon: <FaUserCircle className="me-2" />,
      onClick: () => navigate(`/u/${user?.user?.userId || "profile"}`),
    },
    {
      key: "settings",
      label: "Settings",
      icon: <i className="ti ti-settings-2 me-2" />,
      onClick: () => navigate("/settings"),
    },
    {
      key: "notifications",
      label: (
        <span style={{ position: "relative" }}>
          Notifications
          {notificationCount > 0 && (
            <span
              className="notification-badge"
              style={{ top: "-5px", right: "-20px" }}
            >
              {notificationCount}
            </span>
          )}
        </span>
      ),
      icon: <FaBell className="me-2" />,
      onClick: () => navigate("/notifications"),
    },
    {
      key: "cart",
      label: (
        <span style={{ position: "relative" }}>
          Cart
          {cartItemCount > 0 && (
            <span
              className="cart-badge"
              style={{ top: "-5px", right: "-20px" }}
            >
              {cartItemCount}
            </span>
          )}
        </span>
      ),
      icon: <CgShoppingCart className="me-2" />,
      onClick: () => navigate("/cart"),
    },
    {
      key: "fullscreen",
      label: isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen",
      icon: <BiFullscreen className="me-2" />,
      onClick: handleFullscreenToggle,
    },
    {
      key: "logout",
      label: isLoggingOut ? "Logging out..." : "Logout",
      icon: <BiLogOut className="me-2" />,
      onClick: handleLogout,
      disabled: isLoggingOut,
    },
  ];

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

        <a
          className="mobile_btn"
          onClick={() => {
            if (window.innerWidth < 992) {
              toggleSidebar(!isSidebarOpen);
            }
          }}
          aria-label="Toggle sidebar"
          id="mobile_btn"
        >
          <span className="bar-icon">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </a>

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
            <Link
              to="/notifications"
              style={{ position: "relative" }}
              aria-label={`Notifications with ${notificationCount} unread`}
            >
              <FaBell />
              {notificationCount > 0 && (
                <span className="notification-badge">{notificationCount}</span>
              )}
            </Link>
          </li>
          <li className="nav-item nav-item-box">
            <Link
              to="/cart"
              style={{ position: "relative" }}
              aria-label={`Cart with ${cartItemCount} items`}
            >
              <CgShoppingCart />
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </Link>
          </li>
          <li className="nav-item dropdown main-drop profile-nav">
            {isProfileLoading ? (
              <span className="text-muted">Loading...</span>
            ) : profileError ? (
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
                        color="#e31e24"
                      />
                    </span>
                  </span>
                </a>
              </Dropdown>
            ) : null}
          </li>
        </ul>

        <div
          className="mobile-user-menu"
          style={{ position: "relative", zIndex: 1100 }}
        >
          <Dropdown
            menu={{ items: mobileMenuItems }}
            trigger={["click"]}
            placement={window.innerWidth < 992 ? "bottom" : "bottomRight"}
            overlayClassName="mobile-dropdown"
            getPopupContainer={(trigger) => trigger.parentElement}
          >
            <Button
              type="text"
              icon={<FaEllipsisV />}
              aria-label="More options"
              className="mobile-menu-button"
            />
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default Header;
