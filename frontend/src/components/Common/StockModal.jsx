import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const StockModal = ({ show, onHide, onSubmit, product }) => {
  const [quantity, setQuantity] = useState("");
  const [action, setAction] = useState("in"); // "in" for stock-in, "out" for stock-out

  const handleSubmit = () => {
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    const stockData = {
      productId: product?.productId,
      quantity: parseInt(quantity),
      action,
    };

    onSubmit(stockData);
    setQuantity("");
    setAction("in");
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Manage Stock</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Product: <strong>{product?.name}</strong>
        </p>
        <Form>
          <Form.Group>
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
            />
          </Form.Group>
          <Form.Group className="mt-3">
            <Form.Label>Action</Form.Label>
            <div>
              <Form.Check
                inline
                label="Stock In"
                type="radio"
                name="stockAction"
                checked={action === "in"}
                onChange={() => setAction("in")}
              />
              <Form.Check
                inline
                label="Stock Out"
                type="radio"
                name="stockAction"
                checked={action === "out"}
                onChange={() => setAction("out")}
              />
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          Submit
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StockModal;
