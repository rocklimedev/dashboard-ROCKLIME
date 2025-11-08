import React from "react";

const ComingSoon = () => {
  return (
    <div class="row flex-wrap justify-content-center align-items-center">
      <div class="col-md-8 d-flex justify-content-end align-items-center mx-auto">
        <div class="comming-soon-pg d-flex flex-column align-items-center justify-content-center">
          <div>
            <img
              src="https://smarthr.co.in/demo/html/template/assets/img/bg/coming-soon.svg"
              alt="image"
              class="img-fluid"
            />
          </div>

          <div>
            <p class="fs-16 text-gray-9 text-center">
              Please check back later, We are working hard to get <br />{" "}
              everything just right.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
