import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="footer d-flex align-items-center justify-content-center border-top bg-white py-2"
      style={{ minHeight: "48px" }}
    >
      <div className="container text-center text-gray-9">
        <span className="footer-text me-2">© {currentYear} CM Trading Co.</span>
        <span className="footer-text">
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
    </footer>
  );
};

export default Footer;
