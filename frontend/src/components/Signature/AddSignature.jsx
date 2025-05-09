import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  useCreateSignatureMutation,
  useUpdateSignatureMutation,
} from "../../api/signatureApi";

const AddSignature = ({ signatureId, existingSignature, onclose }) => {
  const [signatureName, setSignatureName] = useState("");
  const [signatureImage, setSignatureImage] = useState(null);
  const [markAsDefault, setMarkAsDefault] = useState(false);
  const [userId, setUserId] = useState(""); // Get this from context or props ideally

  const [createSignature, { isLoading: isAdding }] =
    useCreateSignatureMutation();
  const [updateSignature, { isLoading: isUpdating }] =
    useUpdateSignatureMutation();

  useEffect(() => {
    if (signatureId && existingSignature) {
      setSignatureName(existingSignature.signatureName);
      setSignatureImage(null);
      setMarkAsDefault(existingSignature.markAsDefault);
      setUserId(existingSignature.userId);
    }
  }, [signatureId, existingSignature]);

  const handleClose = () => {
    setSignatureImage(null);
    setSignatureName("");
    setMarkAsDefault(false);
    setUserId("");
    onclose();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("signatureName", signatureName);
    if (signatureImage) formData.append("signatureImage", signatureImage);
    formData.append("markAsDefault", markAsDefault);
    formData.append("userId", userId);

    try {
      if (signatureId) {
        await updateSignature({ signatureId, body: formData }).unwrap();
        toast.success("Signature updated successfully!", {
          position: "top-right", // Hardcoded to avoid POSITION issue
          autoClose: 5000,
        });
      } else {
        await createSignature(formData).unwrap();
        toast.success("Signature added successfully!", {
          position: "top-right", // Hardcoded to avoid POSITION issue
          autoClose: 5000,
        });
      }

      // Reset form state
      setSignatureName("");
      setSignatureImage(null);
      setMarkAsDefault(false);
    } catch (error) {
      toast.error("Failed to save signature.", {
        position: "top-right", // Hardcoded to avoid POSITION issue
        autoClose: 5000,
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSignatureImage(file);
    }
  };

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <div className="page-title">
              <h4>{signatureId ? "Edit Signature" : "Add Signature"}</h4>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
              data-bs-dismiss="modal"
            ></button>
          </div>

          <form onSubmit={handleFormSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">
                  Signature Name<span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Signature Image<span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleImageChange}
                  required={!signatureId}
                />
              </div>

              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="defaultCheck"
                  checked={markAsDefault}
                  onChange={() => setMarkAsDefault(!markAsDefault)}
                />
                <label className="form-check-label" htmlFor="defaultCheck">
                  Mark as Default
                </label>
              </div>

              <div className="mb-0">
                <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                  <span className="status-label">
                    Status<span className="text-danger ms-1">*</span>
                  </span>
                  <input
                    type="checkbox"
                    id="user2"
                    className="check"
                    checked={markAsDefault}
                    onChange={() => setMarkAsDefault(!markAsDefault)}
                  />
                  <label htmlFor="user2" className="checktoggle"></label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn me-2 btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isAdding || isUpdating}
              >
                {isAdding || isUpdating
                  ? "Saving..."
                  : signatureId
                  ? "Update Signature"
                  : "Add Signature"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSignature;
