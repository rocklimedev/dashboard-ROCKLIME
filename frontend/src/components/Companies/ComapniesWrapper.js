import React, { useState } from "react";
import { useGetVendorsQuery } from "../../api/vendorApi";
import PageHeader from "../Common/PageHeader";
import FilterInputs from "../Common/FilterInputs";
import Stats from "../Common/Stats";
import AddCompanyModal from "./AddCompanyModal";
const ComapniesWrapper = () => {
  const { data, error, isLoading } = useGetVendorsQuery();
  const vendors = Array.isArray(data) ? data : null;

  const [showModal, setShowModal] = useState(false);
  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching vendors.</p>;
  if (vendors.length === 0) return <p>No vendors available.</p>;
  const handleExport = (type) => {
    console.log(`Exporting as ${type}`);
  };

  return (
    <div class="page-wrapper">
      <div class="content">
        <PageHeader />
        <div class="card">
          <div class="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div class="search-set">
              <div class="search-input">
                <span class="btn-searchset">
                  <i class="ti ti-search fs-14 feather-search"></i>
                </span>
              </div>
            </div>
            <div class="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
              <div class="dropdown me-2">
                <a
                  href="javascript:void(0);"
                  class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Status
                </a>
                <ul class="dropdown-menu  dropdown-menu-end p-3">
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Active
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Inactive
                    </a>
                  </li>
                </ul>
              </div>
              <div class="dropdown">
                <a
                  href="javascript:void(0);"
                  class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Sort By : Latest
                </a>
                <ul class="dropdown-menu  dropdown-menu-end p-3">
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Latest
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Ascending
                    </a>
                  </li>
                  <li>
                    <a
                      href="javascript:void(0);"
                      class="dropdown-item rounded-1"
                    >
                      Desending
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table datatable">
                <thead class="thead-light">
                  <tr>
                    <th class="no-sort">
                      <label class="checkboxs">
                        <input type="checkbox" id="select-all" />
                        <span class="checkmarks"></span>
                      </label>
                    </th>
                    <th>Vendor ID</th>
                    <th>Vendor Name</th>
                    <th>Brand</th>
                    <th>Brand Slug</th>
                    <th>Created Date</th>

                    <th class="no-sort"></th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor.id}>
                      <td>
                        <label class="checkboxs">
                          <input type="checkbox" />
                          <span class="checkmarks"></span>
                        </label>
                      </td>
                      <td>{vendor.vendorId}</td>
                      <td>{vendor.vendorName}</td>
                      <td>{vendor.brandId}</td>
                      <td>{vendor.brandSlug}</td>
                      <td>
                        {" "}
                        {new Date(vendor.createdAt).toLocaleDateString()}
                      </td>

                      <td class="action-table-data">
                        <div class="edit-delete-action">
                          <a
                            class="me-2 p-2"
                            href="#"
                            data-bs-toggle="modal"
                            data-bs-target="#edit-brand"
                          >
                            <i data-feather="edit" class="feather-edit"></i>
                          </a>
                          <a
                            data-bs-toggle="modal"
                            data-bs-target="#delete-modal"
                            class="p-2"
                            href="javascript:void(0);"
                          >
                            <i
                              data-feather="trash-2"
                              class="feather-trash-2"
                            ></i>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComapniesWrapper;
