import React from 'react'

const DeleteModal = () => {
  return (
	<div class="modal custom-modal fade modal-delete" id="delete_modal" role="dialog">
			<div class="modal-dialog modal-dialog-centered modal-md">
				<div class="modal-content">
					<div class="modal-body">
						<div class="form-header">
							<div class="delete-modal-icon">
								<span><i class="fe fe-check-circle"></i></span>
							</div>
							<h3>Are You Sure?</h3>
							<p>You want delete company</p>
						</div>
						<div class="modal-btn delete-action">
							<div class="modal-footer justify-content-center p-0">
								<button type="submit" data-bs-dismiss="modal" class="btn btn-primary paid-continue-btn me-2">Yes, Delete</button>
								<button type="button" data-bs-dismiss="modal" class="btn btn-back cancel-btn">No, Cancel</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
  )
}

export default DeleteModal