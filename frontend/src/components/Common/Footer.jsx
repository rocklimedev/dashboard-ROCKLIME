import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="footer d-flex align-items-center justify-content-center border-top bg-white p-3">
      <p className="mb-0 text-gray-9 text-center">
        © {currentYear} Rocklime. All Rights Reserved | Designed &amp; Developed
        by{" "}
        <a
          href="https://rocklime.com"
          className="text-primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          Rocklime
        </a>
      </p>
    </div>
  );
};

export default Footer;
