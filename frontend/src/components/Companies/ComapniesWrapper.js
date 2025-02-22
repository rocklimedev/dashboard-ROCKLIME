import React, { useState } from "react";
import { useGetVendorsQuery } from "../../api/vendorApi";
import PageHeader from "../Common/PageHeader";
import FilterInputs from "../Common/FilterInputs";
import Stats from "../Common/Stats";
import AddCompanyModal from "./AddCompanyModal";
const ComapniesWrapper = () => {
  const { data: vendors, error, isLoading } = useGetVendorsQuery();
  const [showModal, setShowModal] = useState(false);

  const handleExport = (type) => {
    console.log(`Exporting as ${type}`);
  };

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <div className="page-header">
          <PageHeader
            title="Companies"
            actions={{
              refresh: () => window.location.reload(),
              filter: () => console.log("Filter clicked"),
              export: handleExport,
              print: () => window.print(),
              add: () => setShowModal(true),
            }}
          />
        </div>

        <Stats />
        <FilterInputs />

        <div className="row">
          <div className="col-sm-12">
            <div className="card-table">
              <div className="card-body">
                <div className="table-responsive">
                  {isLoading && <p>Loading Vendors...</p>}
                  {error && <p>Error fetching vendors</p>}
                  {!isLoading && !error && (
                    <table className="table table-center table-hover datatable">
                      <thead className="thead-light">
                        <tr>
                          <th className="no-sort">#</th>
                          <th>Vendor ID</th>
                          <th>Vendor Name</th>
                          <th>Brand Slug</th>
                          <th>Created Date</th>
                          <th className="no-sort">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendors?.map((vendor, index) => (
                          <tr key={vendor.id}>
                            <td>{index + 1}</td>
                            <td>{vendor.vendorId}</td>
                            <td>{vendor.vendorName}</td>
                            <td>{vendor.brandSlug}</td>
                            <td>
                              {vendor.createdAt
                                ? new Date(
                                    vendor.createdAt
                                  ).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="d-flex align-items-center">
                              <div className="dropdown dropdown-action">
                                <a
                                  href="#"
                                  className="btn-action-icon"
                                  data-bs-toggle="dropdown"
                                >
                                  <i className="fas fa-ellipsis-v"></i>
                                </a>
                                <div className="dropdown-menu dropdown-menu-end">
                                  <ul className="dropdown-ul">
                                    <li>
                                      <a className="dropdown-item" href="#">
                                        <i className="far fa-eye me-2"></i>View
                                        Company
                                      </a>
                                    </li>
                                    <li>
                                      <a className="dropdown-item" href="#">
                                        <i className="fe fe-edit me-2"></i>Edit
                                      </a>
                                    </li>
                                    <li className="delete-alt">
                                      <a className="dropdown-item" href="#">
                                        <i className="fe fe-trash-2 me-2"></i>
                                        Delete
                                      </a>
                                    </li>
                                    <li>
                                      <a className="dropdown-item" href="#">
                                        <i className="fe fe-user-x me-2"></i>
                                        Cancel Plan
                                      </a>
                                    </li>
                                    <li>
                                      <a className="dropdown-item" href="#">
                                        <i className="fe fe-shuffle me-2"></i>
                                        Subscription Log
                                      </a>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Company Modal */}
      <AddCompanyModal show={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

export default ComapniesWrapper;
