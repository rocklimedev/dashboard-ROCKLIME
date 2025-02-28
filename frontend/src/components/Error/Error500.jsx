import React from "react";
import error from "../../assets/img/authentication/error-500.png";
const Error500 = () => {
  return (
    <div class="main-wrapper">
      <div class="error-box">
        <div class="error-img">
          <img src={error} class="img-fluid" alt="Img" />
        </div>
        <h3 class="h2 mb-3">Oops, something went wrong</h3>
        <p>
          Server Error 500. We apologise and are fixing the problem Please try
          again at a later stage
        </p>
        <a href="index.html" class="btn btn-primary">
          Back to Dashboard
        </a>
      </div>
    </div>
  );
};

export default Error500;
