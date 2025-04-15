import React from "react";
import { useGetCompanyByIdQuery } from "../../api/companyApi";
const ViewCompanies = ({ companyId }) => {
  const { data, isLoading, error } = useGetCompanyByIdQuery(companyId);

  if (isLoading) return <div>Loading company details...</div>;
  if (error) return <div>Error loading company details</div>;

  const company = data?.company || data; // adjust if your API returns it as { company: { ... } }

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content">
          <div className="modal-header border-0">
            <div className="form-header modal-header-title text-start mb-0">
              <h4 className="mb-0">Company Details</h4>
            </div>
            <div className="d-flex details-edit-link">
              <a
                href="#"
                className="modal-edit-link d-flex align-items-center"
                data-bs-toggle="modal"
                data-bs-target="#edit_companies"
              >
                <i className="fe fe-edit me-2"></i>Edit Company
              </a>
              <button
                type="button"
                className="btn-close ms-2"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
          </div>
          <div className="modal-body pb-0">
            <div className="row">
              <div className="col-md-12">
                <div className="form-field-item">
                  <div className="profile-picture company-detail-head">
                    <div className="upload-profile">
                      <div className="profile-img company-profile-img">
                        <img
                          id="view-company-img"
                          className="img-fluid me-0"
                          src="assets/img/companies/company-01.svg"
                          alt="profile-img"
                        />
                      </div>
                      <div className="add-profile">
                        <h5>{company.name}</h5>
                        <span>{company.slug}</span>
                      </div>
                    </div>
                    <span className="badge bg-success-light d-inline-flex align-items-center">
                      <i className="fe fe-check me-1"></i>Active
                    </span>
                  </div>
                </div>
              </div>

              <div className="col-md-12">
                <div className="plane-basic-info">
                  <h5>Basic Info</h5>
                  <div className="row">
                    <div className="col-md-4 col-sm-6">
                      <div className="basic-info-detail">
                        <h6>Account URL</h6>
                        <p>{company.slug}.example.com</p>
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-6">
                      <div className="basic-info-detail">
                        <h6>Website</h6>
                        <p>{company.website || "N/A"}</p>
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-6">
                      <div className="basic-info-detail">
                        <h6>Company Address</h6>
                        <p>{company.address}</p>
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-6">
                      <div className="basic-info-detail">
                        <h6>Created At</h6>
                        <p>{new Date(company.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="col-md-4 col-sm-6">
                      <div className="basic-info-detail">
                        <h6>Updated At</h6>
                        <p>{new Date(company.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {company.parentCompanyId && (
                      <div className="col-md-4 col-sm-6">
                        <div className="basic-info-detail">
                          <h6>Parent Company ID</h6>
                          <p>{company.parentCompanyId}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Add more fields as needed */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCompanies;
