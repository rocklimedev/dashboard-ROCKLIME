import React, { useState } from "react";
import { AiOutlineSearch } from "react-icons/ai"; // For search icon (replace with ti ti-search if using Tabler Icons)
import { PiUserListBold } from "react-icons/pi";
import {
  MdBrandingWatermark,
  MdOutlineBrandingWatermark,
} from "react-icons/md";
import { LiaFileSignatureSolid } from "react-icons/lia";
import { BiUserCheck } from "react-icons/bi";
import { GiCorporal } from "react-icons/gi";
// Sample data for links (replace with actual data source, e.g., API or props)
const sampleLinks = [
  {
    id: "1",
    link: "/customers/list",
    name: "Customers",
    icon: <PiUserListBold />,
  },

  {
    id: "3",
    link: "/vendors/list",
    name: "Vendors",
    icon: <MdBrandingWatermark />,
  },
  {
    id: "4",
    link: "/brands/list",
    name: "Brands",
    icon: <MdOutlineBrandingWatermark />,
  },
  {
    id: "5",
    link: "/signature/list",
    name: "Signature",
    icon: <LiaFileSignatureSolid />,
  },
  { id: "6", link: "/users/list", name: "Users", icon: <BiUserCheck /> },
  { id: "7", link: "/companies/list", name: "Companies", icon: <GiCorporal /> },
];

const Managerials = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("ascending");

  // Filter links based on search term
  const filteredLinks = sampleLinks.filter((link) =>
    link.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort links based on sort option
  const sortedLinks = [...filteredLinks].sort((a, b) => {
    if (sortOption === "ascending") {
      return a.name.localeCompare(b.name);
    } else {
      return b.name.localeCompare(a.name);
    }
  });

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Navigation Links</h4>
              <h6>Access your dashboard features</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li>
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Refresh"
                href="javascript:void(0);"
                onClick={() => setSearchTerm("")}
              >
                <i className="ti ti-refresh"></i>
              </a>
            </li>
            <li>
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Collapse"
                id="collapse-header"
                href="javascript:void(0);"
              >
                <i className="ti ti-chevron-up"></i>
              </a>
            </li>
          </ul>
        </div>

        <div className="card">
          <div className="card-body p-3">
            <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
              <div className="position-relative input-icon me-3">
                <span className="input-icon-addon">
                  <i className="ti ti-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search Links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="d-flex my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                <div className="dropdown">
                  <a
                    href="javascript:void(0);"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    Sort By:{" "}
                    {sortOption === "ascending" ? "Ascending" : "Descending"}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <a
                        href="javascript:void(0);"
                        className="dropdown-item rounded-1"
                        onClick={() => setSortOption("ascending")}
                      >
                        Ascending
                      </a>
                    </li>
                    <li>
                      <a
                        href="javascript:void(0);"
                        className="dropdown-item rounded-1"
                        onClick={() => setSortOption("descending")}
                      >
                        Descending
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          {sortedLinks.length > 0 ? (
            sortedLinks.map((link) => (
              <div className="col-xxl-4 col-md-6" key={link.id}>
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <i className={`${link.icon} me-2 fs-24`}></i>
                      <h5 className="fs-16 text-truncate">
                        <a href={link.link} className="text-dark">
                          {link.name}
                        </a>
                      </h5>
                    </div>
                    <a href={link.link} className="btn btn-primary btn-sm">
                      Go to {link.name}
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center">
              <p>No links found matching your search.</p>
            </div>
          )}
        </div>
      </div>
      <div className="footer d-sm-flex align-items-center justify-content-between border-top bg-white p-3">
        <p className="mb-0 text-gray-9">
          2014 - 2025 © DreamsPOS. All Rights Reserved
        </p>
        <p>
          Designed & Developed by{" "}
          <a href="javascript:void(0);" className="text-primary">
            Dreams
          </a>
        </p>
      </div>
    </div>
  );
};

export default Managerials;
