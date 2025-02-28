import React from "react";

const AddSignature = () => {
  return (
<div class="modal fade" id="add-category">
			<div class="modal-dialog modal-dialog-centered">
				<div class="modal-content">
					<div class="modal-header">
						<div class="page-title">
							<h4>Add Category</h4>
						</div>
						<button type="button" class="close bg-danger text-white fs-16" data-bs-dismiss="modal" aria-label="Close">
							<span aria-hidden="true">&times;</span>
						</button>
					</div>
					<form action="https://dreamspos.dreamstechnologies.com/html/template/category-list.html">
						<div class="modal-body">
							<div class="mb-3">
								<label class="form-label">Category<span class="text-danger ms-1">*</span></label>
								<input type="text" class="form-control"/>
							</div>
							<div class="mb-3">
								<label class="form-label">Category Slug<span class="text-danger ms-1">*</span></label>
								<input type="text" class="form-control"/>
							</div>
							<div class="mb-0">
								<div class="status-toggle modal-status d-flex justify-content-between align-items-center">
									<span class="status-label">Status<span class="text-danger ms-1">*</span></span>
									<input type="checkbox" id="user2" class="check" checked=""/>
									<label for="user2" class="checktoggle"></label>
								</div>
							</div>
						</div>
						<div class="modal-footer">
							<button type="button" class="btn me-2 btn-secondary" data-bs-dismiss="modal">Cancel</button>
							<button type="submit" class="btn btn-primary">Add Category</button>
						</div>
					</form>
				</div>
			</div>
		</div>
  );
};

export default AddSignature;
