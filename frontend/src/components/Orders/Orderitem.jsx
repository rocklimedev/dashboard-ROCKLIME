import React from "react";

const OrderItem = () => {
  return (
    <div class="card-body p-4">
      <div class="d-flex align-items-center justify-content-between">
        <span class="badge bg-outline-success d-inline-flex align-items-center">
          <i class="fas fa-circle fs-6 me-1"></i>High
        </span>
        <div>
          <a
            href="javascript:void(0);"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <i class="fas fa-ellipsis-v"></i>
          </a>
          <div class="dropdown-menu notes-menu dropdown-menu-end">
            <a
              href="#"
              class="dropdown-item"
              data-bs-toggle="modal"
              data-bs-target="#edit-note-units"
            >
              <span>
                <i data-feather="edit"></i>
              </span>
              Edit
            </a>
            <a
              href="#"
              class="dropdown-item"
              data-bs-toggle="modal"
              data-bs-target="#delete_modal"
            >
              <span>
                <i data-feather="trash-2"></i>
              </span>
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
      <div class="my-3">
        <h5 class="text-truncate mb-1">
          <a href="javascript:void(0);">Create a compost pile</a>
        </h5>
        <p class="mb-3 d-flex align-items-center text-dark">
          <i class="ti ti-calendar me-1"></i>27 Jan 2024
        </p>
        <p class="text-truncate line-clamb-2 text-wrap">
          Compost pile refers to fruit and vegetable scraps, used tea, coffee
          grounds etc..
        </p>
      </div>
      <div class="d-flex align-items-center justify-content-between border-top pt-3">
        <div class="d-flex align-items-center">
          <a href="javascript:void(0);" class="avatar avatar-md me-2">
            <img
              src="assets/img/profiles/avatar-08.jpg"
              alt="Profile"
              class="img-fluid rounded-circle"
            />
          </a>
          <span class="text-warning d-flex align-items-center">
            <i class="fas fa-square square-rotate fs-10 me-1"></i>
            Social
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
  );
};

export default OrderItem;
