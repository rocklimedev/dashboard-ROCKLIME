import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "sonner";
import {
  useCreateParentCategoryMutation,
  useUpdateParentCategoryMutation,
} from "../../api/parentCategoryApi";
const AddParentCategoryModal = ({ editMode, parentCategoryData, onClose }) => {
  const [name, setName] = useState(
    parentCategoryData ? parentCategoryData.name : ""
  );
  const [addParentCategory] = useCreateParentCategoryMutation();
  const [updateParentCategory] = useUpdateParentCategoryMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await updateParentCategory({
          id: parentCategoryData.id,
          name,
        }).unwrap();
        toast.success("Parent category updated successfully!");
      } else {
        await addParentCategory({ name }).unwrap();
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
            <label for="form-label">Name</label>
            <Form.Control
              type="text"
              placeholder="Enter parent category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
