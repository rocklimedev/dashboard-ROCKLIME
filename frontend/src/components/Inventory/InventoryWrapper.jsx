import React from "react";

const InventoryWrapper = () => {
  return (
    <div class="page-wrapper">
      <div class="content container-fluid">
        <div class="page-header">
          <div class="content-page-header ">
            <h5>Inventory</h5>
            <div class="list-btn">
              <ul class="filter-list">
                <li>
                  <a
                    class="btn btn-filters w-auto popup-toggle"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    data-bs-original-title="filter"
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
                <li class="">
                  <div
                    class="dropdown dropdown-action"
                    data-bs-toggle="tooltip"
                    data-bs-placement="top"
                    data-bs-original-title="download"
                  >
                    <a
                      href="#"
                      class="btn-filters"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <span>
                        <i class="fe fe-download"></i>
                      </span>
                    </a>
                    <div class="dropdown-menu dropdown-menu-right">
                      <ul class="d-block">
                        <li>
                          <a
                            class="d-flex align-items-center download-item"
                            href="javascript:void(0);"
                            download
                          >
                            <i class="far fa-file-pdf me-2"></i>PDF
                          </a>
                        </li>
                        <li>
                          <a
                            class="d-flex align-items-center download-item"
                            href="javascript:void(0);"
                            download
                          >
                            <i class="far fa-file-text me-2"></i>CVS
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>
                <li>
                  <a
                    class="btn-filters"
                    href="javascript:void(0);"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    data-bs-original-title="print"
                  >
                    <span>
                      <i class="fe fe-printer"></i>
                    </span>{" "}
                  </a>
                </li>
                <li>
                  <a
                    class="btn btn-primary"
                    href="javascript:void(0);"
                    data-bs-toggle="modal"
                    data-bs-target="#add_inventory"
                  >
                    <i class="fa fa-plus-circle me-2" aria-hidden="true"></i>Add
                    New
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
                  <table class="table table-center table-hover datatable">
                    <thead class="thead-light">
                      <tr>
                        <th>#</th>
                        <th>Item</th>
                        <th>Code</th>
                        <th>Units</th>
                        <th>Quantity</th>
                        <th>Selling Price</th>
                        <th>Purchase Price</th>
                        <th class="no-sort">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>1</td>
                        <td>Lenovo 3rd Generation</td>
                        <td>P125389</td>
                        <td>Inches</td>
                        <td>2</td>
                        <td>$253.00</td>
                        <td>$248.00</td>
                        <td class="d-flex align-items-center">
                          <a
                            href="#"
                            class="btn btn-greys bg-history-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#inventory_history"
                          >
                            <i class="far fa-eye me-1"></i> History
                          </a>
                          <a
                            href="#"
                            class="btn btn-greys bg-success-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#stock_in"
                          >
                            <i class="fa fa-plus-circle me-1"></i> Stock in
                          </a>
                          <a
                            href="#"
                            class="btn btn-greys bg-danger-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#stock_out"
                          >
                            <i class="fa fa-plus-circle me-1"></i> Stock out
                          </a>
                          <div class="dropdown dropdown-action">
                            <a
                              href="#"
                              class=" btn-action-icon "
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i class="fas fa-ellipsis-v"></i>
                            </a>
                            <div class="dropdown-menu dropdown-menu-right">
                              <ul>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#edit_inventory"
                                  >
                                    <i class="far fa-edit me-2"></i>Edit
                                  </a>
                                </li>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete_stock"
                                  >
                                    <i class="far fa-trash-alt me-2"></i>Delete
                                  </a>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>2</td>
                        <td>Nike Jordan</td>
                        <td>P125390</td>
                        <td>Pieces</td>
                        <td>4</td>
                        <td>$360.00</td>
                        <td>$350.00</td>
                        <td class="d-flex align-items-center">
                          <a
                            href="#"
                            class="btn btn-greys bg-history-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#inventory_history"
                          >
                            <i class="far fa-eye me-1"></i> History
                          </a>
                          <a
                            href="#"
                            class="btn btn-greys bg-success-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#stock_in"
                          >
                            <i class="fa fa-plus-circle me-1"></i> Stock in
                          </a>
                          <a
                            href="#"
                            class="btn btn-greys bg-danger-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#stock_out"
                          >
                            <i class="fa fa-plus-circle me-1"></i> Stock out
                          </a>
                          <div class="dropdown dropdown-action">
                            <a
                              href="#"
                              class=" btn-action-icon "
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i class="fas fa-ellipsis-v"></i>
                            </a>
                            <div class="dropdown-menu dropdown-menu-right">
                              <ul>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#edit_inventory"
                                  >
                                    <i class="far fa-edit me-2"></i>Edit
                                  </a>
                                </li>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete_stock"
                                  >
                                    <i class="far fa-trash-alt me-2"></i>Delete
                                  </a>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>3</td>
                        <td>Apple Series 5 Watch</td>
                        <td>P125391</td>
                        <td>Inches</td>
                        <td>7</td>
                        <td>$724.00</td>
                        <td>$700.00</td>
                        <td class="d-flex align-items-center">
                          <a
                            href="#"
                            class="btn btn-greys bg-history-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#inventory_history"
                          >
                            <i class="far fa-eye me-1"></i> History
                          </a>
                          <a
                            href="#"
                            class="btn btn-greys bg-success-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#stock_in"
                          >
                            <i class="fa fa-plus-circle me-1"></i> Stock in
                          </a>
                          <a
                            href="#"
                            class="btn btn-greys bg-danger-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#stock_out"
                          >
                            <i class="fa fa-plus-circle me-1"></i> Stock out
                          </a>
                          <div class="dropdown dropdown-action">
                            <a
                              href="#"
                              class=" btn-action-icon "
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i class="fas fa-ellipsis-v"></i>
                            </a>
                            <div class="dropdown-menu dropdown-menu-right">
                              <ul>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#edit_inventory"
                                  >
                                    <i class="far fa-edit me-2"></i>Edit
                                  </a>
                                </li>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete_stock"
                                  >
                                    <i class="far fa-trash-alt me-2"></i>Delete
                                  </a>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>4</td>
                        <td>Amazon Echo Dot</td>
                        <td>P125392</td>
                        <td>Box</td>
                        <td>3</td>
                        <td>$210.00</td>
                        <td>$200.00</td>
                        <td class="d-flex align-items-center">
                          <a
                            href="#"
                            class="btn btn-greys bg-history-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#inventory_history"
                          >
                            <i class="far fa-eye me-1"></i> History
                          </a>
                          <a
                            href="#"
                            class="btn btn-greys bg-success-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#stock_in"
                          >
                            <i class="fa fa-plus-circle me-1"></i> Stock in
                          </a>
                          <a
                            href="#"
                            class="btn btn-greys bg-danger-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#stock_out"
                          >
                            <i class="fa fa-plus-circle me-1"></i> Stock out
                          </a>
                          <div class="dropdown dropdown-action">
                            <a
                              href="#"
                              class=" btn-action-icon "
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i class="fas fa-ellipsis-v"></i>
                            </a>
                            <div class="dropdown-menu dropdown-menu-right">
                              <ul>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#edit_inventory"
                                  >
                                    <i class="far fa-edit me-2"></i>Edit
                                  </a>
                                </li>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete_stock"
                                  >
                                    <i class="far fa-trash-alt me-2"></i>Delete
                                  </a>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>5</td>
                        <td>Lobar Handy</td>
                        <td>P125393</td>
                        <td>Kilograms</td>
                        <td>1</td>
                        <td>$155.00</td>
                        <td>$150.00</td>
                        <td class="d-flex align-items-center">
                          <a
                            href="#"
                            class="btn btn-greys bg-history-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#inventory_history"
                          >
                            <i class="far fa-eye me-1"></i> History
                          </a>
                          <a
                            href="#"
                            class="btn btn-greys bg-success-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#stock_in"
                          >
                            <i class="fa fa-plus-circle me-1"></i> Stock in
                          </a>
                          <a
                            href="#"
                            class="btn btn-greys bg-danger-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#stock_out"
                          >
                            <i class="fa fa-plus-circle me-1"></i> Stock out
                          </a>
                          <div class="dropdown dropdown-action">
                            <a
                              href="#"
                              class=" btn-action-icon "
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i class="fas fa-ellipsis-v"></i>
                            </a>
                            <div class="dropdown-menu dropdown-menu-right">
                              <ul>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#edit_inventory"
                                  >
                                    <i class="far fa-edit me-2"></i>Edit
                                  </a>
                                </li>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete_stock"
                                  >
                                    <i class="far fa-trash-alt me-2"></i>Delete
                                  </a>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>6</td>
                        <td>Woodcraft Sandal</td>
                        <td>P125389</td>
                        <td>Inches</td>
                        <td>2</td>
                        <td>$253.00</td>
                        <td>$248.00</td>
                        <td class="d-flex align-items-center">
                          <a
                            href="#"
                            class="btn btn-greys bg-history-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#inventory_history"
                          >
                            <i class="far fa-eye me-1"></i> History
                          </a>
                          <a
                            href="#"
                            class="btn btn-greys bg-success-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#stock_in"
                          >
                            <i class="fa fa-plus-circle me-1"></i> Stock in
                          </a>
                          <a
                            href="#"
                            class="btn btn-greys bg-danger-light me-2"
                            data-bs-toggle="modal"
                            data-bs-target="#stock_out"
                          >
                            <i class="fa fa-plus-circle me-1"></i> Stock out
                          </a>
                          <div class="dropdown dropdown-action">
                            <a
                              href="#"
                              class=" btn-action-icon "
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                            >
                              <i class="fas fa-ellipsis-v"></i>
                            </a>
                            <div class="dropdown-menu dropdown-menu-right">
                              <ul>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#edit_inventory"
                                  >
                                    <i class="far fa-edit me-2"></i>Edit
                                  </a>
                                </li>
                                <li>
                                  <a
                                    class="dropdown-item"
                                    href="#"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete_stock"
                                  >
                                    <i class="far fa-trash-alt me-2"></i>Delete
                                  </a>
                                </li>
                              </ul>
                            </div>
                          </div>
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

export default InventoryWrapper;
