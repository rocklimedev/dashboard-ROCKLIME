import React from "react";
import forbidden from "../../assets/img/authentication/403-forbidden-error-666x333.gif"; // Ant Design 403 illustration

const Error403 = () => {
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="error-page">
          <div className="error-box">
            <div className="error-img">
              <img src={forbidden} className="img-fluid" alt="403 Forbidden" />
            </div>
            <h3 className="h2 mb-3">Access Denied</h3>
            <p>
              Error 403 — You do not have permission to access this page. Please
              contact your administrator or return to a permitted area.
            </p>
            <a href="/" className="btn btn-primary">
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Error403;
