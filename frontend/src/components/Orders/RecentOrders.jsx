import React, { useState, useEffect } from "react";
import PageHeader from "../Common/PageHeader";
import {
  useGetAllOrdersQuery,
  useDeleteOrderMutation,
} from "../../api/orderApi";
import {
  useGetAllInvoicesQuery,
  useGetInvoiceByIdQuery,
} from "../../api/invoiceApi"; // ✅ import invoice hook
import { useDeleteCustomerMutation } from "../../api/customerApi";
import ViewOrderModal from "./ViewOrderModal";
import EditOrderModal from "./EditOrderModal";
import DeleteModal from "../Common/DeleteModal";
import { useGetAllTeamsQuery } from "../../api/teamApi"; // 👈 Make sure this path is correct
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // import styles
const RecentOrders = () => {
  const { data, error, isLoading } = useGetAllOrdersQuery();
  const recentOrder = data?.orders || [];

  const [invoicesMap, setInvoicesMap] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState("");
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteCustomer] = useDeleteCustomerMutation();

  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deleteOrder] = useDeleteOrderMutation();

  const { data: invoiceData } = useGetAllInvoicesQuery();
  const invoice = invoiceData?.data;
  const openModal = (order, type) => {
    setSelectedOrder(order);
    setModalType(type);
  };
  const { data: teamsData } = useGetAllTeamsQuery();
  const teamMap = {};
  teamsData?.teams?.forEach((team) => {
    teamMap[team.id] = team.name;
  });

  // ✅ Load all invoices after orders are fetched
  useEffect(() => {
    const fetchInvoices = async () => {
      const invoiceIds = [
        ...new Set(recentOrder.map((o) => o.invoiceId).filter(Boolean)),
      ];
      const invoicePromises = invoiceIds.map(async (id) => {
        try {
          const { data } = await invoice(id, {
            skip: !id,
          }).refetch();
          return { id, invoiceNo: data?.invoice?.invoiceNo || "—" };
        } catch {
          return { id, invoiceNo: "—" };
        }
      });

      const results = await Promise.all(invoicePromises);
      const invoiceMap = {};
      results.forEach(({ id, invoiceNo }) => {
        invoiceMap[id] = invoiceNo;
      });

      setInvoicesMap(invoiceMap);
    };

    if (recentOrder.length > 0) {
      fetchInvoices();
    }
  }, [recentOrder]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error fetching recent Orders.</p>;
  if (recentOrder.length === 0) return <p>No recent Orders available.</p>;
  const handleDelete = (orderId) => {
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      await deleteOrder(orderToDelete).unwrap();
      toast.success("Order deleted successfully!"); // Success toast
    } catch (err) {
      toast.error("Error deleting order!"); // Error toast
      console.error("Error deleting order:", err);
    } finally {
      setShowDeleteModal(false);
      setOrderToDelete(null);
    }
  };

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
                    <th className="no-sort">
                      <label className="checkboxs">
                        <input type="checkbox" id="select-all" />
                        <span className="checkmarks"></span>
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
                    <th>Invoice Attached</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrder.map((order, index) => (
                    <tr key={order.id || index}>
                      <td>
                        <label className="checkboxs">
                          <input type="checkbox" />
                          <span className="checkmarks"></span>
                        </label>
                      </td>
                      <td>{order.title}</td>
                      <td>{order.pipeline}</td>
                      <td>{order.status}</td>
                      <td>{order.dueDate}</td>
                      <td>{teamMap[order.assignedTo] || "—"}</td>

                      <td>{order.followupDates.join(", ")}</td>
                      <td>{order.source}</td>
                      <td>
                        <span className="badge badge-success">
                          {order.priority}
                        </span>
                      </td>
                      <td>{order.description}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>{invoicesMap[order.invoiceId] || "—"}</td>
                      <td className="text-center">
                        <a
                          className="action-set"
                          href="#"
                          data-bs-toggle="dropdown"
                          aria-expanded="true"
                        >
                          <i
                            className="fa fa-ellipsis-v"
                            aria-hidden="true"
                          ></i>
                        </a>
                        <ul className="dropdown-menu">
                          <li>
                            <a
                              href="#"
                              className="dropdown-item"
                              onClick={() => openModal(order, "view")}
                            >
                              <i data-feather="eye" className="info-img"></i>{" "}
                              View Order
                            </a>
                          </li>
                          <li>
                            <a
                              href="#"
                              className="dropdown-item"
                              onClick={() => openModal(order, "edit")}
                            >
                              <i data-feather="edit" className="info-img"></i>{" "}
                              Edit Order
                            </a>
                          </li>
                          <li>
                            <a
                              href={`/invoices/${order.invoiceId}`}
                              className="dropdown-item"
                            >
                              <i
                                data-feather="dollar-sign"
                                className="info-img"
                              ></i>{" "}
                              Show Invoice
                            </a>
                          </li>
                          <li>
                            <a
                              href="#"
                              className="dropdown-item"
                              onClick={() => handleDelete(order.id)}
                            >
                              <i
                                data-feather="trash-2"
                                className="info-img"
                              ></i>{" "}
                              Delete Order
                            </a>
                          </li>
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalType === "view" && selectedOrder && (
        <ViewOrderModal
          order={selectedOrder}
          onClose={() => setModalType("")}
        />
      )}

      {modalType === "edit" && selectedOrder && (
        <EditOrderModal
          order={selectedOrder}
          onClose={() => setModalType("")}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          itemType="Order"
          isVisible={showDeleteModal}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default RecentOrders;
