import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Col, Row, Table } from "react-bootstrap";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetProfileQuery } from "../../api/userApi";

const CreateInvoiceFromQuotation = ({
  quotation,
  onClose,
  createInvoice,
  customerMap,
  addressMap,
}) => {
  const { data: userProfile } = useGetProfileQuery();
  const userId = userProfile?.user?.userId;

  const { data: addressesData = { data: [] }, isLoading: isAddressesLoading } =
    useGetAllAddressesQuery(userId, { skip: !userId });

  const addresses = useMemo(
    () =>
      Array.isArray(addressesData?.data)
        ? addressesData.data
        : Array.isArray(addressesData)
        ? addressesData
        : [],
    [addressesData]
  );

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
    paymentMethod: "",
    invoiceNo: `INV_${new Date()
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "")}_${Math.random().toString(36).substr(2, 5)}`, // Auto-generated unique invoice number
    signatureName: quotation.signature_name || "CM TRADING CO",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (addresses.length > 0 && !formData.shipTo) {
      const defaultAddress =
        addresses.find((a) => a.addressId === quotation.shipTo) || addresses[0];
      setFormData((prev) => ({
        ...prev,
        shipTo: defaultAddress?.addressId || "",
      }));
    }
  }, [addresses, quotation.shipTo, formData.shipTo]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
  };

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
    setError(null);

    const validProducts = formData.products.filter(
      (p) =>
        typeof p.name === "string" &&
        p.name.trim() !== "" &&
        p.qty !== undefined &&
        p.sellingPrice !== undefined &&
        p.total !== undefined
    );

    if (!formData.customerId) {
      setError("Please select a customer.");
      setIsSubmitting(false);
      return;
    }
    if (validProducts.length === 0) {
      setError("Please ensure at least one product is valid.");
      setIsSubmitting(false);
      return;
    }
    if (new Date(formData.dueDate) < new Date(formData.invoiceDate)) {
      setError("Due date cannot be earlier than invoice date.");
      setIsSubmitting(false);
      return;
    }

    try {
      const invoiceData = {
        customerId: formData.customerId,
        billTo: formData.billTo,
        shipTo: formData.shipTo || null,
        amount: calculateTotal(),
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        status: formData.status,
        products: validProducts.map((product) => ({
          name: product.name,
          qty: parseInt(product.qty) || 1,
          sellingPrice: parseFloat(product.sellingPrice) || 0,
          total: parseFloat(product.total) || 0,
          tax: product.tax || 0,
        })),
        paymentMethod: formData.paymentMethod
          ? JSON.stringify({ method: formData.paymentMethod })
          : null,
        includeGst: formData.includeGst,
        gstValue: formData.gstValue,
        roundOff: formData.roundOff,
        quotationId: formData.quotationId,
        referenceNumber: formData.referenceNumber,
        invoiceNo: formData.invoiceNo,
        signatureName: formData.signatureName,
        createdBy: userId,
      };

      console.log("Submitting Payload:", invoiceData);
      await createInvoice(invoiceData).unwrap();
      onClose();
    } catch (error) {
      console.error(
        "Create Invoice Error:",
        error,
        "Full Response:",
        error.response ? error.response.data : error.data
      );
      setError(
        error.response?.data?.message ||
          error.data?.message ||
          error.data?.errors?.join(", ") ||
          "Failed to create invoice. Please check server logs."
      );
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
        {error && <div className="alert alert-danger">{error}</div>}
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
                {isAddressesLoading ? (
                  <div>Loading addresses...</div>
                ) : addresses.length === 0 ? (
                  <div className="text-warning">No addresses available</div>
                ) : (
                  <Form.Select
                    name="shipTo"
                    value={formData.shipTo || ""}
                    onChange={handleChange}
                  >
                    <option value="">Select Address</option>
                    {addresses.map((addr) => (
                      <option key={addr.addressId} value={addr.addressId}>
                        {[
                          addr?.street,
                          addr?.city,
                          addr?.state,
                          addr?.postalCode,
                          addr?.country,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Incomplete Address"}
                      </option>
                    ))}
                  </Form.Select>
                )}
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
                <Form.Label>Invoice Number</Form.Label>
                <Form.Control
                  type="text"
                  name="invoiceNo"
                  value={formData.invoiceNo}
                  onChange={handleChange}
                  required
                  readOnly // Auto-generated, can be edited if needed
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
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
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Draft">Draft</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="partially paid">Partially Paid</option>
                  <option value="void">Void</option>
                  <option value="refund">Refund</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Payment Method</Form.Label>
                <Form.Select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                >
                  <option value="">Select Method</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
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
                <Form.Label>Signature Name</Form.Label>
                <Form.Control
                  type="text"
                  name="signatureName"
                  value={formData.signatureName}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
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
