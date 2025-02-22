import React from 'react'

const DeleteSignature = () => {
  return (
<div class="modal custom-modal fade signature-delete-modal" id="warning_modal" role="dialog">
				<div class="modal-dialog modal-dialog-centered modal-md">
					<div class="modal-content">
						<div class="modal-body">
							<div class="form-header">
								<div class="mb-2"><i class="fe fe-alert-circle text-warning"></i></div>
								<h3>Are you Sure?</h3>
								<p>You won’t be able to revert this!</p>
							</div>
							<div class="modal-btn delete-action text-center modal-footer pb-0 justify-content-center">
								<button type="reset" data-bs-toggle="modal" data-bs-target="#delete_modal" class="btn btn-primary me-2">Yes, delete it!</button>
								<button type="reset" data-bs-dismiss="modal" class="btn btn-back">Cancel</button>
							</div>
						</div>
					</div>
				</div>
			</div>
  )
}

export default DeleteSignature