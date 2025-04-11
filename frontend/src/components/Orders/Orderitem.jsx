import React from "react";
import avatar from "../../assets/img/profiles/avatar-01.jpg";
const OrderItem = ({ order }) => {
  if (!order) return null;

  return (
    <div className="card-body p-4">
      <div className="d-flex align-items-center justify-content-between">
        <span className="badge bg-outline-success d-inline-flex align-items-center">
          <i className="fas fa-circle fs-6 me-1"></i>
          {order.priority} - {order.assignedTo || "null"}
        </span>
        <div>
          <a
            href="javascript:void(0);"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i className="fas fa-ellipsis-v"></i>
          </a>
          <div className="dropdown-menu notes-menu dropdown-menu-end">
            <a href="#" className="dropdown-item">
              <span>
                <i className="ti ti-edit"></i>
              </span>{" "}
              Edit
            </a>
            <a href="#" className="dropdown-item">
              <span>
                <i className="ti ti-trash"></i>
              </span>{" "}
              Delete
            </a>
            <a href="javascript:void(0);" class="dropdown-item">
              <span>
                <i data-feather="star"></i>
              </span>
              Not Important
            </a>
            <a
              href="#"
              class="dropdown-item"
              data-bs-toggle="modal"
              data-bs-target="#view-note-units"
            >
              <span>
                <i data-feather="eye"></i>
              </span>
              View
            </a>
          </div>
        </div>
      </div>

      <div className="my-3">
        <h5 className="text-truncate mb-1">
          <a href="javascript:void(0);">
            {order.title || "Order Title"} - {order.pipeline}
          </a>
        </h5>
        <p className="mb-3 d-flex align-items-center text-dark">
          <i className="ti ti-calendar me-1"></i>{" "}
          {order.dueDate || "No Due Date"} - {order.followupDates}
        </p>
        <p className="text-truncate line-clamb-2 text-wrap">
          {order.description || "No description available"}
        </p>
      </div>

      <div className="d-flex align-items-center justify-content-between border-top pt-3">
        <div className="d-flex align-items-center">
          <span className="text-warning d-flex align-items-center">
            <i className="fas fa-square square-rotate fs-10 me-1"></i>{" "}
            {order.source || "Unknown"}
          </span>
        </div>
        <div class="d-flex align-items-center justify-content-between border-top pt-3">
          <div class="d-flex align-items-center">
            <a href="javascript:void(0);" class="avatar avatar-md me-2">
              <img
                src={avatar}
                alt="Profile"
                class="img-fluid rounded-circle"
              />
            </a>
            <span class="text-info d-flex align-items-center">
              <i class="fas fa-square square-rotate fs-10 me-1"></i>
              {order.status}
            </span>
          </div>
          <div class="d-flex align-items-center">
            <a href="javascript:void(0);" class="me-2">
              <span>
                <i class="fas fa-star text-warning"></i>
              </span>
            </a>
            <a href="javascript:void(0);">
              <span>
                <i class="ti ti-trash text-danger"></i>
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
