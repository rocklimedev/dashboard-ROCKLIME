import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import {
  useAddStockMutation,
  useRemoveStockMutation,
} from "../../api/productApi";

const StockModal = ({ show, onHide, product }) => {
  const [quantity, setQuantity] = useState("");
  const [action, setAction] = useState("in"); // "in" for stock-in, "out" for stock-out

  // RTK Mutations
  const [addStock, { isLoading: addingStock }] = useAddStockMutation();
  const [removeStock, { isLoading: removingStock }] = useRemoveStockMutation();

  const handleSubmit = async () => {
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    const stockData = {
      productId: product?.productId,
      quantity: parseInt(quantity),
    };

    try {
      if (action === "in") {
        await addStock(stockData).unwrap();
        alert("Stock added successfully!");
      } else {
        await removeStock(stockData).unwrap();
        alert("Stock removed successfully!");
      }
    } catch (error) {
      alert(error?.data?.message || "Something went wrong!");
    }

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
              disabled={addingStock || removingStock}
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
                disabled={addingStock || removingStock}
              />
              <Form.Check
                inline
                label="Stock Out"
                type="radio"
                name="stockAction"
                checked={action === "out"}
                onChange={() => setAction("out")}
                disabled={addingStock || removingStock}
              />
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={addingStock || removingStock}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={addingStock || removingStock}
        >
          {addingStock || removingStock ? "Processing..." : "Submit"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StockModal;
