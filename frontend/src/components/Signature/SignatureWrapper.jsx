import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import AddSignature from "./AddSignature";
import { useGetAllSignaturesQuery } from "../../api/signatureApi";

const SignatureWrapper = () => {
  const { data: signatures, error, isLoading } = useGetAllSignaturesQuery();
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Format signatures for tableData prop
  const formattedSignatures = (signatures || []).map((signature) => ({
    signatureId: signature.signatureId,
    signature_name: signature.signature_name || "N/A",
    user_name: signature.User?.name || "N/A",
    user_email: signature.User?.email || "N/A",
    status: signature.mark_as_default ? "Default" : "Inactive",
    createdAt: new Date(signature.createdAt).toLocaleString(),
  }));

  const handleAdd = () => {
    setSelectedSignature(null);
    setModalOpen(true);
  };

  const handleEdit = (signature) => {
    setSelectedSignature(signature);
    setModalOpen(true);
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Signature"
          subtitle="List of your all Signatures."
          onAdd={handleAdd}
          tableData={formattedSignatures} // Pass formatted signatures for Excel/PDF
        />

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
                {signatures && signatures.length === 0 ? (
                  <p className="text-center py-3">No records found</p>
                ) : (
                  <table className="table datatable">
                    <thead className="thead-light">
                      <tr>
                        <th>Signature ID</th>
                        <th>Signature Name</th>
                        <th>User Name</th>
                        <th>User Email</th>
                        <th>Status</th>
                        <th>Date Created</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {signatures?.map((signature) => (
                        <tr key={signature.signatureId}>
                          <td>{signature.signatureId}</td>
                          <td>{signature.signature_name}</td>
                          <td>{signature.User?.name || "N/A"}</td>
                          <td>{signature.User?.email || "N/A"}</td>
                          <td>
                            <span
                              className={`badge ${
                                signature.mark_as_default
                                  ? "bg-success"
                                  : "bg-secondary"
                              }`}
                            >
                              {signature.mark_as_default
                                ? "Default"
                                : "Inactive"}
                            </span>
                          </td>
                          <td>
                            {new Date(signature.createdAt).toLocaleString()}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleEdit(signature)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <AddSignature
          signatureId={selectedSignature?.signatureId}
          existingSignature={selectedSignature}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SignatureWrapper;
