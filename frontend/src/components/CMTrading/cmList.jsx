import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import Actions from "../Common/Actions";
import { useGetAllCompaniesQuery } from "../../api/companyApi";
import AddCompanyModal from "../Companies/AddCompanyModal";

const CmList = () => {
  const { data, error, isLoading, refetch } = useGetAllCompaniesQuery();
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  const companies = Array.isArray(data?.companies) ? data.companies : [];

  const handleAddCompany = () => setShowCompanyModal(true);
  const handleCloseCompanyModal = () => setShowCompanyModal(false);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading companies</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Companies"
          subtitle="Manage your companies"
          onAdd={handleAddCompany}
        />

        <div className="card">
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
                  {companies.map((company) => (
                    <tr key={company.id}>
                      <td>{company.name}</td>
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
                          }`}
                        >
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

      {/* Ensure Modal is rendered properly with onCompanyAdded */}
      {showCompanyModal && (
        <AddCompanyModal onClose={handleCloseCompanyModal} />
      )}
    </div>
  );
};

export default CmList;
