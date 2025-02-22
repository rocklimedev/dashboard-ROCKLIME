import React from "react";
import { IoFilterOutline } from "react-icons/io5"
const PageHeader = ({ title, actions }) => {
  return (
    <div className="content-page-header">
      <h5>{title}</h5>
      <div className="page-content">
        <div className="list-btn">
          <ul className="filter-list">
            {actions?.refresh && (
              <li>
                <button
                  className="btn-filters"
                  onClick={actions.refresh}
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  title="Refresh"
                >
                  <span>
                    <i className="fe fe-refresh-ccw"></i>
                  </span>
                </button>
              </li>
            )}
            {actions?.filter && (
              <li>
                <button
                  className="btn btn-filters w-auto popup-toggle"
                  onClick={actions.filter}
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  title="Filter"
                >
                  <span className="me-2">
                 <IoFilterOutline/>
                  </span>
                  Filter
                </button>
              </li>
            )}
            {actions?.export && (
              <li>
                <div
                  className="dropdown dropdown-action"
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  title="Download"
                >
                  <button
                    className="btn btn-filters dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <span className="me-2">
                      <i className="fe fe-download"></i>
                    </span>
                    Export
                  </button>
                  <div className="dropdown-menu dropdown-menu-end">
                    <ul className="d-block">
                      <li>
                        <button
                          className="d-flex align-items-center download-item"
                          onClick={() => actions.export("pdf")}
                        >
                          <i className="far fa-file-pdf me-2"></i>Export as PDF
                        </button>
                      </li>
                      <li>
                        <button
                          className="d-flex align-items-center download-item"
                          onClick={() => actions.export("excel")}
                        >
                          <i className="far fa-file-text me-2"></i>Export as Excel
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </li>
            )}
            {actions?.print && (
              <li>
                <button
                  className="btn btn-filters"
                  onClick={actions.print}
                  data-bs-toggle="tooltip"
                  data-bs-placement="bottom"
                  title="Print"
                >
                  <span className="me-2">
                    <i className="fe fe-printer"></i>
                  </span>
                  Print
                </button>
              </li>
            )}
            {actions?.add && (
              <li>
                <button
                  className="btn btn-primary"
                  onClick={actions.add}
                  data-bs-toggle="modal"
                >
                  <i className="fa fa-plus-circle me-2" aria-hidden="true"></i>
                  Add {title}
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
