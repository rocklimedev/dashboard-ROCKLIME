import React, { useState, useEffect } from "react";

const Loader = ({ loading }) => {
  return (
    loading && (
      <div id="global-loader">
        <div className="whirly-loader"></div>
      </div>
    )
  );
};

export default Loader;
