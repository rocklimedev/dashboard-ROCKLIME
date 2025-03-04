import React from "react";

const GeneralSettings = () => {
  return (
    <div class="page-wrapper">
      <div class="content settings-content">
        <div class="page-header">
          <div class="add-item d-flex">
            <div class="page-title">
              <h4 class="fw-bold">Settings</h4>
              <h6>Manage your settings on portal</h6>
            </div>
          </div>
          <ul class="table-top-head">
            <li>
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Refresh"
              >
                <i class="ti ti-refresh"></i>
              </a>
            </li>
            <li>
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Collapse"
                id="collapse-header"
              >
                <i class="ti ti-chevron-up"></i>
              </a>
            </li>
          </ul>
        </div>
        <div class="row">
          <div class="col-xl-12">
            <div class="settings-wrapper d-flex">
              <div class="settings-sidebar" id="sidebar2">
                <div class="sidebar-inner slimscroll">
                  <div id="sidebar-menu5" class="sidebar-menu">
                    <h4 class="fw-bold fs-18 mb-2 pb-2">Settings</h4>
                    <ul>
                      <li class="submenu-open">
                        <ul>
                          <li class="submenu">
                            <a
                              href="javascript:void(0);"
                              class="active subdrop"
                            >
                              <i class="ti ti-settings fs-18"></i>
                              <span class="fs-14 fw-medium ms-2">
                                General Settings
                              </span>
                              <span class="menu-arrow"></span>
                            </a>
                            <ul>
                              <li>
                                <a href="general-settings.html" class="active">
                                  Profile
                                </a>
                              </li>
                              <li>
                                <a href="security-settings.html">Security</a>
                              </li>
                              <li>
                                <a href="notification.html">Notifications</a>
                              </li>
                              <li>
                                <a href="connected-apps.html">Connected Apps</a>
                              </li>
                            </ul>
                          </li>
                          <li class="submenu">
                            <a href="javascript:void(0);">
                              <i class="ti ti-world fs-18"></i>
                              <span class="fs-14 fw-medium ms-2">
                                Website Settings
                              </span>
                              <span class="menu-arrow"></span>
                            </a>
                            <ul>
                              <li>
                                <a href="system-settings.html">
                                  System Settings
                                </a>
                              </li>
                              <li>
                                <a href="company-settings.html">
                                  Company Settings{" "}
                                </a>
                              </li>
                              <li>
                                <a href="localization-settings.html">
                                  Localization
                                </a>
                              </li>
                              <li>
                                <a href="prefixes.html">Prefixes</a>
                              </li>
                              <li>
                                <a href="preference.html">Preference</a>
                              </li>
                              <li>
                                <a href="appearance.html">Appearance</a>
                              </li>
                              <li>
                                <a href="social-authentication.html">
                                  Social Authentication
                                </a>
                              </li>
                              <li>
                                <a href="language-settings.html">Language</a>
                              </li>
                            </ul>
                          </li>
                          <li class="submenu">
                            <a href="javascript:void(0);">
                              <i class="ti ti-device-mobile fs-18"></i>
                              <span class="fs-14 fw-medium ms-2">
                                App Settings
                              </span>
                              <span class="menu-arrow"></span>
                            </a>
                            <ul>
                              <li>
                                <a href="invoice-settings.html">
                                  Invoice Settings
                                </a>
                              </li>
                              <li>
                                <a href="invoice-templates.html">
                                  Invoice Templates
                                </a>
                              </li>
                              <li>
                                <a href="printer-settings.html">Printer </a>
                              </li>
                              <li>
                                <a href="pos-settings.html">POS</a>
                              </li>
                              <li>
                                <a href="signatures.html">Signatures</a>
                              </li>
                              <li>
                                <a href="custom-fields.html">Custom Fields</a>
                              </li>
                            </ul>
                          </li>
                          <li class="submenu">
                            <a href="javascript:void(0);">
                              <i class="ti ti-device-desktop fs-18"></i>
                              <span class="fs-14 fw-medium ms-2">
                                System Settings
                              </span>
                              <span class="menu-arrow"></span>
                            </a>
                            <ul>
                              <li class="submenu submenu-two">
                                <a href="javascript:void(0);">
                                  Email
                                  <span class="menu-arrow inside-submenu"></span>
                                </a>
                                <ul>
                                  <li>
                                    <a href="email-settings.html">
                                      Email Settings
                                    </a>
                                  </li>
                                  <li>
                                    <a href="email-templates.html">
                                      Email Templates
                                    </a>
                                  </li>
                                </ul>
                              </li>
                              <li class="submenu submenu-two">
                                <a href="javascript:void(0);">
                                  SMS
                                  <span class="menu-arrow inside-submenu"></span>
                                </a>
                                <ul>
                                  <li>
                                    <a href="sms-settings.html">SMS Settings</a>
                                  </li>
                                  <li>
                                    <a href="sms-templates.html">
                                      SMS Templates
                                    </a>
                                  </li>
                                </ul>
                              </li>
                              <li>
                                <a href="otp-settings.html">OTP</a>
                              </li>
                              <li>
                                <a href="gdpr-settings.html">GDPR Cookies</a>
                              </li>
                            </ul>
                          </li>
                          <li class="submenu">
                            <a href="javascript:void(0);">
                              <i class="ti ti-settings-dollar fs-18"></i>
                              <span class="fs-14 fw-medium ms-2">
                                Financial Settings
                              </span>
                              <span class="menu-arrow"></span>
                            </a>
                            <ul>
                              <li>
                                <a href="payment-gateway-settings.html">
                                  Payment Gateway
                                </a>
                              </li>
                              <li>
                                <a href="bank-settings-grid.html">
                                  Bank Accounts{" "}
                                </a>
                              </li>
                              <li>
                                <a href="tax-rates.html">Tax Rates</a>
                              </li>
                              <li>
                                <a href="currency-settings.html">Currencies</a>
                              </li>
                            </ul>
                          </li>
                          <li class="submenu">
                            <a href="javascript:void(0);">
                              <i class="ti ti-settings-2 fs-18"></i>
                              <span class="fs-14 fw-medium ms-2">
                                Other Settings
                              </span>
                              <span class="menu-arrow"></span>
                            </a>
                            <ul>
                              <li>
                                <a href="storage-settings.html">Storage</a>
                              </li>
                              <li>
                                <a href="ban-ip-address.html">
                                  Ban IP Address{" "}
                                </a>
                              </li>
                            </ul>
                          </li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div class="card flex-fill mb-0">
                <div class="card-header">
                  <h4 class="fs-18 fw-bold">Profile</h4>
                </div>
                <div class="card-body">
                  <form action="https://dreamspos.dreamstechnologies.com/html/template/general-settings.html">
                    <div class="card-title-head">
                      <h6 class="fs-16 fw-bold mb-3">
                        <span class="fs-16 me-2">
                          <i class="ti ti-user"></i>
                        </span>
                        Basic Information
                      </h6>
                    </div>
                    <div class="profile-pic-upload">
                      <div class="profile-pic">
                        <span>
                          <i class="ti ti-circle-plus mb-1 fs-16"></i> Add Image
                        </span>
                      </div>
                      <div class="new-employee-field">
                        <div class="mb-0">
                          <div class="image-upload mb-0">
                            <input type="file" />
                            <div class="image-uploads">
                              <h4>Upload Image</h4>
                            </div>
                          </div>
                          <span class="fs-13 fw-medium mt-2">
                            Upload an image below 2 MB, Accepted File format
                            JPG, PNG
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="row mb-3">
                      <div class="col-md-4">
                        <div class="mb-3">
                          <label class="form-label">
                            First Name <span class="text-danger">*</span>
                          </label>
                          <input type="text" class="form-control" />
                        </div>
                      </div>
                      <div class="col-md-4">
                        <div class="mb-3">
                          <label class="form-label">
                            Last Name <span class="text-danger">*</span>
                          </label>
                          <input type="text" class="form-control" />
                        </div>
                      </div>
                      <div class="col-md-4">
                        <div class="mb-3">
                          <label class="form-label">
                            User Name <span class="text-danger">*</span>
                          </label>
                          <input type="text" class="form-control" />
                        </div>
                      </div>
                      <div class="col-md-4">
                        <div class="mb-3">
                          <label class="form-label">
                            Phone Number <span class="text-danger">*</span>
                          </label>
                          <input type="text" class="form-control" />
                        </div>
                      </div>
                      <div class="col-md-4">
                        <div class="mb-3">
                          <label class="form-label">
                            Email <span class="text-danger">*</span>
                          </label>
                          <input type="email" class="form-control" />
                        </div>
                      </div>
                    </div>
                    <div class="card-title-head">
                      <h6 class="fs-16 fw-bold mb-3">
                        <span class="fs-16 me-2">
                          <i class="ti ti-map-pin"></i>
                        </span>
                        Address Information
                      </h6>
                    </div>
                    <div class="row">
                      <div class="col-md-12">
                        <div class="mb-3">
                          <label class="form-label">
                            Address <span class="text-danger">*</span>
                          </label>
                          <input type="email" class="form-control" />
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label class="form-label">
                            Country <span class="text-danger">*</span>
                          </label>
                          <select class="select">
                            <option>Select</option>
                            <option>USA</option>
                            <option>India</option>
                            <option>French</option>
                            <option>Australia</option>
                          </select>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label class="form-label">
                            State <span class="text-danger">*</span>
                          </label>
                          <select class="select">
                            <option>Select</option>
                            <option>Alaska</option>
                            <option>Mexico</option>
                            <option>Tasmania</option>
                          </select>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label class="form-label">
                            City <span class="text-danger">*</span>
                          </label>
                          <select class="select">
                            <option>Select</option>
                            <option>Anchorage</option>
                            <option>Tijuana</option>
                            <option>Hobart</option>
                          </select>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="mb-3">
                          <label class="form-label">
                            Postal Code <span class="text-danger">*</span>
                          </label>
                          <input type="text" class="form-control" />
                        </div>
                      </div>
                    </div>
                    <div class="text-end settings-bottom-btn mt-0">
                      <button type="button" class="btn btn-secondary me-2">
                        Cancel
                      </button>
                      <button type="submit" class="btn btn-primary">
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
