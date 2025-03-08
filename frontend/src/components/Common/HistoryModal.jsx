import React from "react";
import { Modal, Button, Table } from "react-bootstrap";

const HistoryModal = ({ show, onHide, history, product }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Stock History - {product?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {history.length === 0 ? (
          <p>No stock history available.</p>
        ) : (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, index) => (
                <tr key={index}>
                  <td>{new Date(entry.date).toLocaleString()}</td>
                  <td>{entry.action === "in" ? "Stock In" : "Stock Out"}</td>
                  <td>{entry.quantity}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default HistoryModal;
