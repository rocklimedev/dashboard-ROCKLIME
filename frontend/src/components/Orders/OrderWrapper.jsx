import React, { useState, useMemo, useEffect } from "react";
import PageHeader from "../Common/PageHeader";
import OrderPagination from "./OrderPagination";
import OrderFilter from "./OrderFilter";
import AddNewOrder from "./AddNewOrder";
import ShowInvoices from "./ShowInvoices";
import {
  useGetFilteredOrdersQuery,
  useGetAllOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderByIdMutation,
  useDeleteOrderMutation,
} from "../../api/orderApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DatesModal from "./DateModal";
import OrderItem from "./Orderitem";
import { useTeamDataMap } from "../../data/useTeamDataMap";
import OnHoldModal from "./OnHoldOrder";
import DeleteModal from "../Common/DeleteModal";
const OrderWrapper = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [showModal, setShowModal] = useState(false);
  const [teamMap, setTeamMap] = useState({});
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false); // For DeleteModal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null); // For DeleteModal
  const [showDatesModal, setShowDatesModal] = useState(false);
  const { data: teamsData } = useGetAllTeamsQuery();
  const [selectedDates, setSelectedDates] = useState({
    dueDate: null,
    followupDates: [],
  });

  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    important: false,
    trash: false,
    page: 1,
    limit: 10,
  });

  const isFiltered = useMemo(() => {
    return (
      filters.status !== "" ||
      filters.priority !== "" ||
      filters.important ||
      filters.trash
    );
  }, [filters]);

  const cleanFilters = useMemo(() => {
    const { status, priority, important, trash, page, limit } = filters;
    return {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(important && { important }),
      ...(trash && { trash }),
      page,
      limit,
    };
  }, [filters]);

  const {
    data: filteredData,
    error: filteredError,
    isLoading: filteredLoading,
    isFetching: filteredFetching,
  } = useGetFilteredOrdersQuery(cleanFilters, {
    skip: !isFiltered,
  });

  const {
    data: allData,
    error: allError,
    isLoading: allLoading,
    isFetching: allFetching,
  } = useGetAllOrdersQuery(undefined, { skip: isFiltered });

  const orders = isFiltered
    ? filteredData?.orders || []
    : allData?.orders || [];
  const totalCount = isFiltered
    ? filteredData?.totalCount || 0
    : allData?.totalCount || 0;
  const isLoading = isFiltered ? filteredLoading : allLoading;
  const isFetching = isFiltered ? filteredFetching : allFetching;
  const error = isFiltered ? filteredError : allError;

  useEffect(() => {
    if (teamsData?.teams) {
      const map = teamsData.teams.reduce((acc, team) => {
        acc[team.id] = team.teamName || "—";
        return acc;
      }, {});
      setTeamMap(map);
    }
  }, [teamsData]);

  const [createOrder] = useCreateOrderMutation();
  const [updateOrder] = useUpdateOrderByIdMutation();
  const [deleteOrder] = useDeleteOrderMutation();

  const handleOpenModal = () => {
    setSelectedOrder(null);
    setShowModal(true);
  };

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleHoldClick = (order) => {
    setSelectedOrder(order);
    setShowHoldModal(true);
  };

  const handleDeleteClick = (orderId) => {
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setSelectedOrder(null);
    setShowModal(false);
    setShowHoldModal(false);
    setShowDeleteModal(false);
    setOrderToDelete(null);
  };

  const handleViewInvoice = (order) => {
    const invoiceId = order.invoiceId;
    if (invoiceId) {
      window.open(`/invoice/${invoiceId}`, "_blank");
    } else {
      toast.error("No invoice associated with this order.");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await deleteOrder(orderId).unwrap();
      toast.success("Order deleted successfully!");
      handleModalClose();
    } catch (err) {
      toast.error(
        `Failed to delete order: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const handleSaveOrder = async (orderData) => {
    try {
      if (selectedOrder) {
        await updateOrder({ id: selectedOrder.id, ...orderData }).unwrap();
        toast.success("Order updated successfully!");
      } else {
        await createOrder(orderData).unwrap();
        toast.success("Order created successfully!");
      }
      handleModalClose();
    } catch (err) {
      toast.error(
        `Failed to save order: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const handleConfirmHold = (reference) => {
    // Called after OnHoldModal updates the order to ONHOLD
    handleModalClose();
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleClearFilters = () => {
    const defaultFilters = {
      status: "",
      priority: "",
      important: false,
      trash: false,
      page: 1,
      limit: 10,
    };
    setFilters(defaultFilters);
    toast.success("Filters cleared!");
  };

  const handleOpenDatesModal = (dueDate, followupDates) => {
    setSelectedDates({ dueDate, followupDates });
    setShowDatesModal(true);
  };

  const handleCloseDatesModal = () => {
    setShowDatesModal(false);
    setSelectedDates({ dueDate: null, followupDates: [] });
  };

  const isDueDateClose = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= 3;
  };

  const uniqueTeamIds = useMemo(() => {
    return Array.from(
      new Set(orders.map((order) => order.assignedTo).filter(Boolean))
    );
  }, [orders]);

  const teamDataMap = useTeamDataMap(uniqueTeamIds);

  return (
    <div className="page-wrapper notes-page-wrapper">
      <div className="content">
        <div className="page-header page-add-notes border-0 flex-sm-row flex-column">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Orders & Invoices</h4>
              <h6 className="mb-0">Manage everything from here</h6>
            </div>
          </div>

          <ul className="nav nav-tabs">
            <li className="nav-item">
              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-primary" onClick={handleOpenModal}>
                  <i className="ti ti-plus me-2"></i>New Order
                </button>
              </div>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "orders" ? "active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                Orders
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "invoices" ? "active" : ""
                }`}
                onClick={() => setActiveTab("invoices")}
              >
                Invoices
              </button>
            </li>
          </ul>
        </div>

        {activeTab === "orders" ? (
          <div className="row">
            <div className="col-xl-3 col-md-12 sidebars-right theiaStickySidebar section-bulk-widget">
              <OrderFilter setFilters={setFilters} />
            </div>
            <div className="col-xl-9 budget-role-notes">
              <div className="border-bottom mb-4 pb-4">
                <h4>All Orders</h4>
              </div>

              {isLoading || isFetching ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger">
                  Error loading orders:{" "}
                  {error?.data?.message || error?.message || "Unknown error"}
                </div>
              ) : orders.length > 0 ? (
                <>
                  <div className="row">
                    {orders.map((order) => {
                      const teamName = order.assignedTo
                        ? teamMap[order.assignedTo] ||
                          teamDataMap[order.assignedTo]?.teamName ||
                          "—"
                        : "—";
                      const isTeamLoading = order.assignedTo
                        ? teamDataMap[order.assignedTo]?.isLoading || false
                        : false;
                      return (
                        <div className="col-md-6" key={order.id}>
                          <OrderItem
                            order={order}
                            teamName={teamName}
                            isTeamLoading={isTeamLoading}
                            onEditClick={handleEditClick}
                            onHoldClick={handleHoldClick}
                            onViewInvoice={handleViewInvoice}
                            onDeleteOrder={handleDeleteClick} // Updated to show DeleteModal
                            onOpenDatesModal={handleOpenDatesModal}
                            isDueDateClose={isDueDateClose}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {totalCount > filters.limit && (
                    <OrderPagination
                      currentPage={filters.page}
                      totalCount={totalCount}
                      pageSize={filters.limit}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              ) : (
                <p>No orders found.</p>
              )}
            </div>
          </div>
        ) : (
          <ShowInvoices />
        )}

        {showModal && (
          <AddNewOrder
            visible={showModal}
            onClose={handleModalClose}
            order={selectedOrder}
            onSave={handleSaveOrder}
          />
        )}
        {showHoldModal && (
          <OnHoldModal
            order={selectedOrder}
            invoice={{ amount: selectedOrder?.totalAmount || 0 }} // Dummy invoice data
            onClose={handleModalClose}
            onConfirm={handleConfirmHold}
          />
        )}
        {showDeleteModal && (
          <DeleteModal
            isVisible={showDeleteModal}
            item={orderToDelete}
            itemType="Order"
            onConfirm={handleDeleteOrder}
            onCancel={handleModalClose}
          />
        )}
        {showDatesModal && (
          <DatesModal
            show={showDatesModal}
            onHide={handleCloseDatesModal}
            dueDate={selectedDates.dueDate}
            followupDates={selectedDates.followupDates}
          />
        )}
      </div>
    </div>
  );
};

export default OrderWrapper;
