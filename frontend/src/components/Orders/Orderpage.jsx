import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetTeamByIdQuery } from "../../api/teamApi";
import {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
} from "../../api/customerApi";
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

// CommentRow Component
const CommentRow = ({ comment, onDelete, currentUserId }) => {
  const isCurrentUser = comment.userId === currentUserId;
  const userInitial = comment.user?.name
    ? comment.user.name[0].toUpperCase()
    : "U";

  return (
    <div
      className={`d-flex mb-3 ${
        isCurrentUser ? "justify-content-end" : "justify-content-start"
      } chat-bubble`}
    >
      <div
        className={`d-flex align-items-start ${
          isCurrentUser ? "flex-row-reverse" : ""
        }`}
        style={{ maxWidth: "70%" }}
      >
        {/* Avatar */}
        <div
          className="avatar bg-secondary text-white"
          style={{ fontSize: "1.2rem" }}
        >
          {userInitial}
        </div>
        {/* Chat Bubble */}
        <div
          className={`card border-0 shadow-sm ${
            isCurrentUser ? "bg-primary text-white" : "bg-light"
          }`}
        >
          <div className="card-body">
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
    if (!order.assignedTo || !teamData?.teams) return [];
    const teamIds = order.assignedTo.split(",").map((id) => id.trim());
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
  }, [order.assignedTo, teamData]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
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

    try {
      const formData = new FormData();
      formData.append("invoice", invoiceFile);
      const response = await uploadInvoice({ orderId: id, formData }).unwrap();

      setInvoiceFile(null);
      document.getElementById("invoiceUpload").value = null;
      refetchOrder();
    } catch (err) {
      toast.error(
        `Upload error: ${err.data?.message || "Failed to upload invoice"}`
      );
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

  // Construct PDF URL
  const pdfUrl =
    order.status === "INVOICE" && order.invoiceLink && order.invoiceLink !== ""
      ? order.invoiceLink.startsWith("http")
        ? order.invoiceLink
        : `${process.env.REACT_APP_FTP_BASE_URL}${order.invoiceLink}`
      : null;

  // Redirect to login if not authenticated
  if (profileError && profileError.status === 401) {
    toast.error("Please log in to access this page.");
    navigate("/login");
    return null;
  }

  if (profileLoading || orderLoading || teamLoading) {
    return (
      <div
        className="page-wrapper notes-page-wrapper d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <Spinner animation="border" /> <span className="ms-2">Loading...</span>
      </div>
    );
  }

  if (profileError || orderError || teamError) {
    return (
      <div
        className="page-wrapper notes-page-wrapper d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <Alert variant="danger">
          {profileError?.data?.message ||
            orderError?.data?.message ||
            teamError?.data?.message ||
            "Error loading data. Please try again."}
        </Alert>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* Page Header */}
        <div className="page-header d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-4">
          <div className="page-title">
            <h4 className="mb-2">Orders</h4>
            <h6 className="text-muted mb-0">Manage your orders</h6>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate("/orders/list")}
            className="mt-2 mt-sm-0"
          >
            Back to Orders
          </Button>
        </div>

        <div className="row g-4">
          {/* Order Details Card */}
          <div className="col-lg-6 col-md-12">
            <div className="card border-0 rounded-3 shadow-sm">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
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
                    <Dropdown.Item onClick={handleHoldOrder}>
                      Put on Hold
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-6">
                    <small className="text-muted d-block mb-1">Title</small>
                    <p className="fw-semibold mb-0">{order.title || "N/A"}</p>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block mb-1">Status</small>
                    <span className="badge bg-info text-white">
                      {order.status || "N/A"}
                    </span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block mb-1">Customer</small>
                    <p className="mb-0">
                      {order.createdFor
                        ? customerMap[order.createdFor] || "Loading..."
                        : "N/A"}
                    </p>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block mb-1">Due Date</small>
                    <p className="mb-0">
                      {order.dueDate
                        ? new Date(order.dueDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block mb-1">Priority</small>
                    <span className="badge bg-warning text-dark">
                      {order.priority || "N/A"}
                    </span>
                  </div>
                  <div className="col-12">
                    <small className="text-muted d-block mb-1">
                      Description
                    </small>
                    <p className="mb-0">{order.description || "N/A"}</p>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block mb-1">
                      Assigned To
                    </small>
                    <p className="mb-0">
                      {order.assignedTo
                        ? teamMap[order.assignedTo] || "—"
                        : "—"}
                    </p>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block mb-1">Pipeline</small>
                    <p className="mb-0">{order.pipeline || "N/A"}</p>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block mb-1">Source</small>
                    <p className="mb-0">{order.source || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Upload and Viewer */}
          <div className="col-lg-6 col-md-12">
            <div className="card border-0 rounded-3 shadow-sm">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">📄 Invoice</h5>
              </div>
              <div className="card-body">
                {/* Invoice Upload Form */}
                {/* Invoice Upload Form */}
                <Form onSubmit={handleInvoiceFormSubmit} className="mb-4">
                  <Form.Group controlId="invoiceUpload" className="mb-3">
                    <Form.Label>Upload Invoice (PDF only)</Form.Label>
                    <Form.Control
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      disabled={isUploading} // Only disable during upload
                      className="rounded-3"
                      aria-describedby="invoiceUploadHelp"
                    />
                    <Form.Text id="invoiceUploadHelp" muted>
                      Upload a PDF invoice.
                    </Form.Text>
                  </Form.Group>
                  <Button
                    type="submit"
                    variant="primary"
                    className="rounded-3"
                    disabled={!invoiceFile || isUploading} // Disable if no file or uploading
                  >
                    {isUploading ? (
                      <Spinner animation="border" size="sm" className="me-2" />
                    ) : null}
                    Upload Invoice
                  </Button>
                </Form>
                {/* Invoice Display */}
                {/* Invoice Display */}
                {order.invoiceLink && order.invoiceLink !== "" ? (
                  <div className="d-flex align-items-center p-3 border rounded-3 bg-light shadow-sm">
                    <span
                      style={{
                        fontSize: "2rem",
                        color: "#d9534f",
                        marginRight: "10px",
                      }}
                    >
                      📄
                    </span>
                    <div style={{ flexGrow: 1 }}>
                      <strong>
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary"
                        >
                          {order.invoiceLink.split("/").pop() || "Invoice.pdf"}
                        </a>
                      </strong>
                      <div
                        className="text-muted"
                        style={{ fontSize: "0.85rem" }}
                      >
                        PDF Document
                      </div>
                    </div>
                    <Button
                      variant="outline-primary"
                      className="rounded-3"
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
                ) : (
                  <Alert variant="warning" className="rounded-3">
                    No invoice uploaded for this order.
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-5">
          <h5 className="mb-3">Comments</h5>
          <div className="chat-container card border-0 rounded-3 shadow-sm">
            {commentLoading ? (
              <div className="text-center p-3">
                <Spinner animation="border" size="sm" /> Loading comments...
              </div>
            ) : commentError ? (
              <Alert variant="danger" className="text-center m-3 rounded-3">
                Unable to load comments:{" "}
                {commentError?.data?.message || "Please try again later."}
              </Alert>
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
              <p className="text-muted text-center p-3 mb-0">
                No comments found for this order.
              </p>
            )}
          </div>

          {/* Comment Input Form */}
          {!user.userId ? (
            <Alert variant="warning" className="mt-3 rounded-3">
              You must be logged in to add comments.{" "}
              <Button
                variant="link"
                onClick={() => navigate("/login")}
                className="p-0 text-primary"
              >
                Log in
              </Button>
            </Alert>
          ) : (
            <Form onSubmit={handleAddComment} className="mt-3 comment-input">
              <div className="d-flex align-items-center">
                <Form.Control
                  as="textarea"
                  rows={1}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type your comment here..."
                  maxLength={1000}
                  className="rounded-3 me-2"
                  style={{ resize: "none", borderColor: "#ced4da" }}
                  aria-describedby="commentHelp"
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="rounded-3"
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
            <div className="d-flex justify-content-between align-items-center mt-3">
              <Button
                variant="outline-secondary"
                className="rounded-3"
                disabled={commentPage === 1}
                onClick={() => handlePageChange(commentPage - 1)}
                aria-label="Previous comments page"
              >
                Previous
              </Button>
              <span className="text-muted">
                Page {commentPage} of {Math.ceil(totalComments / commentLimit)}
              </span>
              <Button
                variant="outline-secondary"
                className="rounded-3"
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
      </div>
    </div>
  );
};

export default OrderPage;
