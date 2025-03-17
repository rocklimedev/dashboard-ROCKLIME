import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import Actions from "../Common/Actions";
import { useGetAllCompaniesQuery } from "../../api/companyApi";
import AddCompanyModal from "../Companies/AddCompanyModal";
const CmList = () => {
  const { data, error, isLoading } = useGetAllCompaniesQuery();
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const companies = Array.isArray(data?.companies) ? data.companies : [];

  const handleAddCompany = () => setShowCompanyModal(true);
  const handleCloseCompanyModal = () => setShowCompanyModal(false);

  const handlePdfDownload = () => alert("Downloading PDF...");
  const handleExcelDownload = () => alert("Downloading Excel...");
  const handleRefresh = () => alert("Refreshing...");
  const handleCollapse = () => alert("Collapsing...");

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading companies</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Companies"
          subtitle="Manage your companies"
          onAdd={handleAddCompany}
          actions={{
            pdf: handlePdfDownload,
            excel: handleExcelDownload,
            refresh: handleRefresh,
            collapse: handleCollapse,
          }}
        />

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set">
              <div className="search-input">
                <span className="btn-searchset">
                  <i className="ti ti-search fs-14 feather-search"></i>
                </span>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>Company Name</th>
                    <th>Address</th>
                    <th>Website</th>
                    <th>Slug</th>
                    <th>Created Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {companies?.map((company) => (
                    <tr key={company.id}>
                      <td>
                        <div className="d-flex align-items-center file-name-icon">
                          <div className="ms-2">
                            <h6 className="fw-medium">
                              <a href="#">{company.name}</a>
                            </h6>
                          </div>
                        </div>
                      </td>
                      <td>{company.address}</td>
                      <td>{company.website}</td>
                      <td>{company.slug}</td>
                      <td>{company.createdDate}</td>
                      <td>
                        <span
                          className={`badge ${
                            company.status === "Active"
                              ? "badge-success"
                              : "badge-danger"
                          } d-inline-flex align-items-center badge-xs`}
                        >
                          <i className="ti ti-point-filled me-1"></i>
                          {company.status}
                        </span>
                      </td>
                      <td>
                        <Actions />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {showCompanyModal && (
        <AddCompanyModal onClose={handleCloseCompanyModal} />
      )}
    </div>
  );
};

export default CmList;
