import React from "react";
import { Modal } from "react-bootstrap";

const DatesModal = ({ show, onHide, dueDate, followupDates }) => {
  // Combine and sort dates
  const allDates = [
    ...(dueDate ? [{ date: dueDate, type: "Due Date" }] : []),
    ...(followupDates?.map((date) => ({ date, type: "Follow-up" })) || []),
  ].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header>
        <Modal.Title>Order Dates</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {allDates.length > 0 ? (
          <ul className="list-group">
            {allDates.map(({ date, type }, index) => (
              <li key={index} className="list-group-item">
                <strong>{type}:</strong> {date}
              </li>
            ))}
          </ul>
        ) : (
          <p>No dates available.</p>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default DatesModal;
