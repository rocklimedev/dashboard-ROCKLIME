import React from "react";
import PageHeader from "../Common/PageHeader";

const ProductList = () => {
  return (
    <div class="page-wrapper">
    <div class="content container-fluid">
    
   <PageHeader/>
   


      <div class="card invoices-tabs-card">
        <div class="invoices-main-tabs">
          <div class="row align-items-center">
            <div class="col-lg-12">
              <div class="invoices-tabs">
                <ul>
                  <li><a href="product-list.html" class="active">Product</a></li>
                  <li><a href="category.html">Category</a></li>	
                  <li><a href="units.html">Units</a></li>	
                </ul>
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
                <div class="companies-table">
                <table class="table table-center table-hover datatable">
                  <thead class="thead-light">
                    <tr>
                      <th>#</th>
                      <th>Item</th>
                      <th>Code</th>
                      <th>Category</th>
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
                      <td ><h2 class="table-avatar">
                        <a href="profile.html" class="avatar avatar-md me-2 companies">
                          <img class="avatar-img sales-rep"
                            src="assets/img/sales-return1.svg"
                            alt="User Image"/></a>
                            <a href="profile.html">Lenovo 3rd Generation</a>
                      </h2></td>
                      <td>P125389</td>
                      <td>Laptop</td>
                      <td>Inches</td>
                      <td>2</td>
                      <td>$253.00</td>
                      <td>$248.00</td>
                      <td class="d-flex align-items-center">
                        <div class="dropdown dropdown-action">
                          <a href="#" class=" btn-action-icon " data-bs-toggle="dropdown" aria-expanded="false"><i class="fas fa-ellipsis-v"></i></a>
                          <div class="dropdown-menu dropdown-menu-right">
                            <ul>
                              <li>
                                <a class="dropdown-item" href="edit-products.html"><i class="far fa-edit me-2"></i>Edit</a>
                              </li>
                              <li>
                                <a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#delete_modal"><i class="far fa-trash-alt me-2"></i>Delete</a>
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
  </div>
  );
};

export default ProductList;
