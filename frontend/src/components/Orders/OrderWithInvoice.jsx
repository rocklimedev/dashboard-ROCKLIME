import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetInvoiceByIdQuery } from "../../api/invoiceApi";
import { useGetOrderDetailsQuery } from "../../api/orderApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { Dropdown, OverlayTrigger, Tooltip } from "react-bootstrap";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
  useDeleteOrderMutation,
  useUpdateOrderStatusMutation,
} from "../../api/orderApi";
import AddNewOrder from "./AddNewOrder";

// Mock team data (replace with API call if available)
const teamData = {
  success: true,
  teams: [
    {
      id: "35066a2c-730e-4e02-9f20-054b28592aae",
      teamName: "SALES",
      adminId: "5d5bd153-8877-4db1-a5cc-2af5c7e55d9c",
      adminName: "nandmurlibalakrishn",
      createdAt: "2025-04-03T07:21:50.000Z",
      updatedAt: "2025-04-03T07:21:50.000Z",
      teammembers: [
        {
          id: "0e40d643-c3b1-4138-8b61-7fd22c92bb90",
          teamId: "35066a2c-730e-4e02-9f20-054b28592aae",
          userId: "5d5bd153-8877-4db1-a5cc-2af5c7e55d9c",
          userName: "nandmurlibalakrishn",
          roleId: "c2eaf23a-765c-4ee5-91bf-cbc37fbdea21",
          roleName: "Admin",
          createdAt: "2025-04-03T07:21:50.000Z",
          updatedAt: "2025-04-03T07:21:50.000Z",
        },
      ],
    },
    {
      id: "92be76d5-4a5a-4371-9d5a-dfcf177a7751",
      teamName: "SOCIAL",
      adminId: "2754cc2c-c5d6-4961-bc41-375df0caa9aa",
      adminName: "vermadhruv",
      createdAt: "2025-04-03T07:27:10.000Z",
      updatedAt: "2025-04-03T07:27:10.000Z",
      teammembers: [
        {
          id: "74d8198d-147c-4264-a016-eceb0f55ff9a",
          teamId: "92be76d5-4a5a-4371-9d5a-dfcf177a7751",
          userId: "2754cc2c-c5d6-4961-bc41-375df0caa9aa",
          userName: "vermadhruv",
          roleId: "c3893e5f-4b6c-43c5-83ec-bc74beecfb30",
          roleName: "Admin",
          createdAt: "2025-04-03T07:27:11.000Z",
          updatedAt: "2025-04-03T07:27:11.000Z",
        },
      ],
    },
    {
      id: "e6c82b96-31fb-4866-b5ec-d80b2b303b50",
      teamName: "OPS",
      adminId: "5d5bd153-8877-4db1-a5cc-2af5c7e55d9c",
      adminName: "nandmurlibalakrishn",
      createdAt: "2025-04-03T07:12:29.000Z",
      updatedAt: "2025-04-03T07:12:29.000Z",
      teammembers: [
        {
          id: "b6c270ea-ac78-441c-8b9c-99ace4a4e4a6",
          teamId: "e6c82b96-31fb-4866-b5ec-d80b2b303b50",
          userId: "5d5bd153-8877-4db1-a5cc-2af5c7e55d9c",
          userName: "nandmurlibalakrishn",
          roleId: "c2eaf23a-765c-4ee5-91bf-cbc37fbdea21",
          roleName: "Admin",
          createdAt: "2025-04-03T07:12:30.000Z",
          updatedAt: "2025-04-03T07:12:30.000Z",
        },
      ],
    },
    {
      id: "2775cacb-a47c-4ef3-bbaf-9d5b622df0d1",
      teamName: "OPS",
      adminId: "5d5bd153-8877-4db1-a5cc-2af5c7e55d9c",
      adminName: "nandmurlibalakrishn",
      createdAt: "2025-04-03T07:06:28.000Z",
      updatedAt: "2025-04-03T07:06:28.000Z",
      teammembers: [],
    },
    {
      id: "5d2bd8b4-94e1-4fe4-9862-32c343f8d1ce",
      teamName: "",
      adminId: "5d5bd153-8877-4db1-a5cc-2af5c7e55d9c",
      adminName: "nandmurli balakrishn",
      createdAt: "2025-04-03T05:57:09.000Z",
      updatedAt: "2025-04-03T05:57:09.000Z",
      teammembers: [],
    },
    {
      id: "8d1b261e-9ebe-4cb8-9e3c-8c9a2e35eae0",
      teamName: "OPS",
      adminId: "5d5bd153-8877-4db1-a5cc-2af5c7e55d9c",
      adminName: "nandmurlibalakrishn",
      createdAt: "2025-04-03T07:04:05.000Z",
      updatedAt: "2025-04-03T07:04:05.000Z",
      teammembers: [],
    },
  ],
};

const OrderWithInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("products");
  const [showInvoiceTooltip, setShowInvoiceTooltip] = useState(false);
  const [deleteOrder] = useDeleteOrderMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const {
    data: orderData,
    isLoading: orderLoading,
    error: orderError,
  } = useGetOrderDetailsQuery(id);
  const { data: customerData } = useGetCustomersQuery();
  const order = orderData?.order || {};
  const invoiceId = order?.invoiceId;

  const {
    data: invoiceData,
    isLoading: invoiceLoading,
    error: invoiceError,
  } = useGetInvoiceByIdQuery(invoiceId, { skip: !invoiceId });

  const invoice = invoiceData?.data || {};
  const products = invoice?.products || [];
  const customers = customerData?.data || [];

  // Customer map
  const customerMap = useMemo(() => {
    const map = {};
    customers.forEach((cust) => {
      map[cust.customerId] = cust.name;
    });
    return map;
  }, [customers]);

  // User map
  const userMap = useMemo(() => {
    const map = {};
    teamData.teams.forEach((team) => {
      team.teammembers.forEach((member) => {
        map[member.userId] = member.userName;
      });
    });
    return map;
  }, []);

  // Team map
  const teamMap = useMemo(() => {
    const map = {};
    teamData.teams.forEach((team) => {
      map[team.id] = team.teamName;
    });
    return map;
  }, []);

  // Team members from assignedTo
  const normalizedTeamMembers = useMemo(() => {
    const teamId = order.assignedTo;
    if (!teamId) return [];
    const team = teamData.teams.find((t) => t.id === teamId);
    if (!team) return [];
    return team.teammembers.map((member) => ({
      name: member.userName || "Unknown",
      role: member.roleName || "N/A",
      email: member.email || "N/A",
    }));
  }, [order.assignedTo]);

  const handleEditOrder = () => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };

  const handleDeleteOrder = async () => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteOrder(id).unwrap();
        navigate("/orders");
      } catch (err) {
        console.error("Failed to delete order:", err);
      }
    }
  };

  const handleHoldOrder = async () => {
    try {
      await updateOrderStatus({ id, status: "On Hold" }).unwrap();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleInvoiceEdit = () => navigate(`/invoice/${invoiceId}`);

  const handleModalClose = () => {
    setSelectedOrder(null);
    setShowEditModal(false);
  };

  return (
    <div className="page-wrapper notes-page-wrapper">
      <div className="content">
        <div className="page-header page-add-notes border-0 d-flex flex-sm-row flex-column justify-content-between align-items-start">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Orders</h4>
              <h6 className="mb-0">Manage your orders</h6>
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* Order Card */}
          <div className="col-md-6">
            <div className="card border rounded-4 shadow-sm">
              <div className="card-header bg-primary text-white rounded-top-4 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">🧾 Order Details</h5>
                <Dropdown align="end">
                  <Dropdown.Toggle variant="link" className="text-white p-0">
                    <BsThreeDotsVertical />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={handleEditOrder}>
                      Edit
                    </Dropdown.Item>
                    <Dropdown.Item onClick={handleHoldOrder}>
                      Put On Hold
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={handleDeleteOrder}
                      className="text-danger"
                    >
                      Delete
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              <div className="card-body">
                {orderLoading ? (
                  <p>Loading Order...</p>
                ) : orderError ? (
                  <p className="text-danger">Error fetching order details</p>
                ) : (
                  <div className="row">
                    <div className="col-6 mb-3">
                      <small className="text-muted">Title</small>
                      <p className="fw-semibold">{order.title || "N/A"}</p>
                    </div>
                    <div className="col-6 mb-3">
                      <small className="text-muted">Status</small>
                      <span className="badge bg-info">
                        {order.status || "N/A"}
                      </span>
                    </div>
                    <div className="col-6 mb-3">
                      <small className="text-muted">Customer</small>
                      <p>
                        {order.createdFor
                          ? customerMap[order.createdFor] || "Unknown Customer"
                          : "N/A"}
                      </p>
                    </div>
                    <div className="col-6 mb-3">
                      <small className="text-muted">Created By</small>
                      <p>
                        {order.createdBy
                          ? userMap[order.createdBy] || "Unknown User"
                          : "N/A"}
                      </p>
                    </div>
                    <div className="col-6 mb-3">
                      <small className="text-muted">Due Date</small>
                      <p>
                        {order.dueDate
                          ? new Date(order.dueDate).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="col-6 mb-3">
                      <small className="text-muted">Priority</small>
                      <span className="badge bg-warning text-dark">
                        {order.priority || "N/A"}
                      </span>
                    </div>
                    <div className="col-12 mb-3">
                      <small className="text-muted">Description</small>
                      <p>{order.description || "N/A"}</p>
                    </div>
                    <div className="col-6 mb-3">
                      <small className="text-muted">Assigned To</small>
                      <p>
                        {order.assignedTo
                          ? teamMap[order.assignedTo] || "Unknown Team"
                          : "N/A"}
                      </p>
                    </div>
                    <div className="col-6 mb-3">
                      <small className="text-muted">Pipeline</small>
                      <p>{order.pipeline || "N/A"}</p>
                    </div>
                    <div className="col-6 mb-3">
                      <small className="text-muted">Source</small>
                      <p>{order.source || "N/A"}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Card */}
          <div className="col-md-6 position-relative">
            <div className="card border rounded-4 shadow-sm">
              <div className="card-header bg-success text-white rounded-top-4 d-flex justify-content-between align-items-center">
                <h5 className="mb-0">💳 Invoice Details</h5>
                <OverlayTrigger
                  placement="top"
                  show={showInvoiceTooltip}
                  overlay={
                    <Tooltip>
                      ⚠️ To edit the invoice, go to{" "}
                      <code>/invoice/{invoiceId}</code>
                    </Tooltip>
                  }
                >
                  <button
                    className="btn btn-light btn-sm"
                    onMouseEnter={() => setShowInvoiceTooltip(true)}
                    onMouseLeave={() => setShowInvoiceTooltip(false)}
                    onClick={handleInvoiceEdit}
                    disabled={!invoiceId}
                  >
                    Edit Invoice
                  </button>
                </OverlayTrigger>
              </div>
              <div className="card-body">
                {invoiceLoading ? (
                  <p>Loading Invoice...</p>
                ) : invoiceError ? (
                  <p className="text-danger">Error fetching invoice</p>
                ) : !invoiceId ? (
                  <p className="text-muted">
                    No invoice associated with this order.
                  </p>
                ) : (
                  <div className="row">
                    <div className="col-6 mb-3">
                      <small className="text-muted">Invoice Number</small>
                      <p className="fw-semibold">
                        {invoice.invoiceNumber || "N/A"}
                      </p>
                    </div>
                    <div className="col-6 mb-3">
                      <small className="text-muted">Customer</small>
                      <p>
                        {invoice.customerId
                          ? customerMap[invoice.customerId] ||
                            "Unknown Customer"
                          : "N/A"}
                      </p>
                    </div>
                    <div className="col-6 mb-3">
                      <small className="text-muted">Date</small>
                      <p>
                        {invoice.date
                          ? new Date(invoice.date).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="col-6 mb-3">
                      <small className="text-muted">Amount</small>
                      <h5 className="text-success">₹{invoice.amount || "0"}</h5>
                    </div>
                    <div className="col-6 mb-3">
                      <small className="text-muted">Status</small>
                      <span
                        className={`badge ${
                          invoice.status === "Paid" ? "bg-success" : "bg-danger"
                        }`}
                      >
                        {invoice.status || "N/A"}
                      </span>
                    </div>
                    <div className="col-6 mb-3">
                      <small className="text-muted">Payment Mode</small>
                      <p>{invoice.paymentMode || "N/A"}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Tabs */}
        <div className="mt-4 d-flex gap-3">
          <button
            className={`btn btn-outline-dark ${
              activeTab === "products" ? "active" : ""
            }`}
            onClick={() => setActiveTab("products")}
          >
            📦 Products
          </button>
          <button
            className={`btn btn-outline-dark ${
              activeTab === "team" ? "active" : ""
            }`}
            onClick={() => setActiveTab("team")}
          >
            👥 Team
          </button>
        </div>

        {/* Products Table */}
        {activeTab === "products" && (
          <div className="mt-4">
            <h5>Products in this Order</h5>
            {products.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-striped table-bordered rounded">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>Product Name</th>
                      <th>Quantity</th>
                      <th>Unit Price (₹)</th>
                      <th>Total Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod, idx) => (
                      <tr key={prod.id || idx}>
                        <td>{idx + 1}</td>
                        <td>{prod.name || "N/A"}</td>
                        <td>{prod.quantity || 0}</td>
                        <td>{prod.unitPrice || 0}</td>
                        <td>{(prod.quantity || 0) * (prod.unitPrice || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted">No products found in this invoice.</p>
            )}
          </div>
        )}

        {/* Team Card */}
        {activeTab === "team" && (
          <div className="mt-4">
            <h5>Team Members</h5>
            <div className="row">
              {normalizedTeamMembers.length > 0 ? (
                normalizedTeamMembers.map((member, idx) => (
                  <div key={idx} className="col-md-4 mb-3">
                    <div className="card h-100 shadow-sm border rounded-3">
                      <div className="card-body">
                        <h6 className="fw-bold">{member.name}</h6>
                        <p className="text-muted mb-1">
                          <strong>Role:</strong> {member.role}
                        </p>
                        <p className="text-muted mb-0">
                          <strong>Email:</strong> {member.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted">
                  {order.assignedTo
                    ? "No team members found for this team."
                    : "No team assigned to this order."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      {showEditModal && (
        <AddNewOrder
          show={showEditModal}
          handleClose={handleModalClose}
          order={selectedOrder}
        />
      )}
    </div>
  );
};

export default OrderWithInvoice;
