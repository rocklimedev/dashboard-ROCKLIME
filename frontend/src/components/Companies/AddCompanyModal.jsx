import React, { useState, useEffect } from "react";
import {
  useCreateVendorMutation,
  useUpdateVendorMutation,
} from "../../api/vendorApi.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useGetAllBrandsQuery } from "../../api/brandsApi.js";

const AddCompanyModal = ({ show, onClose, existingVendor }) => {
  const [formData, setFormData] = useState({
    id: null,
    vendorId: "",
    vendorName: "",
    brandSlug: "",
    brandId: null,
  });

  const [addVendor, { isLoading: isCreating }] = useCreateVendorMutation();
  const [updateVendor, { isLoading: isUpdating }] = useUpdateVendorMutation();
  const { data: brands = [], isLoading: loadingBrands } =
    useGetAllBrandsQuery();

  useEffect(() => {
    if (existingVendor) {
      setFormData({
        id: existingVendor.id || null,
        vendorId: existingVendor.vendorId || "",
        vendorName: existingVendor.vendorName || "",
        brandSlug: existingVendor.brandSlug || "",
        brandId: existingVendor.brandId || null,
      });
    } else {
      setFormData({
        id: null,
        vendorId: "",
        vendorName: "",
        brandSlug: "",
        brandId: null,
      });
    }
  }, [existingVendor, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "brandSlug") {
      const selectedBrand = brands.find((brand) => brand.brandSlug === value);
      setFormData((prev) => ({
        ...prev,
        brandSlug: value,
        brandId: selectedBrand ? selectedBrand.brandId : null,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.vendorId.trim() || !formData.vendorName.trim()) {
      toast.error("Vendor ID and Vendor Name are required.");
      return;
    }

    try {
      if (formData.id) {
        // Payload for update
        const updatePayload = {
          id: formData.id,
          vendorId: formData.vendorId,
          vendorName: formData.vendorName,
          brandSlug: formData.brandSlug || null,
          brandId: formData.brandId || null,
        };

        await updateVendor(updatePayload).unwrap();
        toast.success("Vendor updated successfully!");
      } else {
        // Payload for create
        const createPayload = {
          vendorId: formData.vendorId,
          vendorName: formData.vendorName,
          brandSlug: formData.brandSlug || null,
          brandId: formData.brandId || null,
        };

        await addVendor(createPayload).unwrap();
        toast.success("Vendor added successfully!");
      }
      closeModal();
    } catch (error) {
      console.error("Error submitting vendor:", error);
      const errorMessage =
        error.data?.message ||
        error.data?.error ||
        "Failed to submit vendor. Please try again.";
      toast.error(errorMessage);
    }
  };

  const closeModal = () => {
    setFormData({
      id: null,
      vendorId: "",
      vendorName: "",
      brandSlug: "",
      brandId: null,
    });
    onClose();
  };

  return (
    show && (
      <>
        <div className="modal fade show" style={{ display: "block" }}>
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h4 className="mb-0">
                  {formData.id ? "Edit Company" : "Add New Company"}
                </h4>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  disabled={isCreating || isUpdating}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="input-block mb-3">
                    <label className="form-label">Vendor ID</label>
                    <input
                      type="text"
                      name="vendorId"
                      className="form-control"
                      placeholder="Vendor ID"
                      value={formData.vendorId}
                      onChange={handleChange}
                      disabled={isCreating || isUpdating}
                      required
                    />
                  </div>
                  <div className="input-block mb-3">
                    <label className="form-label">Vendor Name</label>
                    <input
                      type="text"
                      name="vendorName"
                      className="form-control"
                      placeholder="Vendor Name"
                      value={formData.vendorName}
                      onChange={handleChange}
                      disabled={isCreating || isUpdating}
                      required
                    />
                  </div>
                  <div className="input-block mb-3">
                    <label className="form-label">Brand</label>
                    <select
                      name="brandSlug"
                      className="form-control"
                      value={formData.brandSlug}
                      onChange={handleChange}
                      disabled={loadingBrands || isCreating || isUpdating}
                    >
                      <option value="">Select a brand</option>
                      {brands.map((brand) => (
                        <option key={brand.brandId} value={brand.brandSlug}>
                          {brand.brandName} ({brand.brandSlug})
                        </option>
                      ))}
                    </select>
                    {loadingBrands && <small>Loading brands...</small>}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                    disabled={isCreating || isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isCreating || isUpdating}
                  >
                    {isCreating || isUpdating
                      ? "Saving..."
                      : formData.id
                      ? "Update"
                      : "Add New"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show" onClick={closeModal}></div>
        <ToastContainer />
      </>
    )
  );
};

export default AddCompanyModal;
