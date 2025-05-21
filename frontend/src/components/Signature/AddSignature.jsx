import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useCreateSignatureMutation,
  useUpdateSignatureMutation,
} from "../../api/signatureApi";
import { useGetProfileQuery } from "../../api/userApi";

const AddSignature = ({ signatureId, existingSignature, onClose }) => {
  const [signatureName, setSignatureName] = useState("");
  const [signatureImage, setSignatureImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [markAsDefault, setMarkAsDefault] = useState(false);

  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const [createSignature, { isLoading: isAdding }] =
    useCreateSignatureMutation();
  const [updateSignature, { isLoading: isUpdating }] =
    useUpdateSignatureMutation();

  useEffect(() => {
    if (signatureId && existingSignature) {
      setSignatureName(existingSignature.signature_name || "");
      setMarkAsDefault(existingSignature.mark_as_default || false);
      setImagePreview(existingSignature.signature_image || null);
    }
  }, [signatureId, existingSignature]);

  useEffect(() => {
    if (profileError) {
      toast.error(profileError?.data?.error || "Failed to load user profile.", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  }, [profileError]);

  const handleClose = () => {
    setSignatureName("");
    setSignatureImage(null);
    setImagePreview(null);
    setMarkAsDefault(false);
    onClose();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const userId = profile?.user?.userId; // Confirm nested structure
    if (!userId) {
      toast.error("User ID is required. Please log in again.", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    const formData = new FormData();
    formData.append("signature_name", signatureName);
    if (signatureImage) formData.append("file", signatureImage);
    formData.append("mark_as_default", markAsDefault.toString()); // Convert to string explicitly
    formData.append("userId", userId);

    try {
      if (signatureId) {
        await updateSignature({ id: signatureId, body: formData }).unwrap();
        toast.success("Signature updated successfully!", {
          position: "top-right",
          autoClose: 5000,
        });
      } else {
        await createSignature(formData).unwrap();
        toast.success("Signature added successfully!", {
          position: "top-right",
          autoClose: 5000,
        });
      }
      handleClose();
    } catch (error) {
      toast.error(error?.data?.error || "Failed to save signature.", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        toast.error("Only PNG or JPEG images are allowed.", {
          position: "top-right",
          autoClose: 5000,
        });
        return;
      }
      setSignatureImage(file);
      setImagePreview(URL.createObjectURL(file));
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
            ></button>
          </div>

          <form onSubmit={handleFormSubmit}>
            <div className="modal-body">
              {isProfileLoading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="form-label">
                      Signature Name
                      <span className="text-danger ms-1">*</span>
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
                      Signature Image
                      {!signatureId && (
                        <span className="text-danger ms-1">*</span>
                      )}
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleImageChange}
                      required={!signatureId && !imagePreview}
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Signature Preview"
                          style={{ maxWidth: "200px", maxHeight: "100px" }}
                        />
                      </div>
                    )}
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
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn me-2 btn-secondary"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  isProfileLoading || isAdding || isUpdating || profileError
                }
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
