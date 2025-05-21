import React, { useState } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import { toast } from "sonner";
import { useUpdateOrderByIdMutation } from "../../api/orderApi";
const OnHoldModal = ({ order, invoice, onClose, onConfirm }) => {
  const [reference, setReference] = useState(order?.source || "");
  const [error, setError] = useState("");
  const [updateOrder, { isLoading }] = useUpdateOrderByIdMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reference.trim()) {
      setError("Order reference is required.");
      return;
    }

    if (!order?.id) {
      setError("Invalid order data.");
      toast.error("Invalid order data.");
      return;
    }

    try {
      await updateOrder({
        orderId: order.id,
        status: "ONHOLD",
        source: reference,
      }).unwrap();
      toast.success("Order placed on hold successfully!");
      onConfirm(reference); // Notify parent (e.g., clear cart)
      onClose(); // Close modal
    } catch (error) {
      setError(error.data?.message || "Failed to place order on hold.");
      toast.error(error.data?.message || "Failed to place order on hold.");
    }
  };

  return (
    <Modal show centered onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Hold Order</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          <div className="bg-light rounded p-4 text-center mb-3">
            <h2 className="display-1">
              ₹{(invoice?.amount || 0).toLocaleString()}
            </h2>
          </div>
          <Form.Group className="mb-3">
            <Form.Label>
              Order Reference <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              required
              isInvalid={!!error}
            />
            <Form.Control.Feedback type="invalid">
              {error}
            </Form.Control.Feedback>
          </Form.Group>
          <p>
            The current order will be set on hold. You can retrieve it from the
            pending orders. A reference might help you identify it more quickly.
          </p>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? (
              <Spinner animation="border" size="sm" className="me-2" />
            ) : null}
            Confirm
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default OnHoldModal;
