import React from "react";

const InventoryHistory = () => {
  return (
    <div class="modal custom-modal fade" id="inventory_history" role="dialog">
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <div class="form-header modal-header-title text-start mb-0">
              <h4 class="mb-0">Inventory History</h4>
            </div>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-sm-12">
                <div class=" card-table">
                  <div class="modal-card-table-head d-flex align-items-center justify-content-between mb-3">
                    <div class="item-name">
                      <h6>Nike Jordan</h6>
                      <span>Item Code : P125390</span>
                    </div>
                    <div class="list-btn">
                      <ul class="filter-list">
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
                      </ul>
                    </div>
                  </div>
                  <div class="card-body">
                    <div class="table-responsive">
                      <table class="table table-center table-hover datatable">
                        <thead class="thead-light">
                          <tr>
                            <th>Date</th>
                            <th>Units</th>
                            <th>Adjustment</th>
                            <th>Stock After</th>
                            <th class="no-sort">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>16 Jun 2024, 04:12AM</td>
                            <td>Inches</td>
                            <td class="text-success">+20</td>
                            <td>159</td>
                            <td>Sale</td>
                          </tr>
                          <tr>
                            <td>15 Jun 2024, 03:12AM</td>
                            <td>Inches</td>
                            <td class="text-danger">-15</td>
                            <td>145</td>
                            <td>Transfer</td>
                          </tr>
                          <tr>
                            <td>14 Jun 2024, 02:12AM</td>
                            <td>Inches</td>
                            <td class="text-success">+16</td>
                            <td>125</td>
                            <td>Damage</td>
                          </tr>
                          <tr>
                            <td>13Jun 2024, 01:12AM</td>
                            <td>Inches</td>
                            <td class="text-success">+21</td>
                            <td>95</td>
                            <td>Sale</td>
                          </tr>
                          <tr>
                            <td>12 Jun 2024, 12:12 PM</td>
                            <td>Inches</td>
                            <td class="text-success">+54</td>
                            <td>87</td>
                            <td>Sale</td>
                          </tr>
                          <tr>
                            <td>11 Jun 2024, 04:12 AM</td>
                            <td>Inches</td>
                            <td class="text-danger">-09</td>
                            <td>54</td>
                            <td>Damage</td>
                          </tr>
                          <tr>
                            <td>09 Aug 2024, 12:12 PM</td>
                            <td>Inches</td>
                            <td class="text-success">+12</td>
                            <td>210</td>
                            <td>Sale</td>
                          </tr>
                          <tr>
                            <td>08 Jun 2024, 03:12AM</td>
                            <td>Inches</td>
                            <td class="text-success">+06</td>
                            <td>200</td>
                            <td>Transfer</td>
                          </tr>
                          <tr>
                            <td>07 Jun 2024, 03:12AM</td>
                            <td>Inches</td>
                            <td class="text-danger">-20</td>
                            <td>145</td>
                            <td>Sale</td>
                          </tr>
                          <tr>
                            <td>06 Jun 2024, 04:12 AM</td>
                            <td>Inches</td>
                            <td class="text-success">+12</td>
                            <td>988</td>
                            <td>Transfer</td>
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
      </div>
    </div>
  );
};

export default InventoryHistory;
