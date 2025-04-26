// styles.js
export const globalStyles = `
  .invoice-box {
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  .table th, .table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  .table th {
    background-color: #f8f9fa;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 14px;
  }
  .table tbody tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  .table tbody tr:hover {
    background-color: #f1f1f1;
  }
  .btn-primary {
    background-color: #007bff;
    border-color: #007bff;
    padding: 12px 24px;
    border-radius: 4px;
    text-decoration: none;
    color: white;
    font-size: 16px;
    font-weight: 500;
    transition: background-color 0.3s, box-shadow 0.3s;
    display: inline-flex;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  .btn-primary:hover {
    background-color: #0056b3;
    border-color: #0056b3;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  }
  .btn-primary i {
    margin-right: 8px;
  }
`;

export const componentStyles = {
  addItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#333",
  },
  invoiceBox: {
    padding: "20px",
  },
  invoiceTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1a73e8",
    marginBottom: "15px",
  },
  dateSection: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
  },
  dateItem: {
    fontSize: "14px",
    color: "#555",
  },
  addressRow: {
    marginBottom: "20px",
  },
  addressCol: {
    padding: "15px",
    backgroundColor: "#fafafa",
    border: "1px solid #eee",
    borderRadius: "4px",
  },
  addressTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "10px",
  },
  addressText: {
    fontSize: "14px",
    color: "#666",
    margin: "5px 0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  summarySection: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#f8f9fa",
    borderRadius: "4px",
    textAlign: "right",
  },
  summaryItem: {
    fontSize: "15px",
    margin: "5px 0",
    color: "#333",
  },
  totalItem: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#1a73e8",
    margin: "10px 0",
  },
  amountInWords: {
    fontSize: "14px",
    color: "#555",
    fontStyle: "italic",
  },
  termsSection: {
    marginTop: "20px",
  },
  termsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "10px",
  },
  termsList: {
    listStyleType: "decimal",
    paddingLeft: "20px",
  },
  termsItem: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "5px",
  },
  signatureSection: {
    marginTop: "20px",
    textAlign: "right",
    borderTop: "1px solid #eee",
    paddingTop: "10px",
  },
  signatureLabel: {
    fontSize: "14px",
    color: "#555",
    marginBottom: "5px",
  },
  signatureName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#333",
  },
};
