import React from "react";
import { Modal, Spinner } from "react-bootstrap";
// adjust path
import { useGetCustomerByIdQuery } from "../../api/customerApi";
const CustomerModal = ({ show, onHide, customerId }) => {
  const { data, isLoading, error } = useGetCustomerByIdQuery(customerId, {
    skip: !customerId,
  });

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Customer Info</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
          <Spinner animation="border" />
        ) : error ? (
          <div>Error fetching customer.</div>
        ) : (
          <>
            <p>
              <strong>Name:</strong> {data.name}
            </p>
            <p>
              <strong>Email:</strong> {data.email}
            </p>
            <p>
              <strong>Phone:</strong> {data.phone}
            </p>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default CustomerModal;
