import React, { useState } from "react";
import { Modal, Button, Form, Col, Row, Table } from "react-bootstrap";

const CreateInvoiceFromQuotation = ({
  quotation,
  onClose,
  createInvoice,
  customerMap,
  addressMap,
}) => {
  const [formData, setFormData] = useState({
    customerId: quotation.customerId || "",
    billTo: quotation.document_title || "",
    shipTo: quotation.shipTo || "",
    amount: quotation.finalAmount || "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: quotation.due_date || "",
    products: quotation.products || [],
    includeGst: quotation.include_gst || false,
    gstValue: quotation.gst_value || "0",
    roundOff: quotation.roundOff || "0",
    status: "Draft",
    quotationId: quotation.quotationId,
    referenceNumber: quotation.reference_number || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Calculate total amount including GST and round-off
  const calculateTotal = () => {
    const subtotal = formData.products.reduce(
      (sum, item) => sum + parseFloat(item.total || 0),
      0
    );
    const gst = formData.includeGst
      ? (subtotal * parseFloat(formData.gstValue)) / 100
      : 0;
    return (subtotal + gst + parseFloat(formData.roundOff)).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const invoiceData = {
        customerId: formData.customerId,
        billTo: formData.billTo,
        shipTo: formData.shipTo,
        amount: calculateTotal(),
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        status: formData.status,
        items: formData.products.map((product) => ({
          name: product.name,
          qty: product.qty,
          sellingPrice: product.sellingPrice,
          total: product.total,
          tax: product.tax,
        })),
        includeGst: formData.includeGst,
        gstValue: formData.gstValue,
        roundOff: formData.roundOff,
        quotationId: formData.quotationId,
        referenceNumber: formData.referenceNumber,
      };
      await createInvoice(invoiceData).unwrap();
      onClose();
    } catch (error) {
      alert("Failed to create invoice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={true} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Create Invoice from Quotation #{quotation.reference_number}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Customer</Form.Label>
                <Form.Control
                  type="text"
                  name="billTo"
                  value={
                    customerMap[formData.customerId?.trim()] ||
                    formData.billTo ||
                    "Unknown Customer"
                  }
                  onChange={handleChange}
                  readOnly
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Shipping Address</Form.Label>
                <Form.Control
                  type="text"
                  name="shipTo"
                  value={
                    addressMap[formData.shipTo] || formData.shipTo || "N/A"
                  }
                  onChange={handleChange}
                  readOnly
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Reference Number</Form.Label>
                <Form.Control
                  type="text"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleChange}
                  readOnly
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Invoice Date</Form.Label>
                <Form.Control
                  type="date"
                  name="invoiceDate"
                  value={formData.invoiceDate}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Due Date</Form.Label>
                <Form.Control
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Draft">Draft</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Include GST"
                  name="includeGst"
                  checked={formData.includeGst}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              {formData.includeGst && (
                <Form.Group className="mb-3">
                  <Form.Label>GST (%)</Form.Label>
                  <Form.Control
                    type="number"
                    name="gstValue"
                    value={formData.gstValue}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
              )}
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Round Off</Form.Label>
                <Form.Control
                  type="number"
                  name="roundOff"
                  value={formData.roundOff}
                  onChange={handleChange}
                  step="0.01"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Total Amount</Form.Label>
                <Form.Control
                  type="text"
                  value={`Rs ${calculateTotal()}`}
                  readOnly
                />
              </Form.Group>
            </Col>
          </Row>
          {formData.products.length > 0 && (
            <div className="mb-3">
              <Form.Label>Products</Form.Label>
              <Table bordered>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Quantity</th>
                    <th>Selling Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.products.map((product, index) => (
                    <tr key={index}>
                      <td>{product.name}</td>
                      <td>{product.qty}</td>
                      <td>Rs {product.sellingPrice}</td>
                      <td>Rs {product.total}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Invoice"}
          </Button>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateInvoiceFromQuotation;
