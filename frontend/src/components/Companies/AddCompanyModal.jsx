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
    id: null, // this helps differentiate edit vs new
    vendorId: "",
    vendorName: "",
    brandSlug: "",
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
      });
    } else {
      setFormData({
        id: null,
        vendorId: "",
        vendorName: "",
        brandSlug: "",
      });
    }
  }, [existingVendor, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await updateVendor(formData).unwrap();
        toast.success("Vendor updated successfully!");
      } else {
        await addVendor(formData).unwrap();
        toast.success("Vendor added successfully!");
      }
      closeModal(); // Close the modal after successful submission
    } catch (error) {
      toast.error("Failed to submit vendor. Please try again.");
    }
  };

  // Helper function to close modal
  const closeModal = () => {
    onClose(); // Trigger the onClose prop passed to the modal
  };

  return (
    // Add a condition to show or hide the modal based on the `show` prop
    show && (
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
                onClick={closeModal} // Call closeModal to close the modal
              ></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="input-block mb-3">
                  <label className="form-label">Vendor Id</label>
                  <input
                    type="text"
                    name="vendorId"
                    className="form-control"
                    placeholder="Vendor Id"
                    value={formData.vendorId}
                    onChange={handleChange}
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
                  />
                </div>
                <div className="input-block mb-3">
                  <label className="form-label">Brand Slug</label>
                  <select
                    name="brandSlug"
                    className="form-control"
                    value={formData.brandSlug}
                    onChange={handleChange}
                    disabled={loadingBrands}
                  >
                    <option value="">Select a brand</option>
                    {brands.map((brand) => (
                      <option key={brand.brandId} value={brand.brandSlug}>
                        {brand.brandName} ({brand.brandSlug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal} // Call closeModal to close the modal
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
    )
  );
};

export default AddCompanyModal;
