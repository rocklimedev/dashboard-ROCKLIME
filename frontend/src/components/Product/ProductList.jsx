import React from "react";
import PageHeader from "../Common/PageHeader";

const ProductList = () => {
  return (
    <div class="page-wrapper">
				<div class="content">
					<div class="page-header">
						<div class="add-item d-flex">
							<div class="page-title">
								<h4 class="fw-bold">Product List</h4>
								<h6>Manage your products</h6>
							</div>
						</div>
						<ul class="table-top-head">
							<li>
								<a data-bs-toggle="tooltip" data-bs-placement="top" title="Pdf"><img src="assets/img/icons/pdf.svg" alt="img"/></a>
							</li>
							<li>
								<a data-bs-toggle="tooltip" data-bs-placement="top" title="Excel"><img src="assets/img/icons/excel.svg" alt="img"/></a>
							</li>
							<li>
								<a data-bs-toggle="tooltip" data-bs-placement="top" title="Refresh"><i class="ti ti-refresh"></i></a>
							</li>
							<li>
								<a data-bs-toggle="tooltip" data-bs-placement="top" title="Collapse" id="collapse-header"><i class="ti ti-chevron-up"></i></a>
							</li>
						</ul>
						<div class="page-btn">
							<a href="add-product.html" class="btn btn-primary"><i class="ti ti-circle-plus me-1"></i>Add Product</a>
						</div>	
						<div class="page-btn import">
							<a href="#" class="btn btn-secondary color" data-bs-toggle="modal" data-bs-target="#view-notes"><i
								data-feather="download" class="me-1"></i>Import Product</a>
						</div>
					</div>
					
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
										Brand
									</a>
									<ul class="dropdown-menu  dropdown-menu-end p-3">
										<li>
											<a href="javascript:void(0);" class="dropdown-item rounded-1">Lenovo</a>
										</li>
										<li>
											<a href="javascript:void(0);" class="dropdown-item rounded-1">Beats</a>
										</li>
										<li>
											<a href="javascript:void(0);" class="dropdown-item rounded-1">Nike</a>
										</li>
										<li>
											<a href="javascript:void(0);" class="dropdown-item rounded-1">Apple</a>
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
											<th>SKU </th>
											<th>Product Name</th>
											<th>Category</th>
											<th>Brand</th>
											<th>Price</th>
											<th>Unit</th>
											<th>Qty</th>
											<th>Created By</th>
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
											<td>PT001 </td>
											<td>
												<div class="d-flex align-items-center">
													<a href="javascript:void(0);" class="avatar avatar-md me-2">
														<img src="assets/img/products/stock-img-01.png" alt="product"/>
													</a>
													<a href="javascript:void(0);">Lenovo IdeaPad 3 </a>
												</div>												
											</td>							
											<td>Computers</td>
											<td>Lenovo</td>
											<td>$600</td>
											<td>Pc</td>
											<td>100</td>
											<td>
												<div class="d-flex align-items-center">
													<a href="javascript:void(0);" class="avatar avatar-sm me-2">
														<img src="assets/img/users/user-30.jpg" alt="product"/>
													</a>
													<a href="javascript:void(0);">James Kirwin</a>
												</div>
											</td>
											<td class="action-table-data">
												<div class="edit-delete-action">
													<a class="me-2 edit-icon  p-2" href="product-details.html">
														<i data-feather="eye" class="feather-eye"></i>
													</a>
													<a class="me-2 p-2" href="edit-product.html" >
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
  );
};

export default ProductList;
