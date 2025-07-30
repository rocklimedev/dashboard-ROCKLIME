import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div
      className="footer d-flex align-items-center justify-content-center border-top bg-white p-2"
      style={{ height: "48px" }}
    >
      <div className="d-flex align-items-center justify-content-center text-gray-9 text-center">
        <span className="me-3">© {currentYear} CM Trading Co.</span>
        <span>
          All Rights Reserved | Powered by{" "}
          <a
            href="https://www.rocklime.com/"
            className="rocklime-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Rocklime
          </a>
        </span>
      </div>
    </div>
  );
};

export default Footer;
