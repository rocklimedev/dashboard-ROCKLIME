import React from "react";

const SignatureWrapper = () => {
  return (
    <div class="page-wrapper">
      <div class="content container-fluid">
        <div class="page-header">
          <div class="content-page-header ">
            <h5>Signature </h5>
            <div class="list-btn">
              <ul class="filter-list">
                <li>
                  <a
                    class="btn btn-primary"
                    href="javascript:void(0);"
                    data-bs-toggle="modal"
                    data-bs-target="#add_modal"
                  >
                    <i class="fa fa-plus-circle me-2" aria-hidden="true"></i>Add
                    Signature
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-sm-12">
            <div class=" card-table">
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-center datatable signature-table">
                    <thead class="thead-light">
                      <tr>
                        <th>#</th>
                        <th>Signature Name</th>
                        <th>Signature</th>
                        <th>Status</th>
                        <th class="no-sort">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>1</td>
                        <td>Allen</td>
                        <td>
                          <div class="table-avatar">
                            <img
                              class="img-fluid light-color-logo"
                              width="80"
                              height="30"
                              src="assets/img/user-signature.png"
                              alt="User Image"
                            />
                            <img
                              class="img-fluid dark-white-logo"
                              width="80"
                              height="30"
                              src="assets/img/user-signature-white.png"
                              alt="User Image"
                            />
                          </div>
                        </td>
                        <td>
                          <div class="status-toggle">
                            <input
                              id="rating_1"
                              class="check"
                              type="checkbox"
                              checked=""
                            />
                            <label
                              for="rating_1"
                              class="checktoggle checkbox-bg"
                            >
                              checkbox
                            </label>
                          </div>
                        </td>
                        <td class="d-flex align-items-center">
                          <a
                            class=" btn-action-icon active me-2"
                            href="javascript:void(0);"
                            data-bs-toggle="tooltip"
                            title="Remove default"
                            data-bs-placement="left"
                          >
                            <i class="fe fe-star"></i>
                          </a>
                          <a
                            class=" btn-action-icon me-2"
                            href="javascript:void(0);"
                            data-bs-toggle="modal"
                            data-bs-target="#edit_modal"
                          >
                            <i class="fe fe-edit"></i>
                          </a>
                          <a
                            class=" btn-action-icon"
                            href="javascript:void(0);"
                            data-bs-toggle="modal"
                            data-bs-target="#warning_modal"
                          >
                            <i class="fe fe-trash-2"></i>
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td>2</td>
                        <td>Raymond</td>
                        <td>
                          <h2 class="table-avatar">
                            <img
                              class="img-fluid light-color-logo"
                              width="80"
                              height="30"
                              src="assets/img/user-signature.png"
                              alt="User Image"
                            />
                            <img
                              class="img-fluid dark-white-logo"
                              width="80"
                              height="30"
                              src="assets/img/user-signature-white.png"
                              alt="User Image"
                            />
                          </h2>
                        </td>
                        <td>
                          <div class="status-toggle">
                            <input
                              id="rating_2"
                              class="check"
                              type="checkbox"
                              checked=""
                            />
                            <label
                              for="rating_2"
                              class="checktoggle checkbox-bg"
                            >
                              checkbox
                            </label>
                          </div>
                        </td>
                        <td class="d-flex align-items-center">
                          <a
                            class=" btn-action-icon me-2"
                            href="javascript:void(0);"
                            data-bs-toggle="tooltip"
                            title="Make as default"
                            data-bs-placement="left"
                          >
                            <i class="fe fe-star"></i>
                          </a>
                          <a
                            class=" btn-action-icon me-2"
                            href="javascript:void(0);"
                            data-bs-toggle="modal"
                            data-bs-target="#edit_modal"
                          >
                            <i class="fe fe-edit"></i>
                          </a>
                          <a
                            class=" btn-action-icon"
                            href="javascript:void(0);"
                            data-bs-toggle="modal"
                            data-bs-target="#warning_modal"
                          >
                            <i class="fe fe-trash-2"></i>
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td>3</td>
                        <td>Ralph</td>
                        <td>
                          <h2 class="table-avatar">
                            <img
                              class="img-fluid light-color-logo"
                              width="80"
                              height="30"
                              src="assets/img/user-signature.png"
                              alt="User Image"
                            />
                            <img
                              class="img-fluid dark-white-logo"
                              width="80"
                              height="30"
                              src="assets/img/user-signature-white.png"
                              alt="User Image"
                            />
                          </h2>
                        </td>
                        <td>
                          <div class="status-toggle">
                            <input
                              id="rating_3"
                              class="check"
                              type="checkbox"
                            />
                            <label
                              for="rating_3"
                              class="checktoggle checkbox-bg"
                            >
                              checkbox
                            </label>
                          </div>
                        </td>
                        <td class="d-flex align-items-center">
                          <a
                            class=" btn-action-icon me-2"
                            href="javascript:void(0);"
                            data-bs-toggle="tooltip"
                            title="Make as default"
                            data-bs-placement="left"
                          >
                            <i class="fe fe-star"></i>
                          </a>
                          <a
                            class=" btn-action-icon me-2"
                            href="javascript:void(0);"
                            data-bs-toggle="modal"
                            data-bs-target="#edit_modal"
                          >
                            <i class="fe fe-edit"></i>
                          </a>
                          <a
                            class=" btn-action-icon"
                            href="javascript:void(0);"
                            data-bs-toggle="modal"
                            data-bs-target="#warning_modal"
                          >
                            <i class="fe fe-trash-2"></i>
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td>4</td>
                        <td>Ruth</td>
                        <td>
                          <h2 class="table-avatar">
                            <img
                              class="img-fluid light-color-logo"
                              width="80"
                              height="30"
                              src="assets/img/user-signature.png"
                              alt="User Image"
                            />
                            <img
                              class="img-fluid dark-white-logo"
                              width="80"
                              height="30"
                              src="assets/img/user-signature-white.png"
                              alt="User Image"
                            />
                          </h2>
                        </td>
                        <td>
                          <div class="status-toggle">
                            <input
                              id="rating_4"
                              class="check"
                              type="checkbox"
                              checked=""
                            />
                            <label
                              for="rating_4"
                              class="checktoggle checkbox-bg"
                            >
                              checkbox
                            </label>
                          </div>
                        </td>
                        <td class="d-flex align-items-center">
                          <a
                            class=" btn-action-icon me-2"
                            href="javascript:void(0);"
                            data-bs-toggle="tooltip"
                            title="Make as default"
                            data-bs-placement="left"
                          >
                            <i class="fe fe-star"></i>
                          </a>
                          <a
                            class=" btn-action-icon me-2"
                            href="javascript:void(0);"
                            data-bs-toggle="modal"
                            data-bs-target="#edit_modal"
                          >
                            <i class="fe fe-edit"></i>
                          </a>
                          <a
                            class=" btn-action-icon"
                            href="javascript:void(0);"
                            data-bs-toggle="modal"
                            data-bs-target="#warning_modal"
                          >
                            <i class="fe fe-trash-2"></i>
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td>5</td>
                        <td>Steven</td>
                        <td>
                          <h2 class="table-avatar">
                            <img
                              class="img-fluid light-color-logo"
                              width="80"
                              height="30"
                              src="assets/img/user-signature.png"
                              alt="User Image"
                            />
                            <img
                              class="img-fluid dark-white-logo"
                              width="80"
                              height="30"
                              src="assets/img/user-signature-white.png"
                              alt="User Image"
                            />
                          </h2>
                        </td>
                        <td>
                          <div class="status-toggle">
                            <input
                              id="rating_5"
                              class="check"
                              type="checkbox"
                              checked=""
                            />
                            <label
                              for="rating_5"
                              class="checktoggle checkbox-bg"
                            >
                              checkbox
                            </label>
                          </div>
                        </td>
                        <td class="d-flex align-items-center">
                          <a
                            class=" btn-action-icon me-2"
                            href="javascript:void(0);"
                            data-bs-toggle="tooltip"
                            title="Make as default"
                            data-bs-placement="left"
                          >
                            <i class="fe fe-star"></i>
                          </a>
                          <a
                            class=" btn-action-icon me-2"
                            href="javascript:void(0);"
                            data-bs-toggle="modal"
                            data-bs-target="#edit_modal"
                          >
                            <i class="fe fe-edit"></i>
                          </a>
                          <a
                            class=" btn-action-icon"
                            href="javascript:void(0);"
                            data-bs-toggle="modal"
                            data-bs-target="#warning_modal"
                          >
                            <i class="fe fe-trash-2"></i>
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td>6</td>
                        <td>Earnes</td>
                        <td>
                          <h2 class="table-avatar">
                            <img
                              class="img-fluid light-color-logo"
                              width="80"
                              height="30"
                              src="assets/img/user-signature.png"
                              alt="User Image"
                            />
                            <img
                              class="img-fluid dark-white-logo"
                              width="80"
                              height="30"
                              src="assets/img/user-signature-white.png"
                              alt="User Image"
                            />
                          </h2>
                        </td>
                        <td>
                          <div class="status-toggle">
                            <input
                              id="rating_6"
                              class="check"
                              type="checkbox"
                              checked=""
                            />
                            <label
                              for="rating_6"
                              class="checktoggle checkbox-bg"
                            >
                              checkbox
                            </label>
                          </div>
                        </td>
                        <td class="d-flex align-items-center">
                          <a
                            class=" btn-action-icon me-2"
                            href="javascript:void(0);"
                            data-bs-toggle="tooltip"
                            title="Make as default"
                            data-bs-placement="left"
                          >
                            <i class="fe fe-star"></i>
                          </a>
                          <a
                            class=" btn-action-icon me-2"
                            href="javascript:void(0);"
                            data-bs-toggle="modal"
                            data-bs-target="#edit_modal"
                          >
                            <i class="fe fe-edit"></i>
                          </a>
                          <a
                            class=" btn-action-icon"
                            href="javascript:void(0);"
                            data-bs-toggle="modal"
                            data-bs-target="#warning_modal"
                          >
                            <i class="fe fe-trash-2"></i>
                          </a>
                        </td>
                      </tr>
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

export default SignatureWrapper;
