import React from "react";
import { Modal, Spinner } from "react-bootstrap";
import { useGetTeamByIdQuery } from "../../api/teamApi"; // adjust path if needed
const TeamModal = ({ show, onHide, teamId }) => {
  const { data, isLoading, error } = useGetTeamByIdQuery(teamId, {
    skip: !teamId,
  });

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Team Info</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
          <Spinner animation="border" />
        ) : error ? (
          <div>Error fetching team.</div>
        ) : (
          <>
            <p>
              <strong>Name:</strong> {data.name}
            </p>
            <p>
              <strong>Members:</strong>
            </p>
            <ul>
              {data.members.map((member) => (
                <li key={member.id}>
                  {member.name} ({member.email})
                </li>
              ))}
            </ul>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default TeamModal;
