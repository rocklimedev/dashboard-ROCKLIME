import React, { useState } from "react";
import PageHeader from "../Common/PageHeader";
import AddSignature from "./AddSignature";
import {
  useGetAllSignaturesQuery,
  useDeleteSignatureMutation,
} from "../../api/signatureApi";
import { toast } from "sonner";
import { AiOutlineEdit } from "react-icons/ai";
import { FcEmptyTrash } from "react-icons/fc";
const SignatureNew = () => {
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
          <div className="card-body-2 p-0">
            {signatures?.map((signature) => (
              <div className="signature" key={signature.signatureId}>
                <div className="signature-content">
                  {signature.signature_name} of {signature.User?.name || "N/A"}{" "}
                  <span
                    className={`badge ${
                      signature.mark_as_default ? "bg-success" : "bg-secondary"
                    }`}
                  >
                    {signature.mark_as_default ? "Default" : "Inactive"}
                  </span>
                </div>

                <div className="actions">
                  <AiOutlineEdit onClick={() => handleEdit(signature)} />

                  <FcEmptyTrash
                    onClick={() => handleDelete(signature.signatureId)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureNew;
