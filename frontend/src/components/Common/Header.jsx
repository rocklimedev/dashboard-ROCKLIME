import React from "react";
import { Link } from "react-router-dom";
import { useGetProfileQuery } from "../../api/userApi";

const Header = () => {
  const { data: user, isLoading, error } = useGetProfileQuery();

  return (
    <div className="header header-one">
      <a href="/" className="d-inline-flex d-sm-inline-flex align-items-center d-md-inline-flex d-lg-none align-items-center device-logo">
        <img src="assets/img/logo.png" className="img-fluid logo2" alt="Logo" />
      </a>
      <div className="main-logo d-inline float-start d-lg-flex align-items-center d-none d-sm-none d-md-none">
        <a href="/">
          <img src="assets/img/logo.png" className="img-fluid logo-blue" alt="Logo" />
        </a>
      </div>

      <div className="top-nav-search">
        <form>
          <input type="text" className="form-control" placeholder="Search here" />
          <button className="btn" type="submit">
            <img src="assets/img/icons/search.svg" alt="search" />
          </button>
        </form>
      </div>

      <div className="nav user-menu">
        {isLoading ? (
          <span>Loading...</span>
        ) : error ? (
          // If user is NOT authenticated, show Login and Register buttons
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-primary">Login</Link>
            <Link to="/register" className="btn btn-outline-primary">Register</Link>
          </div>
        ) : (
          // If user IS authenticated, show profile and notifications
          <>
            <li className="nav-item dropdown flag-nav">
              <a className="nav-link" data-bs-toggle="dropdown" href="#" role="button">
                <i className="fe fe-bell"></i> <span className="badge rounded-pill"></span>
              </a>
              <div className="dropdown-menu notifications">
                <div className="topnav-dropdown-header">
                  <div className="notification-title">
                    Notifications <a href="/notifications">View all</a>
                  </div>
                  <a href="#" className="clear-noti d-flex align-items-center">
                    Mark all as read <i className="fe fe-check-circle"></i>
                  </a>
                </div>
              </div>
            </li>

            <li className="nav-item dropdown">
              <a href="#" className="user-link nav-link" data-bs-toggle="dropdown">
                <span className="user-img">
                  <img src={user?.profilePicture || "assets/img/profiles/avatar-default.jpg"} alt="Profile" className="profilesidebar" />
                  <span className="animate-circle"></span>
                </span>
                <span className="user-content">
                  <span className="user-details">Admin</span>
                  <span className="user-name">{user?.name}</span>
                </span>
              </a>
              <div className="dropdown-menu menu-drop-user">
                <ul>
                  <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                  <li><Link className="dropdown-item" to="/settings">Settings</Link></li>
                  <li>
                    <button className="dropdown-item" onClick={() => console.log("Handle logout here")}>
                      Log Out
                    </button>
                  </li>
                </ul>
              </div>
            </li>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;
