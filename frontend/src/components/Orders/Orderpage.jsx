import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetTeamByIdQuery } from "../../api/teamApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import {
  useGetOrderDetailsQuery,
  useAddCommentMutation,
  useGetCommentsQuery,
  useDeleteCommentMutation,
  useDeleteOrderMutation,
  useUpdateOrderStatusMutation,
  useUploadInvoiceMutation,
  orderApi,
} from "../../api/orderApi";
import { useGetAllTeamsQuery } from "../../api/teamApi";
import { useGetProfileQuery } from "../../api/userApi";
import { Dropdown, Form, Button, Spinner, Alert } from "react-bootstrap";
import { BsThreeDotsVertical } from "react-icons/bs";
import { toast } from "sonner";
import AddNewOrder from "./AddNewOrder";
import { Document, Page, pdfjs } from "react-pdf";

// Dynamically use the pdfjs version installed with react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

const CommentRow = ({ comment, onDelete, currentUserId }) => {
  const isCurrentUser = comment.userId === currentUserId;
  const userInitial = comment.user?.name
    ? comment.user.name[0].toUpperCase()
    : "U";

  return (
    <div
      className={`d-flex mb-3 ${
        isCurrentUser ? "justify-content-end" : "justify-content-start"
      }`}
    >
      <div
        className={`d-flex align-items-start ${
          isCurrentUser ? "flex-row-reverse" : ""
        }`}
        style={{ maxWidth: "70%" }}
      >
        {/* Avatar */}
        <div
          className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2"
          style={{ width: "40px", height: "40px", fontSize: "1.2rem" }}
        >
          {userInitial}
        </div>
        {/* Chat Bubble */}
        <div
          className={`p-3 rounded-3 shadow-sm ${
            isCurrentUser ? "bg-primary text-white" : "bg-light border"
          }`}
          style={{
            borderRadius: isCurrentUser
              ? "15px 15px 0 15px"
              : "15px 15px 15px 0",
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-1">
            <strong>{comment.user?.name || "Unknown User"}</strong>
            {isCurrentUser && (
              <Button
                variant="link"
                className={`p-0 ${
                  isCurrentUser ? "text-white" : "text-danger"
                }`}
                onClick={() => onDelete(comment._id)}
                aria-label={`Delete comment by ${
                  comment.user?.username || "user"
                }`}
              >
                Delete
              </Button>
            )}
          </div>
          <p className="mb-1">{comment.comment}</p>
          <small
            className={`text-muted ${isCurrentUser ? "text-white-50" : ""}`}
          >
            {new Date(comment.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {" • "}
            {new Date(comment.createdAt).toLocaleDateString()}
          </small>
        </div>
      </div>
    </div>
  );
};

const OrderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customerMap, setCustomerMap] = useState({});
  const [deleteOrder] = useDeleteOrderMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [addComment] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [uploadInvoice, { isLoading: isUploading }] =
    useUploadInvoiceMutation();
  const [teamMap, setTeamMap] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [commentPage, setCommentPage] = useState(1);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [pdfPageNum, setPdfPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const commentLimit = 10;

  // Fetch current user profile
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const user = profileData?.user || {};
  const { data: customersData } = useGetCustomersQuery();
  // Fetch order details
  const {
    data: orderData,
    isLoading: orderLoading,
    error: orderError,
    refetch: refetchOrder,
  } = useGetOrderDetailsQuery(id);
  const order = orderData?.order || {};

  // Debug order data
  useEffect(() => {
    console.log("Order data updated:", orderData);
    console.log("Order status:", order?.status);
    console.log("Order invoiceLink:", order?.invoiceLink);
  }, [orderData]);

  // Fetch comments
  const {
    data: commentData,
    isLoading: commentLoading,
    error: commentError,
  } = useGetCommentsQuery(
    {
      resourceId: id,
      resourceType: "Order",
      page: commentPage,
      limit: commentLimit,
    },
    { skip: !id }
  );

  // Fetch customer
  const { data: customerData } = useGetCustomerByIdQuery(order.createdFor, {
    skip: !order.createdFor,
  });
  const {
    data: teamData,
    isLoading: teamLoading,
    error: teamError,
  } = useGetAllTeamsQuery();
  // Fetch team
  const teamIds = useMemo(
    () =>
      order.assignedTo
        ? order.assignedTo.split(",").map((id) => id.trim())
        : [],
    [order.assignedTo]
  );

  // Parse comments
  const comments = useMemo(() => commentData?.comments || [], [commentData]);
  const totalComments = commentData?.totalCount || 0;

  // Maps for customer, user, and team
  useEffect(() => {
    if (customersData?.data) {
      const map = customersData.data.reduce((acc, customer) => {
        acc[customer.customerId] = customer.name || "—";
        return acc;
      }, {});
      setCustomerMap(map);
    }
  }, [customersData]);
  useEffect(() => {
    if (teamData?.teams) {
      const map = teamData.teams.reduce((acc, team) => {
        acc[team.id] = team.teamName || "—";
        return acc;
      }, {});
      setTeamMap(map);
    }
  }, [teamData]);

  const userMap = useMemo(() => {
    const map = {};
    if (teamData?.teams) {
      teamData.teams.forEach((team) => {
        team.teammembers.forEach((member) => {
          map[member.userId] = member.userName;
        });
      });
    }
    return map;
  }, [teamData]);

  const normalizedTeamMembers = useMemo(() => {
    if (!teamIds.length || !teamData?.teams) return [];
    return teamIds
      .map((teamId) => {
        const team = teamData.teams.find((t) => t.id === teamId);
        if (!team) return null;
        return {
          teamId: team.id,
          teamName: team.teamName || "Unknown Team",
          members: team.teammembers.map((member) => ({
            name: member.userName || "Unknown",
            role: member.roleName || "N/A",
            email: member.email || "N/A",
          })),
        };
      })
      .filter((team) => team !== null);
  }, [teamIds, teamData]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      console.log("Selected file:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      setInvoiceFile(file);
    } else {
      toast.error("Please upload a valid PDF file.");
    }
  };

  // Handle invoice upload form submission
  const handleInvoiceFormSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceFile) {
      toast.error("Please select a PDF file to upload.");
      return;
    }
    if (!id) {
      toast.error("Order ID is missing.");
      return;
    }
    console.log("Submitting invoice for orderId:", id);
    try {
      const response = await handleUploadInvoice(id, invoiceFile);
      console.log("Upload response:", response);
      setInvoiceFile(null);
      document.getElementById("invoiceUpload").value = null;
    } catch (err) {
      // Error is handled in handleUploadInvoice
    }
  };

  const handleUploadInvoice = async (orderId, file) => {
    try {
      const formData = new FormData();
      formData.append("invoice", file);

      console.log("Uploading file:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      const response = await uploadInvoice({ orderId, formData }).unwrap();
      console.log("Upload response:", response);

      // Optimistically update the cache
      orderApi.util.updateQueryData("getOrderDetails", orderId, (draft) => {
        if (response.order?.invoiceLink) {
          draft.order.invoiceLink = response.order.invoiceLink;
        }
      });

      toast.success("Invoice uploaded successfully");
      refetchOrder();
      return response;
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(
        `Upload error: ${err.data?.message || "Failed to upload invoice"}`
      );
      throw err;
    }
  };

  // PDF viewer controls
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPdfPageNum(1);
  };

  const handleEditOrder = () => {
    navigate(`/order/${order.id}/edit`, { state: { order } });
  };

  const handleDeleteOrder = async () => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await deleteOrder(id).unwrap();
        toast.success("Order deleted successfully");
        navigate("/orders/list");
      } catch (err) {
        toast.error(
          `Failed to delete order: ${err?.data?.message || "Unknown error"}`
        );
      }
    }
  };

  const handleHoldOrder = async () => {
    try {
      await updateOrderStatus({ id, status: "ONHOLD" }).unwrap();
      toast.success("Order put on hold");
      refetchOrder();
    } catch (err) {
      toast.error(
        `Failed to update order status: ${
          err?.data?.message || "Unknown error"
        }`
      );
    }
  };

  const handleModalClose = () => {
    setSelectedOrder(null);
    setShowEditModal(false);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    if (!user.userId) {
      toast.error("User profile not loaded. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      await addComment({
        resourceId: id,
        resourceType: "Order",
        userId: user.userId,
        comment: newComment,
      }).unwrap();
      toast.success("Comment added successfully");
      setNewComment("");
    } catch (err) {
      const errorMessage =
        err?.data?.message || "Failed to add comment. Please try again.";
      if (errorMessage.includes("maximum of 3 comments")) {
        toast.error(
          "You have reached the maximum of 3 comments for this order."
        );
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!user.userId) {
      toast.error("User profile not loaded. Please log in again.");
      navigate("/login");
      return;
    }
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        await deleteComment({ commentId, userId: user.userId }).unwrap();
        toast.success("Comment deleted successfully");
      } catch (err) {
        toast.error(
          `Failed to delete comment: ${err?.data?.message || "Unknown error"}`
        );
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(totalComments / commentLimit)) {
      setCommentPage(newPage);
    }
  };

  // Redirect to login if not authenticated
  if (profileError && profileError.status === 401) {
    toast.error("Please log in to access this page.");
    navigate("/login");
    return null;
  }

  if (profileLoading || orderLoading || teamLoading) {
    return (
      <div className="page-wrapper notes-page-wrapper">
        <div className="content text-center">
          <Spinner animation="border" /> Loading...
        </div>
      </div>
    );
  }

  if (profileError || orderError || teamError) {
    return (
      <div className="page-wrapper notes-page-wrapper">
        <div className="content text-center">
          <p className="text-danger">
            {profileError?.data?.message ||
              orderError?.data?.message ||
              teamError?.data?.message ||
              "Error loading data. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  // Construct PDF URL
  const pdfUrl =
    order.status === "INVOICE" && order.invoiceLink && order.invoiceLink !== ""
      ? order.invoiceLink.startsWith("http")
        ? order.invoiceLink
        : `${process.env.REACT_APP_FTP_BASE_URL}${order.invoiceLink}`
      : null;
  console.log("PDF URL:", pdfUrl);

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
                  <Dropdown.Toggle
                    variant="link"
                    className="text-white p-0"
                    aria-label="Order actions"
                  >
                    <BsThreeDotsVertical />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={handleEditOrder}>
                      Edit
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
                        ? customerMap[order.createdFor] || "Loading..."
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
                        ? teamMap[order.assignedTo] || "—"
                        : "—"}
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
              </div>
            </div>
          </div>

          {/* Invoice Upload and Viewer */}
          <div className="col-md-6">
            <div className="card border rounded-4 shadow-sm">
              <div className="card-header bg-success text-white rounded-top-4">
                <h5 className="mb-0">📄 Invoice</h5>
              </div>
              <div className="card-body">
                {/* Invoice Upload Form */}
                <Form onSubmit={handleInvoiceFormSubmit} className="mb-4">
                  <Form.Group controlId="invoiceUpload">
                    <Form.Label>Upload Invoice (PDF only)</Form.Label>
                    <Form.Control
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      disabled={order.status !== "INVOICE" || isUploading}
                      aria-describedby="invoiceUploadHelp"
                    />
                    <Form.Text id="invoiceUploadHelp" muted>
                      Upload a PDF invoice. Available only when order status is
                      INVOICE.
                    </Form.Text>
                  </Form.Group>
                  <Button
                    type="submit"
                    variant="primary"
                    className="mt-2"
                    disabled={
                      !invoiceFile || order.status !== "INVOICE" || isUploading
                    }
                  >
                    {isUploading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      "Upload Invoice"
                    )}
                  </Button>
                </Form>

                {/* PDF Viewer */}
                {/* Invoice Card Style (WhatsApp-like) */}
                {order.status === "INVOICE" &&
                order.invoiceLink &&
                order.invoiceLink !== "" ? (
                  <div
                    className="d-flex align-items-center p-3 border rounded-3 bg-light"
                    style={{ gap: "10px" }}
                  >
                    <div
                      style={{
                        fontSize: "2rem",
                        color: "#d9534f",
                      }}
                    >
                      📄
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <strong>
                        <a href={order.invoiceLink} target="_blank">
                          {" "}
                          {order.invoiceLink.split("/").pop() || "Invoice.pdf"}
                        </a>
                      </strong>
                      <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>
                        PDF Document
                      </div>
                    </div>
                    <Button
                      variant="outline-primary"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = pdfUrl;
                        link.download =
                          order.invoiceLink.split("/").pop() || "invoice.pdf";
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      Download
                    </Button>
                  </div>
                ) : order.status === "INVOICE" ? (
                  <Alert variant="warning">
                    No invoice uploaded for this order.
                  </Alert>
                ) : (
                  <p className="text-muted">
                    Invoice viewer available when order status is INVOICE.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <h5>Comments</h5>
          <div
            className="border rounded-4 p-3 bg-white shadow-sm"
            style={{ maxHeight: "400px", overflowY: "auto" }}
          >
            {commentLoading ? (
              <p className="text-center">
                <Spinner animation="border" size="sm" /> Loading comments...
              </p>
            ) : commentError ? (
              <p className="text-danger text-center">
                Unable to load comments:{" "}
                {commentError?.data?.message || "Please try again later."}
              </p>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <CommentRow
                  key={comment._id}
                  comment={comment}
                  onDelete={handleDeleteComment}
                  currentUserId={user.userId}
                />
              ))
            ) : (
              <p className="text-muted text-center">
                No comments found for this order.
              </p>
            )}
          </div>

          {/* Comment Input Form */}
          {!user.userId ? (
            <p className="text-warning mt-3">
              You must be logged in to add comments.{" "}
              <Button
                variant="link"
                onClick={() => navigate("/login")}
                className="p-0"
              >
                Log in
              </Button>
            </p>
          ) : (
            <Form onSubmit={handleAddComment} className="mt-3">
              <div className="d-flex align-items-center">
                <Form.Control
                  as="textarea"
                  rows={1}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your comment here..."
                  maxLength={1000}
                  className="border rounded-3 me-2"
                  style={{ resize: "none" }}
                  aria-describedby="commentHelp"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!newComment.trim()}
                >
                  Send
                </Button>
              </div>
              <Form.Text id="commentHelp" muted>
                Maximum 1000 characters. You can add up to 3 comments per order.
              </Form.Text>
            </Form>
          )}

          {/* Pagination */}
          {comments.length > 0 && (
            <div className="d-flex justify-content-between mt-3">
              <Button
                variant="outline-secondary"
                disabled={commentPage === 1}
                onClick={() => handlePageChange(commentPage - 1)}
                aria-label="Previous comments page"
              >
                Previous
              </Button>
              <span>
                Page {commentPage} of {Math.ceil(totalComments / commentLimit)}
              </span>
              <Button
                variant="outline-secondary"
                disabled={
                  commentPage >= Math.ceil(totalComments / commentLimit)
                }
                onClick={() => handlePageChange(commentPage + 1)}
                aria-label="Next comments page"
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {showEditModal && (
          <AddNewOrder
            adminName={user.name || "Admin"}
            orderId={selectedOrder?.id}
            onClose={handleModalClose}
          />
        )}
      </div>
    </div>
  );
};

export default OrderPage;
