import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import AddSignature from "./AddSignature";
import {
  useGetAllSignaturesQuery,
  useDeleteSignatureMutation,
  useSetDefaultSignatureMutation,
  useGetDefaultSignatureQuery,
  useGetSignaturesByUserQuery,
} from "../../api/signatureApi";
import { toast } from "sonner";
import { AiOutlineEdit } from "react-icons/ai";
import { FcEmptyTrash } from "react-icons/fc";
import { BsCheckCircle } from "react-icons/bs";

const SignatureWrapper = ({ userId }) => {
  // Fetch all signatures for current user by default
  const {
    data: signatures,
    error,
    isLoading,
    refetch,
  } = useGetSignaturesByUserQuery(userId);

  const [deleteSignature, { isLoading: isDeleting }] =
    useDeleteSignatureMutation();
  const [setDefaultSignature, { isLoading: isSettingDefault }] =
    useSetDefaultSignatureMutation();

  const [selectedSignature, setSelectedSignature] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // -------------------------------
  // Format signatures for table/grid
  // -------------------------------
  const formattedSignatures = (signatures || []).map((signature) => ({
    signatureId: signature.signatureId,
    signatureName: signature.signature_name || "N/A",
    userName: signature.User?.name || "N/A",
    userEmail: signature.User?.email || "N/A",
    status: signature.mark_as_default ? "Default" : "Inactive",
    createdAt: new Date(signature.createdAt).toLocaleString(),
  }));

  // -------------------------------
  // Handlers
  // -------------------------------
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
        refetch();
      } catch (error) {
        toast.error(error?.data?.error || "Failed to delete signature.");
      }
    }
  };

  const handleSetDefault = async (signatureId) => {
    try {
      await setDefaultSignature(signatureId).unwrap();
      refetch();
    } catch (error) {
      toast.error(error?.data?.error || "Failed to set default signature.");
    }
  };

  // -------------------------------
  // Render
  // -------------------------------
  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Signatures"
          subtitle="Manage your signatures"
          onAdd={handleAdd}
          tableData={formattedSignatures}
        />
        <div className="card">
          <div className="card-body-2 p-0">
            {isLoading && <p className="loading-text">Loading signatures...</p>}
            {error && (
              <p className="error-text">
                Failed to load signatures:{" "}
                {error?.data?.error || "Unknown error"}
              </p>
            )}
            {!isLoading && !error && signatures?.length === 0 && (
              <p className="no-data">No signatures found.</p>
            )}
            <div className="signatures-grid">
              {signatures?.map((signature) => (
                <div className="signature" key={signature.signatureId}>
                  <div className="signature-content">
                    <img
                      src={signature.signature_image}
                      alt={`Signature of ${signature.signature_name}`}
                      className="signature-image"
                    />
                    <div className="signature-details">
                      <h4>{signature.signature_name || "N/A"}</h4>
                      <p>By: {signature.User?.name || "N/A"}</p>
                      <span
                        className={`badge ${
                          signature.mark_as_default
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                      >
                        {signature.mark_as_default ? (
                          <>
                            <BsCheckCircle /> Default
                          </>
                        ) : (
                          "Inactive"
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      className="action-button"
                      onClick={() => handleEdit(signature)}
                      aria-label={`Edit signature ${signature.signature_name}`}
                      disabled={isDeleting || isSettingDefault}
                    >
                      <AiOutlineEdit />
                    </button>
                    <button
                      className="action-button"
                      onClick={() => handleDelete(signature.signatureId)}
                      aria-label={`Delete signature ${signature.signature_name}`}
                      disabled={isDeleting || isSettingDefault}
                    >
                      <FcEmptyTrash />
                    </button>
                    {!signature.mark_as_default && (
                      <button
                        className="action-button bg-info text-white"
                        onClick={() => handleSetDefault(signature.signatureId)}
                        aria-label={`Set signature ${signature.signature_name} as default`}
                        disabled={isDeleting || isSettingDefault}
                      >
                        Set Default
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {modalOpen && (
        <AddSignature
          signature={selectedSignature}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SignatureWrapper;
