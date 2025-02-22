import React from 'react'

const EditSignature = () => {
  return (
    <div class="modal custom-modal signature-add-modal fade" id="edit_modal" role="dialog">
    <div class="modal-dialog modal-dialog-centered modal-md">
        <div class="modal-content">
            <div class="modal-header border-0 pb-0">
                <div class="form-header modal-header-title text-start mb-0">
                    <h4 class="mb-0">Edit Signature</h4>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                    
                </button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col-lg-12 col-md-12">
                        <div class="input-block mb-3">
                            <label>Signature Name</label>
                            <input type="text" class="form-control" value="Shirley"/>
                        </div>
                    </div>
                    <div class="col-lg-9 col-md-12">
                        <div class="input-block mb-3">
                            <label>Upload</label>
                            <div class="input-block service-upload service-upload-info mb-0">
                                <span><i class="fe fe-upload-cloud me-1"></i>Upload Signature</span>
                                <input type="file" multiple=""/>
                                <div id="frames2"></div>
                            </div>
                            <p>Image format should be png and jpg</p>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-12 ps-0">
                        <div class="input-block mb-3">
                            <label>&nbsp;</label>
                            <div class="signature-preview">
                                <a href="javascript:void(0);"><i class="fe fe-trash-2"></i></a>
                                <img src="assets/img/edit-signature.png" class="img-fluid" alt="img"/>
                            </div>
                        </div>
                        
                    </div>
                    <div class="col-lg-12 col-md-12">
                        <label class="custom_check">
                            <input type="checkbox" name="invoice"/>
                            <span class="checkmark"></span>
                            Mark as default
                            </label>
                            
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <a href="javascript:void(0);" data-bs-dismiss="modal" class="btn btn-back me-2">Cancel</a>
                <a href="javascript:void(0);" data-bs-dismiss="modal" class="btn btn-primary">Update</a>
            </div>
        </div>
    </div>
</div>
  )
}

export default EditSignature