import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetTeamByIdQuery } from "../../api/teamApi";
import { useGetCustomerByIdQuery } from "../../api/customerApi";
import { useGetProductByIdQuery } from "../../api/productApi";
import { useGetInvoiceByIdQuery } from "../../api/invoiceApi";
import {
  useGetOrderDetailsQuery,
  useAddCommentMutation,
  useGetCommentsQuery,
  useDeleteCommentMutation,
  useDeleteOrderMutation,
  useUpdateOrderStatusMutation,
} from "../../api/orderApi";
import { useGetProfileQuery } from "../../api/userApi";
import {
  Dropdown,
  OverlayTrigger,
  Tooltip,
  Form,
  Button,
  Spinner,
} from "react-bootstrap";
import { BsThreeDotsVertical } from "react-icons/bs";
import { toast } from "sonner";
import AddNewOrder from "./AddNewOrder";

// ... (ProductRow and CommentRow components remain unchanged)
// Subcomponent to handle each product row
const ProductRow = ({ product, index }) => {
  const { data, isLoading, isError, error } = useGetProductByIdQuery(
    product.productId,
    { skip: !product.productId }
  );

  if (isError) {
    console.error(`Product Query Error for ID ${product.productId}:`, error);
  }

  const prod = data || {};
  const productName = prod.name || "Unknown Product";
  const productCode = prod.product_code || "—";
  const price = parseFloat(product.price || prod.sellingPrice || 0);
  const quantity = parseInt(product.quantity || 0);

  return (
    <tr key={product.productId || index}>
      <td>{index + 1}</td>
      <td>{isLoading ? "Loading..." : productName}</td>
      <td>{productCode}</td>
      <td>{quantity}</td>
      <td>{price.toFixed(2)}</td>
      <td>{(price * quantity).toFixed(2)}</td>
      {isError && (
        <td colSpan="6" className="text-danger">
          Error loading product: {error?.data?.message || "Unknown error"}
        </td>
      )}
    </tr>
  );
};

// Subcomponent to handle each comment
// CommentRow.jsx (from your provided code)
const CommentRow = ({ comment, onDelete, currentUserId }) => {
  const canDelete = comment.userId === currentUserId; // Only comment creator can delete
  return (
    <div className="card mb-2 shadow-sm border rounded-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <p className="mb-1">
              <strong>{comment.user?.name || "Unknown User"}</strong> (
              {comment.user?.username || "N/A"})
            </p>
            <p className="mb-1">{comment.comment}</p>
            <small className="text-muted">
              {new Date(comment.createdAt).toLocaleString()}
            </small>
          </div>
          {canDelete && (
            <Button
              variant="link"
              className="text-danger p-0"
              onClick={() => onDelete(comment._id)}
              aria-label={`Delete comment by ${
                comment.user?.username || "user"
              }`}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
const OrderWithInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("products");
  const [showInvoiceTooltip, setShowInvoiceTooltip] = useState(false);
  const [deleteOrder] = useDeleteOrderMutation();
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [addComment] = useAddCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [commentPage, setCommentPage] = useState(1);
  const commentLimit = 10;

  // Fetch current user profile
  const {
    data: profileData,
    isLoading: profileLoading,
    error: profileError,
  } = useGetProfileQuery();
  const user = profileData?.user || {};
  console.log("User data:", user); // Log for debugging

  const {
    data: orderData,
    isLoading: orderLoading,
    error: orderError,
  } = useGetOrderDetailsQuery(id);
  const order = orderData?.order || {};
  const invoiceId = order?.invoiceId;

  const {
    data: invoiceData,
    isLoading: invoiceLoading,
    error: invoiceError,
  } = useGetInvoiceByIdQuery(invoiceId, { skip: !invoiceId });

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
    { skip: !id } // Skip if id is not available
  );

  const teamIds = useMemo(
    () =>
      order.assignedTo
        ? order.assignedTo.split(",").map((id) => id.trim())
        : [],
    [order.assignedTo]
  );
  const {
    data: teamData,
    isLoading: teamLoading,
    error: teamError,
  } = useGetTeamByIdQuery(teamIds, { skip: !teamIds.length });

  const { data: customerData } = useGetCustomerByIdQuery(order.createdFor, {
    skip: !order.createdFor,
  });

  // Parse products
  const invoice = invoiceData?.data || {};
  const products = useMemo(() => {
    if (typeof invoice?.products === "string") {
      try {
        const parsed = JSON.parse(invoice.products);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error("Error parsing invoice.products:", e);
        return [];
      }
    }
    return Array.isArray(invoice?.products) ? invoice.products : [];
  }, [invoice?.products]);

  // Parse comments
  const comments = useMemo(() => commentData?.comments || [], [commentData]);
  const totalComments = commentData?.totalCount || 0;

  const customerMap = useMemo(() => {
    return customerData ? { [customerData.customerId]: customerData.name } : {};
  }, [customerData]);

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

  const teamMap = useMemo(() => {
    const map = {};
    if (teamData?.teams) {
      teamData.teams.forEach((team) => {
        map[team.id] = team.teamName;
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

  const handleEditOrder = () => {
    setSelectedOrder(order);
    setShowEditModal(true);
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
    } catch (err) {
      toast.error(
        `Failed to update order status: ${
          err?.data?.message || "Unknown error"
        }`
      );
    }
  };

  const handleInvoiceEdit = () => navigate(`/invoice/${invoiceId}`);

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
      console.error("Add comment error:", err);
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
        console.error("Delete comment error:", err);
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

  if (profileLoading || orderLoading || invoiceLoading || teamLoading) {
    return (
      <div className="page-wrapper notes-page-wrapper">
        <div className="content text-center">
          <Spinner animation="border" /> Loading...
        </div>
      </div>
    );
  }

  if (profileError || orderError || invoiceError || teamError) {
    return (
      <div className="page-wrapper notes-page-wrapper">
        <div className="content text-center">
          <p className="text-danger">
            {profileError?.data?.message ||
              orderError?.data?.message ||
              invoiceError?.data?.message ||
              teamError?.data?.message ||
              "Error loading data. Please try again."}
          </p>
        </div>
      </div>
    );
  }

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
                      {invoiceId
                        ? `Edit invoice at /invoice/${invoiceId}`
                        : "No invoice available to edit"}
                    </Tooltip>
                  }
                >
                  <button
                    className="btn btn-light btn-sm"
                    onMouseEnter={() => setShowInvoiceTooltip(true)}
                    onMouseLeave={() => setShowInvoiceTooltip(false)}
                    onClick={handleInvoiceEdit}
                    disabled={!invoiceId}
                    aria-disabled={!invoiceId}
                    aria-label="Edit invoice"
                  >
                    Edit Invoice
                  </button>
                </OverlayTrigger>
              </div>
              <div className="card-body">
                {invoiceLoading ? (
                  <p>
                    <Spinner animation="border" size="sm" /> Loading Invoice...
                  </p>
                ) : invoiceError ? (
                  <p className="text-danger">
                    Error fetching invoice:{" "}
                    {invoiceError?.data?.message || "Unknown error"}
                  </p>
                ) : !invoiceId ? (
                  <p className="text-muted">
                    No invoice associated with this order.
                  </p>
                ) : (
                  <div className="row">
                    <div className="col-6 mb-3">
                      <small className="text-muted">Invoice Number</small>
                      <p className="fw-semibold">
                        {invoice.invoiceNo || "N/A"}
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
                        {invoice.invoiceDate
                          ? new Date(invoice.invoiceDate).toLocaleDateString()
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
                        {invoice.status || "Unpaid"}
                      </span>
                    </div>
                    <div className="col-6 mb-3">
                      <small className="text-muted">Payment Mode</small>
                      <p>
                        {invoice.paymentMethod
                          ? JSON.parse(invoice.paymentMethod)?.method || "N/A"
                          : "N/A"}
                      </p>
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
            aria-pressed={activeTab === "products"}
          >
            📦 Products
          </button>
          <button
            className={`btn btn-outline-dark ${
              activeTab === "team" ? "active" : ""
            }`}
            onClick={() => setActiveTab("team")}
            aria-pressed={activeTab === "team"}
          >
            👥 Team
          </button>
          <button
            className={`btn btn-outline-dark ${
              activeTab === "comments" ? "active" : ""
            }`}
            onClick={() => setActiveTab("comments")}
            aria-pressed={activeTab === "comments"}
          >
            💬 Comments
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
                      <th scope="col">#</th>
                      <th scope="col">Product Name</th>
                      <th scope="col">Product Code</th>
                      <th scope="col">Quantity</th>
                      <th scope="col">Unit Price (₹)</th>
                      <th scope="col">Total Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <ProductRow
                        key={product.productId || index}
                        product={product}
                        index={index}
                      />
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="5" className="text-end fw-bold">
                        Total:
                      </td>
                      <td className="fw-bold">
                        ₹
                        {products
                          .reduce(
                            (sum, product) =>
                              sum +
                              parseFloat(product.price || 0) *
                                parseInt(product.quantity || 0),
                            0
                          )
                          .toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
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
            {teamLoading ? (
              <p>
                <Spinner animation="border" size="sm" /> Loading team members...
              </p>
            ) : teamError ? (
              <p className="text-danger">
                Error fetching team:{" "}
                {teamError?.data?.message || "Unknown error"}
              </p>
            ) : normalizedTeamMembers.length > 0 ? (
              <div className="row">
                {normalizedTeamMembers.map((team, teamIdx) => (
                  <div key={team.teamId} className="col-12 mb-4">
                    <h6 className="fw-bold text-primary">{team.teamName}</h6>
                    {team.members.length > 0 ? (
                      <div className="row">
                        {team.members.map((member, memberIdx) => (
                          <div key={memberIdx} className="col-md-4 mb-3">
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
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">
                        No members found for this team.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">
                {order.assignedTo
                  ? "No teams or members found for the assigned team(s)."
                  : "No team assigned to this order."}
              </p>
            )}
          </div>
        )}

        {/* Comments Section */}
        {activeTab === "comments" && (
          <div className="mt-4">
            <h5>Comments</h5>
            {!user.userId ? (
              <p className="text-warning">
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
              <Form onSubmit={handleAddComment} className="mb-4">
                <Form.Group controlId="newComment">
                  <Form.Label>Add a Comment</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Type your comment here..."
                    maxLength={1000}
                    aria-describedby="commentHelp"
                  />
                  <Form.Text id="commentHelp" muted>
                    Maximum 1000 characters. You can add up to 3 comments per
                    order.
                  </Form.Text>
                </Form.Group>
                <Button type="submit" variant="primary" className="mt-2">
                  Submit Comment
                </Button>
              </Form>
            )}
            {commentLoading ? (
              <p>
                <Spinner animation="border" size="sm" /> Loading comments...
              </p>
            ) : commentError ? (
              <p className="text-danger">
                Unable to load comments:{" "}
                {commentError?.data?.message || "Please try again later."}
              </p>
            ) : comments.length > 0 ? (
              <div>
                {comments.map((comment) => (
                  <CommentRow
                    key={comment._id}
                    comment={comment}
                    onDelete={handleDeleteComment}
                    currentUserId={user.userId}
                  />
                ))}
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
                    Page {commentPage} of{" "}
                    {Math.ceil(totalComments / commentLimit)}
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
              </div>
            ) : (
              <p className="text-muted">No comments found for this order.</p>
            )}
          </div>
        )}

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

export default OrderWithInvoice;
