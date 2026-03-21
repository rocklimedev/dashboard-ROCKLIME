import React from "react";
import { Spin } from "antd";

const Loader = ({ loading }) => {
  if (!loading) return null;

  return (
    <div
      id="global-loader"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: "100vw",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <Spin size="large" />
    </div>
  );
};

export default Loader;
