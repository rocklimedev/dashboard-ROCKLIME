import React from "react";
import PageHeader from "../Common/PageHeader";
import { useGetAllSignaturesQuery } from "../../api/signatureApi";
const SignatureWrapper = () => {
  const { data: signatures, error, isLoading } = useGetAllSignaturesQuery();

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader />

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <h4 className="mb-0">Signature List</h4>
          </div>

          <div className="card-body p-0">
            {isLoading ? (
              <p className="text-center py-3">Loading...</p>
            ) : error ? (
              <p className="text-center text-danger py-3">
                Error fetching data
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table datatable">
                  <thead className="thead-light">
                    <tr>
                      <th>ID</th>
                      <th>Signer Name</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signatures?.map((signature) => (
                      <tr key={signature.id}>
                        <td>{signature.id}</td>
                        <td>{signature.signerName}</td>
                        <td>
                          <span
                            className={`badge ${
                              signature.status === "Approved"
                                ? "badge-success"
                                : "badge-warning"
                            }`}
                          >
                            {signature.status}
                          </span>
                        </td>
                        <td>{new Date(signature.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureWrapper;
