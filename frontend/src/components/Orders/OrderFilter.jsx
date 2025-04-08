import React from "react";

const OrderFilter = ({ setFilters }) => {
  const applyFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  return (
    <div className="col-xl-3 col-md-12 sidebars-right theiaStickySidebar section-bulk-widget">
      <div className="border rounded-3 bg-white p-3">
        <div className="mb-3 pb-3 border-bottom">
          <h4 className="d-flex align-items-center">
            <i className="ti ti-file-text me-2"></i>Order List
          </h4>
        </div>

        <div className="border-bottom pb-3">
          <div className="nav flex-column nav-pills">
            <button
              className="nav-link active mb-1"
              onClick={() => applyFilter("status", "all")}
            >
              <i className="ti ti-inbox me-2"></i>All Orders
            </button>
            <button
              className="nav-link mb-1"
              onClick={() => applyFilter("important", true)}
            >
              <i className="ti ti-star me-2"></i>Important
            </button>
            <button
              className="nav-link mb-0"
              onClick={() => applyFilter("trash", true)}
            >
              <i className="ti ti-trash me-2"></i>Trash
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="border-bottom px-2 pb-3 mb-3">
            <h5 className="mb-2">Tags</h5>
            <div className="d-flex flex-column mt-2">
              {["Pending", "Onhold", "Inprogress", "Done"].map((status) => (
                <a
                  key={status}
                  href="#"
                  className={`text-${status.toLowerCase()}`}
                  onClick={() => applyFilter("tag", status)}
                >
                  <i className="fas fa-square square-rotate fs-10 me-2"></i>
                  {status}
                </a>
              ))}
            </div>
          </div>

          <div className="px-2">
            <h5 className="mb-2">Priority</h5>
            <div className="d-flex flex-column mt-2">
              {["Medium", "High", "Low"].map((priority) => (
                <a
                  key={priority}
                  href="#"
                  className={`text-${priority.toLowerCase()}`}
                  onClick={() => applyFilter("priority", priority)}
                >
                  <i className="fas fa-square square-rotate fs-10 me-2"></i>
                  {priority}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFilter;
