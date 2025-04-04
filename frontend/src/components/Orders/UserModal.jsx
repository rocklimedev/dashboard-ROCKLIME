import React from "react";
import { Modal, Spinner } from "react-bootstrap";
// adjust path
import { useGetProfileQuery } from "../../api/userApi";
const UserModal = ({ show, onHide, userId }) => {
  const { data, isLoading, error } = useGetProfileQuery(userId, {
    skip: !userId,
  });

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>User Info</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
          <Spinner animation="border" />
        ) : error ? (
          <div>Error fetching user profile.</div>
        ) : (
          <>
            <p>
              <strong>Name:</strong> {data.name}
            </p>
            <p>
              <strong>Email:</strong> {data.email}
            </p>
            <p>
              <strong>Role:</strong> {data.role}
            </p>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default UserModal;
