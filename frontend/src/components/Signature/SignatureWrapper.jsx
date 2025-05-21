import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import AddSignature from "./AddSignature";
import {
  useGetAllSignaturesQuery,
  useDeleteSignatureMutation,
} from "../../api/signatureApi";
import { toast } from "sonner";

const SignatureWrapper = ({ userId }) => {
  // Assume userId is passed from auth context
  const { data: signatures, error, isLoading } = useGetAllSignaturesQuery();
  const [deleteSignature, { isLoading: isDeleting }] =
    useDeleteSignatureMutation();
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Format signatures for tableData prop
  const formattedSignatures = (signatures || []).map((signature) => ({
    signatureId: signature.signatureId,
    signatureName: signature.signature_name || "N/A", // Match table headers
    userName: signature.User?.name || "N/A",
    userEmail: signature.User?.email || "N/A",
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

  const handleDelete = async (signatureId) => {
    if (window.confirm("Are you sure you want to delete this signature?")) {
      try {
        await deleteSignature(signatureId).unwrap();
        toast.success("Signature deleted successfully!", {
          position: "top-right",
          autoClose: 5000,
        });
      } catch (error) {
        toast.error(error?.data?.error || "Failed to delete signature.", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Signature"
          subtitle="List of your all Signatures."
          onAdd={handleAdd}
          tableData={formattedSignatures}
        />

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <h4 className="mb-0">Signature List</h4>
          </div>

          <div className="card-body p-0">
            {isLoading ? (
              <div className="text-center py-3">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <p className="text-center text-danger py-3">
                {error?.data?.error || "Error fetching signatures"}
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
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => handleEdit(signature)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() =>
                                handleDelete(signature.signatureId)
                              }
                              disabled={isDeleting}
                            >
                              {isDeleting ? "Deleting..." : "Delete"}
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
          userId={userId} // Pass userId to AddSignature
          signatureId={selectedSignature?.signatureId}
          existingSignature={selectedSignature}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SignatureWrapper;
