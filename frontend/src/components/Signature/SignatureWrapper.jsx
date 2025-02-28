import React from "react";
import PageHeader from "../Common/PageHeader";

const SignatureWrapper = () => {
  return (
    <div class="page-wrapper">
    <div class="content">
   <PageHeader />
      <div class="mb-4">
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <ul class="nav nav-pills low-stock-tab d-flex me-2 mb-0" id="pills-tab" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" id="pills-home-tab" data-bs-toggle="pill" data-bs-target="#pills-home" type="button" role="tab" aria-controls="pills-home" aria-selected="true">Low Stocks</button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="pills-profile-tab" data-bs-toggle="pill" data-bs-target="#pills-profile" type="button" role="tab" aria-controls="pills-profile" aria-selected="false">Out of Stocks</button>
          </li>
          
        </ul>
        <div class="notify d-flex bg-white p-1 px-2 border rounded">
          <div class="status-toggle text-secondary d-flex justify-content-between align-items-center">
            <input type="checkbox" id="user2" class="check" checked=""/>
            <label for="user2" class="checktoggle me-2">checkbox</label>
            Notify
          </div>
        </div>
      </div>
        <div class="tab-content" id="pills-tabContent">
          <div class="tab-pane fade show active" id="pills-home" role="tabpanel" aria-labelledby="pills-home-tab">
       
            <div class="card">
              <div class="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                <div class="search-set">
                  <div class="search-input">
                    <span class="btn-searchset"><i class="ti ti-search fs-14 feather-search"></i></span>
                  </div>
                </div>
        
                <div class="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                  <div class="dropdown me-2">
                    <a href="javascript:void(0);" class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown">
                      Warehouse
                    </a>
                    <ul class="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Lenovo IdeaPad 3</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Beats Pro </a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Nike Jordan</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Apple Series 5 Watch</a>
                      </li>
                    </ul>
                  </div>
                  <div class="dropdown me-2">
                    <a href="javascript:void(0);" class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown">
                      Store
                    </a>
                    <ul class="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">James Kirwin</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Francis Chang</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Antonio Engle</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Leo Kelly</a>
                      </li>
                    </ul>
                  </div>
                  <div class="dropdown">
                    <a href="javascript:void(0);" class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown">
                      Category
                    </a>
                    <ul class="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Computers</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Electronics</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Shoe</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Electronics</a>
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
                            <input type="checkbox" id="select-all"/>
                            <span class="checkmarks"></span>
                          </label>
                        </th>
                        <th>Warehouse</th>
                        <th>Store</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>SKU</th>
                        <th>Qty</th>
                        <th>Qty Alert</th>
                        <th class="no-sort"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <label class="checkboxs">
                            <input type="checkbox"/>
                            <span class="checkmarks"></span>
                          </label>
                        </td>
                        <td>Lavish Warehouse </td>
                        <td>Electro Mart</td>
                        
                        <td>
                          <div class="d-flex align-items-center">
                            <a href="javascript:void(0);" class="avatar avatar-md me-2">
                              <img src="assets/img/products/stock-img-01.png" alt="product"/>
                            </a>
                            <a href="javascript:void(0);">Lenovo IdeaPad 3</a>
                          </div>												
                        </td>
                        <td>Computers</td>
                        <td>PT001</td>
                        <td>20</td>
                        <td>15</td>
                        <td class="action-table-data">
                          <div class="edit-delete-action">
                            <a class="me-2 p-2" href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#edit-stock">
                              <i data-feather="edit" class="feather-edit"></i>
                            </a>
                            <a data-bs-toggle="modal" data-bs-target="#delete-modal" class="p-2" href="javascript:void(0);">
                              <i data-feather="trash-2" class="feather-trash-2"></i>
                            </a>
                          </div>
                          
                        </td>
                      </tr>
                     
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
        
          </div>
          <div class="tab-pane fade" id="pills-profile" role="tabpanel" aria-labelledby="pills-profile-tab">
  
            <div class="card">
              <div class="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
                <div class="search-set">
                  <div class="search-input">
                    <span class="btn-searchset"><i class="ti ti-search fs-14 feather-search"></i></span>
                  </div>
                </div>
                <div class="d-flex table-dropdown my-xl-auto right-content align-items-center flex-wrap row-gap-3">
                  <div class="dropdown me-2">
                    <a href="javascript:void(0);" class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown">
                      Warehouse
                    </a>
                    <ul class="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Lenovo IdeaPad 3</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Beats Pro </a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Nike Jordan</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Apple Series 5 Watch</a>
                      </li>
                    </ul>
                  </div>
                  <div class="dropdown me-2">
                    <a href="javascript:void(0);" class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown">
                      Store
                    </a>
                    <ul class="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">James Kirwin</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Francis Chang</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Antonio Engle</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Leo Kelly</a>
                      </li>
                    </ul>
                  </div>
                  <div class="dropdown me-2">
                    <a href="javascript:void(0);" class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown">
                      Category
                    </a>
                    <ul class="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Computers</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Electronics</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Shoe</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Electronics</a>
                      </li>
                    </ul>
                  </div>
                  <div class="dropdown">
                    <a href="javascript:void(0);" class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown">
                      Sort By : Last 7 Days
                    </a>
                    <ul class="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Recently Added</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Ascending</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Desending</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Last Month</a>
                      </li>
                      <li>
                        <a href="javascript:void(0);" class="dropdown-item rounded-1">Last 7 Days</a>
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
                        <th class="no-sort" >
                          <label class="checkboxs">
                            <input type="checkbox" id="select-all-2"/>
                            <span class="checkmarks"></span>
                          </label>
                        </th>
                        <th>Warehouse</th>
                        <th>Store</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>SKU</th>
                        <th>Qty</th>
                        <th>Qty Alert</th>
                        <th class="no-sort">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <label class="checkboxs">
                            <input type="checkbox"/>
                            <span class="checkmarks"></span>
                          </label>
                        </td>
                        <td>Lavish Warehouse </td>
                        <td>Electro Mart</td>
                        
                        <td>
                          <div class="d-flex align-items-center">
                            <a href="javascript:void(0);" class="avatar avatar-md me-2">
                              <img src="assets/img/products/stock-img-01.png" alt="product"/>
                            </a>
                            <a href="javascript:void(0);">Lenovo IdeaPad 3</a>
                          </div>												
                        </td>
                        <td>Computers</td>
                        <td>PT001</td>
                        <td>20</td>
                        <td>15</td>
                        <td class="action-table-data">
                          <div class="edit-delete-action">
                            <a class="me-2 p-2" href="javascript:void(0);" data-bs-toggle="modal" data-bs-target="#edit-stock">
                              <i data-feather="edit" class="feather-edit"></i>
                            </a>
                            <a data-bs-toggle="modal" data-bs-target="#delete-modal" class="p-2" href="javascript:void(0);">
                              <i data-feather="trash-2" class="feather-trash-2"></i>
                            </a>
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
   
  </div>
  );
};

export default SignatureWrapper;
