import React from "react";
import maintain from "../../assets/img/authentication/under-maintenance.png";
const UnderMaintanance = () => {
  return (
    <div class="main-wrapper">
      <div class="error-box">
        <div class="error-img">
          <img src={maintain} class="img-fluid" alt="Img" />
        </div>
        <h3 class="h2 mb-3">We are Under Maintenance</h3>
        <p>
          Sorry for any inconvenience caused, we have almost done Will get back
          soon!
        </p>
        <a href="/" class="btn btn-primary">
          Back to Dashboard
        </a>
      </div>
    </div>
  );
};

export default UnderMaintanance;
