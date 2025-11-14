import React, { useState } from "react";
import { toast } from "sonner";
import { useCreateRoleMutation } from "../../api/rolesApi";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";

const AddRoleModal = ({ show, onClose }) => {
  const [roleName, setRoleName] = useState("");
  const [createRole] = useCreateRoleMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) {
      toast.error("Role name is required.");
      return;
    }

    try {
      await createRole({ roleName }).unwrap();
      toast.success("Role added successfully!");
      setRoleName("");
      onClose();
    } catch (error) {
      toast.error(
        `Failed to add role: ${error.data?.message || "Please try again."}`
      );
    }
  };

  const handleClose = () => {
    setRoleName("");
    onClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="md">
      <Modal.Header>
        <Modal.Title>Add New Role</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="roleName">
            <Form.Label>Role Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter role name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              required
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="primary" type="submit">
            Add New
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddRoleModal;
