import React, { useState, useEffect } from "react";

const InvoiceDetails = () => {
  const [billTo, setBillTo] = useState("");
  const [shipTo, setShipTo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (invoiceDate && dueDate) {
      const invoice = new Date(invoiceDate);
      const due = new Date(dueDate);
      if (due <= invoice) {
        setError("Due date must be after invoice date");
      } else {
        setError("");
      }
    }
  }, [invoiceDate, dueDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (error) return;
    const invoiceData = {
      billTo,
      shipTo,
      invoiceDate,
      dueDate,
      signatureName,
    };
    console.log("Invoice Submitted:", invoiceData);
    alert("Invoice details submitted successfully!");
  };

  return (
    <div className="card payment-method p-3">
      <div className="card-body">
        <h5 className="mb-3 text-lg font-semibold">Invoice</h5>
        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Bill To</label>
              <input
                type="text"
                className="form-control"
                value={billTo}
                onChange={(e) => setBillTo(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Ship To (Address)</label>
              <input
                type="text"
                className="form-control"
                value={shipTo}
                onChange={(e) => setShipTo(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Invoice Date</label>
              <input
                type="date"
                className="form-control"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-control"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
              {error && <small className="text-danger">{error}</small>}
            </div>
            <div className="col-12">
              <label className="form-label">Signature</label>
              <input
                type="text"
                className="form-control"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                required
              />
            </div>
            <div className="col-12 mt-3">
              <button type="submit" className="btn btn-primary">
                Submit Invoice
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceDetails;
