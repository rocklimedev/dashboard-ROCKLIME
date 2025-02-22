import React from 'react'

const AddCategoryModal = () => {
  return (
	<div class="modal custom-modal fade" id="add_category" role="dialog">
				<div class="modal-dialog modal-dialog-centered modal-md">
					<div class="modal-content">
						<div class="modal-header border-0 pb-0">
							<div class="form-header modal-header-title text-start mb-0">
								<h4 class="mb-0">Add Category</h4>
							</div>
							<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
								
							</button>
						</div>
						<form action="#">
							<div class="modal-body">
								<div class="row">
									<div class="col-md-12">
										<div class="card-body">
											<div class="form-group-item border-0 pb-0 mb-0">
												<div class="row">
													<div class="col-lg-12 col-sm-12">
														<div class="input-block mb-3">
															<label>Name <span class="text-danger">*</span></label>
															<input type="text"  class="form-control" placeholder="Enter Title"/>
														</div>											
													</div>
													<div class="col-lg-12 col-sm-12">
														<div class="input-block mb-3">
															<label>Slug</label>
															<input type="text" class="form-control" placeholder="Enter Slug"/>
														</div>
													</div>
													<div class="col-lg-12 col-sm-12">
														<div class="input-block mb-3">
															<label>Parent Category</label>
															<select class="select">
																<option>None</option>
																<option>Coupons</option>
																<option>News</option>
																<option>Plugins</option>
																<option>Themes</option>
																<option>Tutorial</option>
															</select>
														</div>
													</div>
													<div class="col-lg-12 col-sm-12">
														<div class="input-block mb-0 pb-0">
															<label>Image</label>
															<div class="input-block service-upload mb-0">
																<span><img src="assets/img/icons/drop-icon.svg" alt="upload"/></span>
																<h6 class="drop-browse align-center">Drop your files here or<span class="text-primary ms-1">browse</span></h6>
																<p class="text-muted">Maximum size: 50MB</p>	
																<input type="file" multiple="" id="image_sign"/>
																<div id="frames"></div>
															</div>
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
							<div class="modal-footer">
								<button type="button" data-bs-dismiss="modal" class="btn btn-back cancel-btn me-2">Cancel</button>
								<button type="submit" data-bs-dismiss="modal" class="btn btn-primary paid-continue-btn">Add Category</button>
							</div>
						</form>
					</div>
				</div>
			</div>
  )
}

export default AddCategoryModal