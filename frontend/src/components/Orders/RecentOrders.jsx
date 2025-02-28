import React from 'react'

const RecentOrders = () => {
  return (
<div class="page-wrapper">
				<div class="content">
					<div class="page-header">
						<div class="add-item d-flex">
							<div class="page-title">
								<h4>Sales</h4>
								<h6>Manage Your Sales</h6>
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
							<a href="#" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-sales-new"><i class="ti ti-circle-plus me-1"></i>Add Sales</a>
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
										Customer
									</a>
									<ul class="dropdown-menu  dropdown-menu-end p-3">
										<li>
											<a href="javascript:void(0);" class="dropdown-item rounded-1">Carl Evans</a>
										</li>
										<li>
											<a href="javascript:void(0);" class="dropdown-item rounded-1">Minerva Rameriz</a>
										</li>
										<li>
											<a href="javascript:void(0);" class="dropdown-item rounded-1">Robert Lamon</a>
										</li>
										<li>
											<a href="javascript:void(0);" class="dropdown-item rounded-1">Patricia Lewis</a>
										</li>
									</ul>
								</div>
								<div class="dropdown me-2">
									<a href="javascript:void(0);" class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown">
										Staus
									</a>
									<ul class="dropdown-menu  dropdown-menu-end p-3">
										<li>
											<a href="javascript:void(0);" class="dropdown-item rounded-1">Completed</a>
										</li>
										<li>
											<a href="javascript:void(0);" class="dropdown-item rounded-1">Pending</a>
										</li>
									</ul>
								</div>
								<div class="dropdown me-2">
									<a href="javascript:void(0);" class="dropdown-toggle btn btn-white btn-md d-inline-flex align-items-center" data-bs-toggle="dropdown">
										Payment Status
									</a>
									<ul class="dropdown-menu  dropdown-menu-end p-3">
										<li>
											<a href="javascript:void(0);" class="dropdown-item rounded-1">Paid</a>
										</li>
										<li>
											<a href="javascript:void(0);" class="dropdown-item rounded-1">Unpaid</a>
										</li>
										<li>
											<a href="javascript:void(0);" class="dropdown-item rounded-1">Overdue</a>
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
											<th class="no-sort">
												<label class="checkboxs">
													<input type="checkbox" id="select-all"/>
													<span class="checkmarks"></span>
												</label>
											</th>
											<th>Customer</th>
											<th>Reference</th>
											<th>Date</th>
											<th>Status</th>
											<th>Grand Total</th>
											<th>Paid</th>
											<th>Due</th>
											<th>Payment Status</th>
											<th>Biller</th>
											<th></th>
										</tr>
									</thead>
									<tbody class="sales-list">
										<tr>
											<td>
												<label class="checkboxs">
													<input type="checkbox"/>
													<span class="checkmarks"></span>
												</label>
											</td>
											<td>
												<div class="d-flex align-items-center">
													<a href="javascript:void(0);" class="avatar avatar-md me-2">
														<img src="assets/img/users/user-27.jpg" alt="product"/>
													</a>
													<a href="javascript:void(0);">Carl Evans</a>
												</div>
											</td>
											<td>SL001</td>
											<td>24 Dec 2024</td>
											<td><span class="badge badge-success">Completed</span></td>
											<td>$1000</td>
											<td>$1000</td>
											<td>$0.00</td>
											<td><span class="badge badge-soft-success shadow-none badge-xs"><i class="ti ti-point-filled me-1"></i>Paid</span></td>
											<td>Admin</td>
											<td class="text-center">
												<a class="action-set" href="javascript:void(0);" data-bs-toggle="dropdown" aria-expanded="true">
													<i class="fa fa-ellipsis-v" aria-hidden="true"></i>
												</a>
												<ul class="dropdown-menu">
													<li>
														<a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#sales-details-new"><i data-feather="eye" class="info-img"></i>Sale Detail</a>
													</li>
													<li>
														<a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#edit-sales-new"><i data-feather="edit" class="info-img"></i>Edit Sale</a>
													</li>
													<li>
														<a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#showpayment"><i data-feather="dollar-sign" class="info-img"></i>Show Payments</a>
													</li>
													<li>
														<a href="javascript:void(0);" class="dropdown-item" data-bs-toggle="modal" data-bs-target="#createpayment"><i data-feather="plus-circle" class="info-img"></i>Create Payment</a>
													</li>
													<li>
														<a href="javascript:void(0);" class="dropdown-item"><i data-feather="download" class="info-img"></i>Download pdf</a>
													</li>	
													<li>
														<a href="javascript:void(0);" class="dropdown-item mb-0" data-bs-toggle="modal" data-bs-target="#delete"><i data-feather="trash-2" class="info-img"></i>Delete Sale</a>
													</li>								
												</ul>
											</td>
										</tr>
										
									</tbody>
								</table>
							</div>
						</div>
					</div>
					
				</div>
				
			</div>
  )
}

export default RecentOrders