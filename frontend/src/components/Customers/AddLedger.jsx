import React from 'react'

const AddLedger = () => {
  return (
<div class="modal custom-modal fade" id="add_ledger" role="dialog">
				<div class="modal-dialog modal-dialog-centered modal-md">
					<div class="modal-content">
						<div class="modal-header border-0 pb-0">
							<div class="form-header modal-header-title text-start mb-0">
								<h4 class="mb-0">Add Ledger</h4>
							</div>
							<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
								
							</button>
						</div>
						<div class="modal-body">
							<div class="row">
								<div class="col-lg-12 col-md-12">
									<div class="input-block mb-3">
										<label>Amount</label>
										<input type="text" class="form-control" placeholder="Enter Amount"/>
									</div>
								</div>
								<div class="col-lg-12 col-md-12">
									<div class="input-block mb-3">
										<label>Date</label>
										<div class="cal-icon cal-icon-info">
											<input type="text" class="datetimepicker form-control" placeholder="Select Date"/>
										</div>
									</div>
								</div>
								<div class="col-lg-12 col-md-12">
									<div class="input-block d-inline-flex align-center mb-0">
										<label class="me-5 mb-0">Mode</label>
										<div>
											<label class="custom_radio me-3 mb-0">
												<input type="radio" name="payment" checked/>
												<span class="checkmark"></span> Credit
											</label>
											<label class="custom_radio mb-0">
												<input type="radio" name="payment"/>
												<span class="checkmark"></span> Debit
											</label>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div class="modal-footer">
							<a href="#" data-bs-dismiss="modal" class="btn btn-back cancel-btn me-2">Cancel</a>
							<a href="#" data-bs-dismiss="modal" class="btn btn-primary paid-continue-btn">Submit</a>
						</div>
					</div>
				</div>
			</div>
  )
}

export default AddLedger