import React, { useState } from "react";

const data = [
  {
    id: 59217,
    status: "New order",
    item: 1,
    orderNumber: 59217342,
    customer: "Cody Fisher",
    service: "Standard",
    code: "940010010936113003113",
  },
  {
    id: 59213,
    status: "Inproduction",
    item: 2,
    orderNumber: 59217343,
    customer: "Kristin Watson",
    service: "Priority",
    code: "940010010936113003113",
  },
  {
    id: 59219,
    status: "Shipped",
    item: 12,
    orderNumber: 59217344,
    customer: "Esther Howard",
    service: "Express",
    code: "940010010936113003113",
  },
  // ... other data
];

const statusClasses = {
  "New order": "new-order",
  Inproduction: "inproduction",
  Shipped: "shipped",
  Cancelled: "cancelled",
  Rejected: "rejected",
  Draft: "draft",
};

export default function OrderTable() {
  const [page, setPage] = useState(1);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="order-table">
          <div className="order-header">
            <h1>Order</h1>
            <button className="create-button">+ Create order</button>
          </div>
          <table className="order-table">
            <thead>
              <tr>
                <th className="ordertable-lable">ORDER ID</th>
                <th>STATUS</th>
                <th>ITEM</th>
                <th>ORDER NUMBER</th>
                <th>CUSTOMER NAME</th>
                <th>SHIPPING SERVICE</th>
                <th>TRACKING CODE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td className="order-table-content">{row.id}</td>
                  <td>
                    <span className={`badge ${statusClasses[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>{row.item}</td>
                  <td>{row.orderNumber}</td>
                  <td>{row.customer}</td>
                  <td>{row.service}</td>
                  <td>{row.code}</td>
                  <td>
                    <span className="edit">✏️</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">Page {page} of 10</div>
        </div>
      </div>
    </div>
  );
}
