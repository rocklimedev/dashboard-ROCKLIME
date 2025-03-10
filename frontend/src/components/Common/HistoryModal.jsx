import React from "react";
import { Modal, Button, Table, Spinner, Alert } from "react-bootstrap";
import { useGetHistoryByProductIdQuery } from "../../api/productApi";

const HistoryModal = ({ show, onHide, product }) => {
  // Fetch stock history using RTK Query
  const {
    data: response, // Change from history to response
    error,
    isLoading,
  } = useGetHistoryByProductIdQuery(product?.productId, {
    skip: !product?.productId || !show, // Prevents fetching if productId is undefined or modal is not shown
  });

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Stock History - {product?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading && (
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p>Loading history...</p>
          </div>
        )}
        {error && <Alert variant="danger">Failed to load stock history.</Alert>}
        {!isLoading &&
          !error &&
          (!response?.history || response.history.length === 0) && (
            <Alert variant="info" className="text-center">
              No history found.
            </Alert>
          )}
        {!isLoading &&
          !error &&
          response?.history &&
          response.history.length > 0 && (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {response.history.map((entry, index) => (
                  <tr key={index}>
                    <td>{new Date(entry.timestamp).toLocaleString()}</td>
                    <td>
                      {entry.action === "add-stock" ? "Stock In" : "Stock Out"}
                    </td>
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
