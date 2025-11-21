import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useAddStockMutation } from "../../api/productApi";
import { message } from "antd";
const StockModal = ({ show, onHide, product }) => {
  const [quantity, setQuantity] = useState("");

  // RTK Mutation
  const [addStock, { isLoading: addingStock }] = useAddStockMutation();

  const handleSubmit = async () => {
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      message.error("Please enter a valid quantity.");
      return;
    }

    const stockData = {
      productId: product?.productId,
      quantity: parseInt(quantity),
    };

    try {
      await addStock(stockData).unwrap();
    } catch (error) {
      message.error(error?.data?.message || "Something went wrong!");
    }

    setQuantity("");
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header>
        <Modal.Title>
          Add Stock - <strong>{product?.name}</strong>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Quantity</Form.Label>
            <Form.Control
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              disabled={addingStock}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleSubmit} disabled={addingStock}>
          {addingStock ? "Processing..." : "Submit"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StockModal;
