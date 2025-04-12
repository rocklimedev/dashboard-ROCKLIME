import React from "react";
import { useGetAllInvoicesQuery } from "../../api/invoiceApi";

const ShowInvoices = () => {
  const { data: invoicesData, isLoading, isError } = useGetAllInvoicesQuery();
  const invoices = invoicesData?.data || [];

  const groupedInvoices = {
    All: invoices,
    Paid: invoices.filter((inv) => inv.status === "Paid"),
    Unpaid: invoices.filter((inv) => inv.status === "Unpaid"),
    Overdue: invoices.filter((inv) => inv.status === "Overdue"),
  };

  if (isLoading) return <p>Loading invoices...</p>;
  if (isError) return <p className="text-danger">Failed to load invoices</p>;

  return (
    <div className="content">
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
          <h4>Invoices</h4>
          <div className="d-flex align-items-center flex-wrap row-gap-3">
            <div className="d-flex align-items-center me-3">
              <p className="mb-0 me-3 pe-3 border-end fs-14">
                Total Task : <span className="text-dark"> 55 </span>
              </p>
              <p className="mb-0 me-3 pe-3 border-end fs-14">
                Pending : <span className="text-dark"> 15 </span>
              </p>
              <p className="mb-0 fs-14">
                Completed : <span className="text-dark"> 40 </span>
              </p>
            </div>
            <div className="input-icon-start position-relative">
              <span className="input-icon-addon">
                <i className="ti ti-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search Invoice"
              />
            </div>
          </div>
        </div>

        <div className="card-body">
          <div className="row">
            <div className="col-lg-4">
              <div className="d-flex align-items-center flex-wrap row-gap-3 mb-3">
                <h6 className="me-2">Status</h6>
                <ul
                  className="nav nav-pills border d-inline-flex p-1 rounded bg-light todo-tabs"
                  id="pills-tab"
                  role="tablist"
                >
                  {Object.keys(groupedInvoices).map((status, index) => (
                    <li className="nav-item" role="presentation" key={status}>
                      <button
                        className={`nav-link btn btn-sm btn-icon py-3 d-flex align-items-center justify-content-center w-auto ${
                          index === 0 ? "active" : ""
                        }`}
                        id={`tab-${status}`}
                        data-bs-toggle="pill"
                        data-bs-target={`#pills-${status}`}
                        type="button"
                        role="tab"
                        aria-selected={index === 0 ? "true" : "false"}
                      >
                        {status}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="d-flex align-items-center justify-content-lg-end flex-wrap row-gap-3 mb-3">
                <div className="input-icon w-120 position-relative me-2">
                  <span className="input-icon-addon">
                    <i className="ti ti-calendar text-gray-9"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control datetimepicker"
                    placeholder="Created Date"
                  />
                </div>
                <div className="input-icon w-120 position-relative me-2">
                  <span className="input-icon-addon">
                    <i className="ti ti-calendar text-gray-9"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control datetimepicker"
                    placeholder="Due Date"
                  />
                </div>
                <div className="dropdown me-2">
                  <a
                    href="javascript:void(0);"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center p-2"
                    data-bs-toggle="dropdown"
                  >
                    Select Status
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end p-3">
                    <li>
                      <a
                        href="javascript:void(0);"
                        className="dropdown-item rounded-1"
                      >
                        Inprogress
                      </a>
                    </li>
                    <li>
                      <a
                        href="javascript:void(0);"
                        className="dropdown-item rounded-1"
                      >
                        On-hold
                      </a>
                    </li>
                    <li>
                      <a
                        href="javascript:void(0);"
                        className="dropdown-item rounded-1"
                      >
                        Completed
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="d-flex align-items-center border p-2 rounded">
                  <span className="d-inline-flex me-2">Sort By : </span>
                  <div className="dropdown">
                    <a
                      href="javascript:void(0);"
                      className="dropdown-toggle btn btn-white d-inline-flex align-items-center border-0 bg-transparent p-0 text-dark"
                      data-bs-toggle="dropdown"
                    >
                      Created Date
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end p-3">
                      <li>
                        <a
                          href="javascript:void(0);"
                          className="dropdown-item rounded-1"
                        >
                          Created Date
                        </a>
                      </li>
                      <li>
                        <a
                          href="javascript:void(0);"
                          className="dropdown-item rounded-1"
                        >
                          Last 7 Days
                        </a>
                      </li>
                      <li>
                        <a
                          href="javascript:void(0);"
                          className="dropdown-item rounded-1"
                        >
                          Due Date
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="tab-content" id="pills-tabContent">
            {Object.entries(groupedInvoices).map(([status, list], index) => (
              <div
                className={`tab-pane fade ${index === 0 ? "show active" : ""}`}
                id={`pills-${status}`}
                role="tabpanel"
                aria-labelledby={`tab-${status}`}
                key={status}
              >
                {list.length === 0 ? (
                  <p className="text-muted">
                    No {status.toLowerCase()} invoices
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Client</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((inv) => (
                          <tr key={inv.invoiceId}>
                            <td>{inv.invoiceNo}</td>
                            <td>{inv.billTo}</td>
                            <td>
                              ₹{parseFloat(inv.amount).toLocaleString("en-IN")}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  inv.status === "Paid"
                                    ? "bg-success"
                                    : inv.status === "Unpaid"
                                    ? "bg-warning"
                                    : inv.status === "Overdue"
                                    ? "bg-danger"
                                    : "bg-secondary"
                                }`}
                              >
                                {inv.status || "Unknown"}
                              </span>
                            </td>
                            <td>
                              {new Date(inv.invoiceDate).toLocaleDateString(
                                "en-IN"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowInvoices;
