import React from "react";
import error from "../../assets/img/authentication/error-404.png";
const Error404 = () => {
  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="error-page">
          <div class="error-box">
            <div class="error-img">
              <img src={error} class="img-fluid" alt="Img" />
            </div>
            <h3 class="h2 mb-3">Oops, something went wrong</h3>
            <p>
              Error 404 Page not found. Sorry the page you looking for doesn’t
              exist or has been moved
            </p>
            <a href="/" class="btn btn-primary">
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Error404;
