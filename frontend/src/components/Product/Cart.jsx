import React, { useState, useMemo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useGetCartQuery } from "../../api/cartApi";
import { useGetProfileQuery } from "../../api/userApi"; // Assuming cartApi is included in userApi or separate
import { useLogoutMutation } from "../../api/authApi";
import { Dropdown, Button, Menu, Badge } from "antd";
import { FaSearch, FaUserCircle } from "react-icons/fa";
import { BiFullscreen, BiLogOut } from "react-icons/bi";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import Avatar from "react-avatar";
import SearchDropdown from "../Search/SearchDropdown"; // Assuming this is the same as in the original
import logo from "../../assets/img/logo.png";
import logo_small from "../../assets/img/fav_icon.png";

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: user, isLoading, error } = useGetProfileQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch cart data
  const userId = user?.user?.userId;
  const { data: cartData, isLoading: cartLoading } = useGetCartQuery(userId, {
    skip: !userId,
  });
  const cartItems = useMemo(
    () => (Array.isArray(cartData?.cart?.items) ? cartData.cart.items : []),
    [cartData]
  );
  const totalItems = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  // Handle logout
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

  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // User profile dropdown menu
  const userMenu = (
    <Menu className="shadow-sm rounded menu-drop-user">
      <Menu.Item
        key="profile-header"
        className="d-flex align-items-center p-3 profileset"
      >
        <Avatar
          name={user?.user?.name || "John Smilga"}
          src={user?.user?.profileImage || "/assets/img/profiles/avator1.jpg"}
          size="50"
          round={true}
          className="me-2"
        />
        <div>
          <h6 className="fw-medium mb-0">
            {user?.user?.name || "John Smilga"}
          </h6>
          <p className="mb-0">{user?.user?.roles || "Admin"}</p>
        </div>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="profile">
        <Link
          to={`/u/${user?.user?.userId || "profile"}`}
          className="d-flex align-items-center"
        >
          <FaUserCircle className="me-2" /> My Profile
        </Link>
      </Menu.Item>
      <Menu.Item key="settings">
        <Link to="/settings" className="d-flex align-items-center">
          <i className="ti ti-settings-2 me-2" /> Settings
        </Link>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="logout"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="d-flex align-items-center logout pb-0"
      >
        <BiLogOut className="me-2" />
        {isLoading ? "Logging out..." : "Logout"}
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="header">
      <div className="main-header">
        {/* Logo */}
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

        {/* Mobile Menu Toggle */}
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

        {/* Header Menu */}
        <ul className="nav user-menu">
          {/* Search */}
          <li className="nav-item nav-searchinputs">
            <div className="top-nav-search">
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
            </div>
          </li>

          {/* Fullscreen */}
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

          {/* Cart with Badge */}
          <li className="nav-item nav-item-box">
            <Link to="/cart">
              <Badge
                count={cartLoading ? 0 : totalItems}
                style={{ backgroundColor: "#ff4d4f" }}
              >
                <ShoppingCartOutlined
                  style={{ fontSize: "24px", color: "grey" }}
                />
              </Badge>
            </Link>
          </li>

          {/* User Profile */}
          <li className="nav-item dropdown has-arrow main-drop profile-nav">
            {isLoading ? (
              <span className="text-muted">Loading...</span>
            ) : error ? (
              <span className="text-danger">Error loading profile</span>
            ) : user ? (
              <Dropdown overlay={userMenu} trigger={["click"]}>
                <Link to="#" className="nav-link userset">
                  <span className="user-info p-0">
                    <span className="user-letter">
                      <Avatar
                        name={user?.user?.name || "John Smilga"}
                        src={
                          user?.user?.profileImage ||
                          "/assets/img/profiles/avator1.jpg"
                        }
                        size="40"
                        round={true}
                        className="img-fluid"
                      />
                    </span>
                  </span>
                </Link>
              </Dropdown>
            ) : null}
          </li>
        </ul>

        {/* Mobile User Menu */}
        <div className="dropdown mobile-user-menu">
          <Dropdown
            overlay={
              <Menu className="dropdown-menu dropdown-menu-right">
                <Menu.Item key="profile">
                  <Link to="/profile">My Profile</Link>
                </Menu.Item>
                <Menu.Item key="settings">
                  <Link to="/settings">Settings</Link>
                </Menu.Item>
                <Menu.Item
                  key="logout"
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  {isLoading ? "Logging out..." : "Logout"}
                </Menu.Item>
              </Menu>
            }
            trigger={["click"]}
          >
            <Link to="#" className="nav-link dropdown-toggle">
              <i className="fa fa-ellipsis-v" />
            </Link>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default Header;
