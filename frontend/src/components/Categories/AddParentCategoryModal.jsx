import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "sonner";
import {
  useCreateParentCategoryMutation,
  useUpdateParentCategoryMutation,
} from "../../api/parentCategoryApi";
import { useGetAllBrandsQuery } from "../../api/brandsApi";

const AddParentCategoryModal = ({ editMode, parentCategoryData, onClose }) => {
  const [name, setName] = useState(
    parentCategoryData ? parentCategoryData.name : ""
  );
  const [slug, setSlug] = useState(
    parentCategoryData ? parentCategoryData.slug : ""
  );
  const [brandId, setBrandId] = useState(
    parentCategoryData ? parentCategoryData.brandId : ""
  );
  const [addParentCategory] = useCreateParentCategoryMutation();
  const [updateParentCategory] = useUpdateParentCategoryMutation();
  const {
    data: brands,
    isLoading: isBrandsLoading,
    error: brandsError,
  } = useGetAllBrandsQuery();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate brandId
    if (!brandId) {
      toast.error("Please select a brand.");
      return;
    }
    try {
      if (editMode) {
        await updateParentCategory({
          id: parentCategoryData.id,
          name,
          slug,
          brandId,
        }).unwrap();
        toast.success("Parent category updated successfully!");
      } else {
        await addParentCategory({ name, slug, brandId }).unwrap();
        toast.success("Parent category added successfully!");
      }
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || "Operation failed");
    }
  };

  return (
    <Modal show={true} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          {editMode ? "Edit Parent Category" : "Add Parent Category"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter parent category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Slug</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter slug (e.g., category-name)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Brand</Form.Label>
            <Form.Select
              value={brandId || ""} // Ensure value is controlled
              onChange={(e) => setBrandId(e.target.value)}
              required
              disabled={isBrandsLoading}
            >
              <option value="">Select a brand</option>
              {brands?.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.brandName}
                </option>
              ))}
            </Form.Select>
            {brandsError && (
              <p className="text-danger">Failed to load brands</p>
            )}
          </Form.Group>
          <Button variant="primary" type="submit">
            {editMode ? "Update" : "Add"}
          </Button>
          <Button variant="secondary" onClick={onClose} className="ms-2">
            Cancel
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddParentCategoryModal;
