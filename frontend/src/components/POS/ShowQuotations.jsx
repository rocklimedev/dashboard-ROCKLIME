import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  Button,
  Badge,
  Row,
  Col,
  Spinner,
  Alert,
  OverlayTrigger,
  Tooltip,
  Modal,
} from "react-bootstrap";
import ShowProducts from "./ShowProducts";
import { useGetProfileQuery } from "../../api/userApi";
import { useGetAllUsersQuery } from "../../api/userApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { toast } from "sonner";
import {
  BsPerson,
  BsCalendar,
  BsCurrencyRupee,
  BsCartPlus,
  BsEye,
  BsPrinter,
  BsFileEarmarkText,
} from "react-icons/bs";

const ShowQuotations = ({
  isQuotationsLoading,
  quotations,
  onConvertToOrder,
}) => {
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const { data: profileData, isLoading: isProfileLoading } =
    useGetProfileQuery();
  const { data: usersData, isLoading: isUsersLoading } = useGetAllUsersQuery();
  const { data: customersData, isLoading: isCustomersLoading } =
    useGetCustomersQuery();

  const handleConvertToOrder = (quotation) => {
    setErrorMessage(null);
    if (!quotation || !quotation.customerId) {
      setErrorMessage("Invalid quotation data.");
      toast.error("Invalid quotation data.");
      return;
    }

    if (!quotation.products || quotation.products.length === 0) {
      setErrorMessage("No products found in the quotation.");
      toast.error("No products found in the quotation.");
      return;
    }

    onConvertToOrder(quotation);
  };

  const getUsernameById = (userId) => {
    if (isUsersLoading) return "Loading...";
    const user = usersData?.users?.find((user) => user.userId === userId);
    return user?.username || "Unknown User";
  };

  const getCustomerNameById = (customerId) => {
    if (isCustomersLoading) return "Loading...";
    const customer = customersData?.data?.find(
      (customer) => customer.customerId === customerId
    );
    return customer?.name || "Unknown Customer";
  };

  return (
    <div className="order-body py-4">
      {errorMessage && (
        <Alert
          variant="danger"
          onClose={() => setErrorMessage(null)}
          dismissible
        >
          {errorMessage}
        </Alert>
      )}

      {isQuotationsLoading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading quotations...</p>
        </div>
      ) : quotations?.length ? (
        quotations.map((quotation) => (
          <Card
            key={quotation.quotationId}
            className="mb-4 shadow-sm border-0"
            style={{ transition: "transform 0.2s", cursor: "pointer" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.02)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Card.Body>
              <Row className="align-items-center mb-3">
                <Col>
                  <Badge bg="dark" className="fs-6 me-2">
                    #{quotation.document_title}
                  </Badge>
                  <Badge bg="secondary" className="fs-6">
                    Due: {new Date(quotation.due_date).toLocaleDateString()}
                  </Badge>
                </Col>
              </Row>
              <Row className="g-3">
                <Col md={6}>
                  <p className="mb-2 fs-5">
                    <BsPerson className="me-2 text-muted" />
                    <strong>Created By:</strong>{" "}
                    {getUsernameById(quotation.createdBy)}
                  </p>
                  <p className="mb-2 fs-5">
                    <BsPerson className="me-2 text-muted" />
                    <strong>For:</strong>{" "}
                    {getCustomerNameById(quotation.customerId)}
                  </p>
                </Col>
                <Col md={6} className="text-md-end">
                  <p className="mb-2 fs-5">
                    <BsCurrencyRupee className="me-2 text-muted" />
                    <strong>Total:</strong> ₹{quotation.finalAmount}
                  </p>
                  <p className="mb-2 fs-5">
                    <BsCalendar className="me-2 text-muted" />
                    <strong>Date:</strong>{" "}
                    {new Date(quotation.quotation_date).toLocaleDateString() ||
                      "N/A"}
                  </p>
                </Col>
              </Row>
              <Alert variant="info" className="my-3 text-center">
                Confirm the requirements before taking any action.
              </Alert>
              <div className="d-flex justify-content-center flex-wrap gap-2">
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Open Quotation</Tooltip>}
                >
                  <Button
                    as={Link}
                    to={`/quotations/${quotation.quotationId}`}
                    target="_blank"
                    variant="outline-primary"
                    className="d-flex align-items-center"
                  >
                    <BsFileEarmarkText className="me-2" />
                    Open
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Convert to Order</Tooltip>}
                >
                  <Button
                    variant="success"
                    onClick={() => handleConvertToOrder(quotation)}
                    disabled={isProfileLoading}
                    className="d-flex align-items-center"
                  >
                    <BsCartPlus className="me-2" />
                    Convert
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>View Products</Tooltip>}
                >
                  <Button
                    variant="outline-info"
                    onClick={() => {
                      setSelectedQuotation(quotation);
                    }}
                    className="d-flex align-items-center"
                  >
                    <BsEye className="me-2" />
                    Products
                  </Button>
                </OverlayTrigger>

                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Print Quotation</Tooltip>}
                >
                  <Button
                    variant="outline-secondary"
                    className="d-flex align-items-center"
                  >
                    <BsPrinter className="me-2" />
                    Print
                  </Button>
                </OverlayTrigger>
              </div>
            </Card.Body>
          </Card>
        ))
      ) : (
        <Alert variant="warning" className="text-center">
          No quotations available.
        </Alert>
      )}

      {selectedQuotation && (
        <Modal
          show={!!selectedQuotation}
          onHide={() => {
            setSelectedQuotation(null);
          }}
          size="lg"
          centered
          className="modal-quotations"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Quotation #{selectedQuotation.document_title}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ShowProducts
              quotation={selectedQuotation}
              onClose={() => setSelectedQuotation(null)}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setSelectedQuotation(null)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default ShowQuotations;
