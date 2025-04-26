import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../Common/PageHeader";
import {
  useGetAllOrdersQuery,
  useDeleteOrderMutation,
} from "../../api/orderApi";
import { useGetAllInvoicesQuery } from "../../api/invoiceApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import DeleteModal from "../Common/DeleteModal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DatesModal from "./DateModal";

const RecentOrders = () => {
  const navigate = useNavigate();
  const { data, error, isLoading } = useGetAllOrdersQuery();
  const recentOrders = data?.orders || [];

  const [invoicesMap, setInvoicesMap] = useState({});
  const [teamMap, setTeamMap] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleteOrder] = useDeleteOrderMutation();

  const [showDatesModal, setShowDatesModal] = useState(false);
  const [selectedDates, setSelectedDates] = useState({
    dueDate: null,
    followupDates: [],
  });

  const { data: invoiceData } = useGetAllInvoicesQuery();
  const { data: teamsData } = useGetAllTeamsQuery();

  // Build invoiceId -> invoiceNo map
  useEffect(() => {
    if (invoiceData?.data) {
      const map = {};
      invoiceData.data.forEach((inv) => {
        map[inv.invoiceId] = inv.invoiceNo || "—";
      });
      setInvoicesMap(map);
    }
  }, [invoiceData]);

  // Build teamId -> teamName map
  useEffect(() => {
    if (teamsData?.teams) {
      const map = {};
      teamsData.teams.forEach((team) => {
        map[team.id] = team.teamName || "—";
      });
      setTeamMap(map);
    }
  }, [teamsData]);

  const handleDelete = (orderId) => {
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      await deleteOrder(orderToDelete).unwrap();
      toast.success("Order deleted successfully!");
    } catch (err) {
      toast.error("Error deleting order!");
      console.error("Error deleting order:", err);
    } finally {
      setShowDeleteModal(false);
      setOrderToDelete(null);
    }
  };

  const handleShowDates = (dueDate, followupDates) => {
    setSelectedDates({ dueDate, followupDates });
    setShowDatesModal(true);
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching recent orders.</p>;
  if (recentOrders.length === 0) return <p>No recent orders available.</p>;

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Recent Orders"
          subtitle="Manage your recent orders"
        />
        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table datatable">
                <thead className="thead-light">
                  <tr>
                    <th>
                      <label className="checkboxs">
                        <input type="checkbox" />
                        <span className="checkmarks" />
                      </label>
                    </th>
                    <th>Title</th>
                    <th>Pipeline</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Team Assigned</th>
                    <th>Follow up Dates</th>
                    <th>Source</th>
                    <th>Priority</th>
                    <th>Description</th>
                    <th>Created At</th>
                    <th>Invoice</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => (
                    <tr key={order.id || index}>
                      <td>
                        <label className="checkboxs">
                          <input type="checkbox" />
                          <span className="checkmarks" />
                        </label>
                      </td>
                      <td>{order.title}</td>
                      <td>{order.pipeline}</td>
                      <td>{order.status}</td>
                      <td>{order.dueDate}</td>
                      <td>
                        {order.assignedTo
                          ? teamMap[order.assignedTo] || "—"
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() =>
                            handleShowDates(order.dueDate, order.followupDates)
                          }
                        >
                          View Dates
                        </button>
                      </td>
                      <td>{order.source}</td>
                      <td>{order.priority}</td>
                      <td>{order.description}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        {order.invoiceId
                          ? invoicesMap[order.invoiceId] || "—"
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary me-1"
                          onClick={() => navigate(`/order/${order.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(order.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ToastContainer />
              <DeleteModal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
              />
              <DatesModal
                show={showDatesModal}
                onClose={() => setShowDatesModal(false)}
                dates={selectedDates}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentOrders;
