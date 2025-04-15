import React, { useEffect, useState } from "react";
import {
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useGetAllCompaniesQuery,
} from "../../api/companyApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddCompany = ({ onClose, companyToEdit = null }) => {
  const isEditMode = !!companyToEdit;

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    slug: "",
    website: "",
    parentCompanyId: "",
    createdDate: "",
  });

  const { data, isLoading: companiesLoading } = useGetAllCompaniesQuery();
  const companies = Array.isArray(data?.companies) ? data.companies : [];

  const [addCompany, { isLoading: isCreating }] = useCreateCompanyMutation();
  const [updateCompany, { isLoading: isUpdating }] = useUpdateCompanyMutation();

  // Fill form with existing data if editing
  useEffect(() => {
    if (isEditMode && companyToEdit) {
      setFormData({
        name: companyToEdit.name || "",
        address: companyToEdit.address || "",
        slug: companyToEdit.slug || "",
        website: companyToEdit.website || "",
        parentCompanyId: companyToEdit.parentCompanyId || "",
        createdDate: companyToEdit.createdDate?.slice(0, 10) || "", // for <input type="date">
      });
    }
  }, [companyToEdit, isEditMode]);

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
      if (isEditMode) {
        await updateCompany({
          id: companyToEdit.companyId,
          updatedData: formData,
        }).unwrap();
        toast.success("Company updated successfully!");
      } else {
        await addCompany(formData).unwrap();
        toast.success("Company created successfully!");
      }

      setFormData({
        name: "",
        address: "",
        slug: "",
        website: "",
        parentCompanyId: "",
        createdDate: "",
      });

      onClose();
    } catch (error) {
      console.error("Failed to submit company:", error);
      toast.error("Failed to save company. Please try again.");
    }
  };
  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">
              {isEditMode ? "Edit Company" : "Add New Company"}
            </h4>
            <button
              type="button"
              className="btn-close custom-btn-close p-0"
              data-bs-dismiss="modal"
              aria-label="Close"
              onClick={onClose}
            >
              <i className="ti ti-x"></i>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">Address</label>
                  <input
                    type="text"
                    className="form-control"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">Slug</label>
                  <input
                    type="text"
                    className="form-control"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">
                    Created Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    name="createdDate"
                    value={formData.createdDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">Parent Company</label>
                  <select
                    className="form-select"
                    name="parentCompanyId"
                    value={formData.parentCompanyId}
                    onChange={handleChange}
                    disabled={companiesLoading}
                  >
                    <option value="">
                      -- Select Parent Company (Optional) --
                    </option>
                    {companies.map((company) => (
                      <option key={company.companyId} value={company.companyId}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-lg-6 mb-3">
                  <label className="form-label">Website</label>
                  <input
                    type="text"
                    className="form-control"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary me-2"
                data-bs-dismiss="modal"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isCreating || isUpdating}
              >
                {isEditMode
                  ? isUpdating
                    ? "Updating..."
                    : "Update Company"
                  : isCreating
                  ? "Adding..."
                  : "Add Company"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCompany;
