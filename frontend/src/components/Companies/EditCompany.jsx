import React from 'react'

const EditCompany = () => {
  return (
    <div class="modal custom-modal custom-lg-modal fade p-20" id="edit_companies" role="dialog">
    <div class="modal-dialog modal-dialog-centered modal-md">
        <div class="modal-content">
            <div class="modal-header border-0">
                <div class="form-header modal-header-title text-start mb-0">
                    <h4 class="mb-0">Edit Company</h4>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close">
                </button>
            </div>
            <form action="https://kanakku.dreamstechnologies.com/html/template/companies.html">
                
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="form-field-item">
                                <h5 class="form-title">Company Profile</h5>
                                <div class="profile-picture">
                                    <div class="upload-profile">
                                        <div class="profile-img company-profile-img">
                                            <img id="edit-company-img" class="img-fluid me-0" src="assets/img/companies/company-01.svg" alt="profile-img"/>
                                        </div>
                                        <div class="add-profile">
                                            <h5>Upload a New Photo</h5>
                                            <span>Profile-pic.jpg</span>
                                        </div>
                                    </div>
                                    <div class="img-upload">
                                        <label class="btn btn-upload">
                                            Upload <input type="file"/>
                                        </label>
                                        <a class="btn btn-remove">Remove</a>
                                    </div>										
                                </div>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <div class="input-block mb-3">
                                <label class="form-label">Name </label> 
                                <input type="text" class="form-control" placeholder="Enter Company Name" value="Hermann Groups"/>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="input-block mb-3">
                                <label class="form-label">Email Address </label> 
                                <input type="text" class="form-control" placeholder="Enter Company Email" value="info@example.com"/>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="input-block mb-3">
                                <label class="form-label">Account Url </label> 
                                <div class="url-text-box">
                                    <input type="text" class="form-control" placeholder="Account URL" value="www.hru.example.com"/>
                                    <span class="url-text">kanakku.com</span>
                                </div>
                                
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="input-block mb-3">
                                <label class="mb-2">Phone Number</label>
                                <input class="form-control" id="phone_2" name="phone" type="text" placeholder="Phone Number" value="1245547887"/>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="input-block mb-3">
                                <label class="form-label">Website </label> 
                                <input type="text" class="form-control" placeholder="Enter Website" value="www.example.com"/>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="input-block mb-3">
                                <label class="form-control-label">Password</label>
                                <div class="pass-group modal-password-field">
                                    <input type="password" class="form-control pass-input" placeholder="Password" value="12345"/>
                                    <span class="fas toggle-password fa-eye-slash"></span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="input-block mb-3">
                                <label class="form-control-label">Confirm Password</label>
                                <div class="pass-group modal-password-field">
                                    <input type="password" class="form-control pass-input-two" placeholder="Confirm Password" value="12345"/>
                                    <span class="fas toggle-password-two fa-eye-slash"></span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <div class="input-block mb-3">
                                <label class="form-label">Company Address </label> 
                                <textarea type="text" class="form-control" rows="3">22 Junior Avenue Duluth, GA 30097</textarea>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="input-block mb-3">
                                <label>Plan Name</label>
                                <select class="select">
                                    <option>All Plans</option>
                                    <option>Advanced</option>
                                    <option>Basic</option>
                                    <option>Enterprise</option>
                                    <option>Premium</option>
                                    <option>Free</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="input-block mb-3">
                                <label>Plan Type</label>
                                <select class="select">
                                    <option>Monthly</option>
                                    <option>Yearly</option>
                                    <option>Lifetime</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="input-block mb-3">
                                <label>Select Currency</label>
                                <select class="select">
                                    <option>United Stated Dollar (USD)</option>
                                    <option>$</option>
                                    <option>£</option>
                                    <option>€</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="input-block mb-3">
                                <label>Select Language</label>
                                <select class="select">
                                    <option>English</option>
                                    <option>French</option>
                                    <option>Spanish</option>
                                    <option>German</option>
                                </select>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <div class="d-flex align-items-center mb-3">
                                <h6 class="mb-0">Status</h6>
                                <div class="status-toggle">
                                    <input id="access-trail-2" class="check" type="checkbox" checked=""/>
                                    <label for="access-trail-2" class="checktoggle checkbox-bg">checkbox</label>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                </div>
                <div class="modal-footer">
                    <button type="button" data-bs-dismiss="modal" class="btn btn-back cancel-btn me-2">Cancel</button>
                    <button type="submit" data-bs-dismiss="modal" class="btn btn-primary paid-continue-btn">Save Changes</button>
                </div>
            </form>
        </div>
    </div>
</div>
  )
}

export default EditCompany