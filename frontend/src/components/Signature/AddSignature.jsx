import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  useCreateSignatureMutation,
  useUpdateSignatureMutation,
} from "../../api/signatureApi";
import { useGetProfileQuery } from "../../api/userApi";

const AddSignature = ({
  signatureId,
  existingSignature,
  entityType = "user", // "user" | "customer" | "vendor"
  entityId = null,
  onClose,
  onSuccess, // callback to refresh parent list
}) => {
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
      toast.error(profileError?.data?.error || "Failed to load profile.");
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

    const userId = profile?.user?.userId;

    if (!userId && entityType === "user") {
      toast.error("User ID is required. Please log in again.");
      return;
    }

    const formData = new FormData();
    formData.append("signature_name", signatureName);
    if (signatureImage) formData.append("file", signatureImage);
    formData.append("mark_as_default", markAsDefault.toString());

    // Attach entity based on type
    if (entityType === "user") formData.append("userId", userId);
    if (entityType === "customer") formData.append("customerId", entityId);
    if (entityType === "vendor") formData.append("vendorId", entityId);

    try {
      if (signatureId) {
        await updateSignature({ id: signatureId, body: formData }).unwrap();
        toast.success("Signature updated successfully.");
      } else {
        await createSignature(formData).unwrap();
        toast.success("Signature created successfully.");
      }
      handleClose();
      if (onSuccess) onSuccess(); // refresh parent list
    } catch (error) {
      toast.error(error?.data?.error || "Failed to save signature.");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        toast.error("Only PNG or JPEG images are allowed.");
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
            <h4>{signatureId ? "Edit Signature" : "Add Signature"}</h4>
            <button type="button" className="btn-close" onClick={handleClose} />
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
                      Signature Name <span className="text-danger ms-1">*</span>
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
                      Signature Image{" "}
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
                className="btn btn-secondary me-2"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isProfileLoading || isAdding || isUpdating}
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
