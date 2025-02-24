import React from "react";
import CategoriesItem from "./CategoriesItem";

const CategoriesList = () => {
  return (
    <div class="page-wrapper">
      <div class="content container-fluid">
        <div class="page-header">
          <div class="content-page-header ">
            <h5>Categories</h5>
            <div class="list-btn">
              <ul class="filter-list">
                <li>
                  <a
                    class="btn btn-filters w-auto popup-toggle"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    data-bs-original-title="Filter"
                  >
                    <span class="me-2">
                      <img
                        src="assets/img/icons/filter-icon.svg"
                        alt="filter"
                      />
                    </span>
                    Filter{" "}
                  </a>
                </li>
                <li>
                  <a
                    class="btn-filters"
                    href="javascript:void(0);"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    data-bs-original-title="Settings"
                  >
                    <span>
                      <i class="fe fe-settings"></i>
                    </span>{" "}
                  </a>
                </li>
                <li>
                  <a
                    class="btn btn-primary"
                    href="javascript:void(0);"
                    data-bs-toggle="modal"
                    data-bs-target="#blog-categories"
                  >
                    <i class="fa fa-plus-circle me-2" aria-hidden="true"></i>Add
                    Categories
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div id="filter_inputs" class="card filter-card">
          <div class="card-body pb-0">
            <div class="row">
              <div class="col-sm-6 col-md-3">
                <div class="input-block mb-3">
                  <label>Name</label>
                  <input type="text" class="form-control" />
                </div>
              </div>
              <div class="col-sm-6 col-md-3">
                <div class="input-block mb-3">
                  <label>Email</label>
                  <input type="text" class="form-control" />
                </div>
              </div>
              <div class="col-sm-6 col-md-3">
                <div class="input-block mb-3">
                  <label>Phone</label>
                  <input type="text" class="form-control" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-sm-12">
            <div class=" card-table">
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-stripped table-hover datatable">
                    <thead class="thead-light">
                      <tr>
                        <th>#</th>
                        <th>Category Name</th>
                        <th>Date</th>
                        <th>Added By</th>
                        <th>Status</th>
                        <th class="no-sort">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                                <CategoriesItem/>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesList;
