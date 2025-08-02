import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Col, Row, Table } from "react-bootstrap";
import { useGetAllAddressesQuery } from "../../api/addressApi";
import { useGetProfileQuery } from "../../api/userApi";
import { toast } from "sonner";

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
    billTo:
      customerMap[quotation.customerId]?.name || quotation.document_title || "",
    shipTo: quotation.shipTo || "",
    amount: quotation.finalAmount || 0,
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: quotation.due_date || "",
    products: (quotation.products || []).map((product) => ({
      productId: product.productId || "",
      quantity: parseInt(product.quantity) || 1,
      price: parseFloat(product.sellingPrice) || 0,
      total: parseFloat(product.total) || 0,
      tax: parseFloat(product.tax) || 0,
      name: product.name || "Unnamed Product", // For display only
    })),
    status: "unpaid",
    quotationId: quotation.quotationId,
    invoiceNo: `INV_${new Date()
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "")}_${Math.random().toString(36).substr(2, 5)}`,
    signatureName: quotation.signature_name || "CM TRADING CO",
    paymentMethod: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (addresses.length > 0 && !formData.shipTo && quotation.shipTo) {
      const defaultAddress = addresses.find(
        (a) => a.addressId === quotation.shipTo
      );
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
    return parseFloat(subtotal.toFixed(2));
  };

  const validateForm = () => {
    if (!formData.customerId) return "Please select a customer.";
    if (formData.products.length === 0)
      return "At least one product is required.";
    if (
      !formData.products.every(
        (p) => p.productId && p.quantity > 0 && p.price >= 0
      )
    ) {
      return "All products must have a valid productId, quantity, and price.";
    }
    if (!formData.invoiceDate || !formData.dueDate) {
      return "Invoice date and due date are required.";
    }
    const invoiceDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (
      !invoiceDateRegex.test(formData.invoiceDate) ||
      !invoiceDateRegex.test(formData.dueDate)
    ) {
      return "Invalid date format. Use YYYY-MM-DD.";
    }
    if (new Date(formData.dueDate) < new Date(formData.invoiceDate)) {
      return "Due date cannot be earlier than invoice date.";
    }
    if (!formData.paymentMethod && formData.status !== "unpaid") {
      return "Payment method is required for non-unpaid status.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }

    try {
      const invoiceData = {
        invoiceId: formData.quotationId, // Use quotationId as invoiceId for consistency
        customerId: formData.customerId,
        billTo: formData.billTo,
        shipTo: formData.shipTo || null,
        amount: calculateTotal(),
        invoiceDate: formData.invoiceDate,
        dueDate: formData.dueDate,
        status: formData.status,
        products: JSON.stringify(
          formData.products.map((product) => ({
            productId: product.productId,
            quantity: product.quantity,
            price: product.price,
          }))
        ),
        paymentMethod: formData.paymentMethod
          ? JSON.stringify({ method: formData.paymentMethod })
          : null,
        quotationId: formData.quotationId,
        invoiceNo: formData.invoiceNo,
        signatureName: formData.signatureName,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createInvoice(invoiceData).unwrap();
      toast.success("Invoice created successfully!");
      onClose();
    } catch (error) {
      const errorMessage =
        error.data?.message ||
        error.response?.data?.message ||
        error.data?.errors?.join(", ") ||
        "Failed to create invoice. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
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
                  value={formData.billTo || "Unknown Customer"}
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
                    <option value="">Select Address (Optional)</option>
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
                  readOnly
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
                  <option value="">Select Method (Optional)</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Pay Later">Pay Later</option>
                </Form.Select>
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
          {formData.products.length > 0 && (
            <div className="mb-3">
              <Form.Label>Products</Form.Label>
              <Table bordered>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Tax (%)</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.products.map((product, index) => (
                    <tr key={index}>
                      <td>{product.name}</td>
                      <td>{product.quantity}</td>
                      <td>Rs {product.price.toFixed(2)}</td>
                      <td>{product.tax.toFixed(2)}</td>
                      <td>Rs {product.total.toFixed(2)}</td>
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
