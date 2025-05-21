import React, { useState, useEffect } from "react";
import {
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useGetAllBrandsQuery,
} from "../../api/brandsApi";
import { toast } from "sonner"; // Changed import

const AddBrand = ({ onClose, existingBrand }) => {
  const [formData, setFormData] = useState({
    id: null,
    brandName: "",
    brandSlug: "",
  });

  const { data: allBrands = [] } = useGetAllBrandsQuery();
  const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation();

  useEffect(() => {
    if (existingBrand) {
      setFormData({
        id: existingBrand.id || null,
        brandName: existingBrand.brandName || "",
        brandSlug: existingBrand.brandSlug || "",
      });
    } else {
      setFormData({ id: null, brandName: "", brandSlug: "" });
    }
  }, [existingBrand]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { brandName, brandSlug, id } = formData;

    if (!brandName || !brandSlug) {
      toast.error("Please fill in all fields."); // Sonner toast
      return;
    }

    // Check for duplicate brandSlug (excluding current brand if editing)
    const isDuplicate = allBrands.some(
      (brand) =>
        brand.brandSlug.toLowerCase() === brandSlug.toLowerCase() &&
        brand.id !== id
    );

    if (isDuplicate) {
      toast.error("This brand slug is already taken."); // Sonner toast
      return;
    }

    try {
      if (id) {
        await updateBrand(formData).unwrap();
        toast.success("Brand updated successfully!", { duration: 2000 }); // Sonner toast
      } else {
        await createBrand(formData).unwrap();
        toast.success("Brand added successfully!", { duration: 2000 }); // Sonner toast
      }

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to submit brand. Try again."); // Sonner toast
    }
  };

  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">
              {formData.id ? "Edit Brand" : "Add Brand"}
            </h4>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Brand Name<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="brandName"
                    className="form-control"
                    value={formData.brandName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Brand Slug<span className="text-danger ms-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="brandSlug"
                    className="form-control"
                    value={formData.brandSlug}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
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
                  ? "Update Brand"
                  : "Add Brand"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBrand;
