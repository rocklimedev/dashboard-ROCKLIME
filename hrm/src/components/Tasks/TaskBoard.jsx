// src/components/TaskBoard.js
import React, { useState, useEffect } from "react";
import {
  useGetTaskBoardsQuery,
  useGetTasksByTaskBoardQuery,
} from "../api/taskBoardApi";
import { useSelector } from "react-redux";
import { format } from "date-fns"; // For date formatting

const TaskBoard = () => {
  const [selectedTaskBoard, setSelectedTaskBoard] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
    page: 1,
    limit: 20,
  });

  // Assuming resourceType and resourceId are passed via props or context
  const resourceType = "Order"; // Replace with dynamic value
  const resourceId = "ORD123"; // Replace with dynamic value

  // Fetch TaskBoards
  const {
    data: taskBoardsData,
    isLoading: isTaskBoardsLoading,
    error: taskBoardsError,
  } = useGetTaskBoardsQuery({
    resourceType,
    resourceId,
    page: 1,
    limit: 20,
  });

  // Fetch tasks for the selected TaskBoard
  const {
    data: tasksData,
    isLoading: isTasksLoading,
    error: tasksError,
  } = useGetTasksByTaskBoardQuery(
    {
      taskBoardId: selectedTaskBoard?._id,
      ...filters,
    },
    { skip: !selectedTaskBoard } // Skip query if no TaskBoard is selected
  );

  // Select auth token (for API requests, if needed)
  const { token } = useSelector((state) => state.auth);

  // Handle TaskBoard selection
  const handleTaskBoardSelect = (taskBoard) => {
    setSelectedTaskBoard(taskBoard);
    setFilters({ ...filters, page: 1 }); // Reset page on TaskBoard change
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Map status to badge classes
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "badge-soft-success";
      case "pending":
        return "badge-soft-dark";
      case "inprogress":
        return "badge-soft-purple";
      case "onhold":
        return "badge-soft-pink";
      default:
        return "badge-soft-dark";
    }
  };

  // Map priority to icon colors
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "text-danger";
      case "high":
        return "text-purple";
      case "medium":
        return "text-warning";
      case "low":
        return "text-success";
      default:
        return "text-dark";
    }
  };

  // Render avatar images (replace with actual images or placeholders)
  const renderAvatars = (assignees) => {
    return assignees?.slice(0, 3).map((assignee, index) => (
      <span key={index} className="avatar avatar-rounded">
        <img
          className="border border-white"
          src={assignee.avatar || "assets/img/profiles/avatar-default.jpg"}
          alt="img"
        />
      </span>
    ));
  };

  // Effect to select the first TaskBoard by default
  useEffect(() => {
    if (taskBoardsData?.taskBoards?.length && !selectedTaskBoard) {
      setSelectedTaskBoard(taskBoardsData.taskBoards[0]);
    }
  }, [taskBoardsData, selectedTaskBoard]);

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="add-item d-flex">
            <div className="page-title">
              <h4>Task Boards</h4>
              <h6>Manage Your Tasks</h6>
            </div>
          </div>
          <ul className="table-top-head">
            <li>
              <a href="#" className="todo-grid-view">
                <i className="ti ti-grid"></i>
              </a>
            </li>
            <li>
              <a href="#" className="todo-list-view active">
                <i className="ti ti-list"></i>
              </a>
            </li>
            <li>
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Refresh"
              >
                <i className="ti ti-refresh"></i>
              </a>
            </li>
            <li>
              <a
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                title="Collapse"
                id="collapse-header"
              >
                <i className="ti ti-chevron-up"></i>
              </a>
            </li>
          </ul>
          <div className="page-btn">
            <a
              href="#"
              className="btn btn-primary"
              data-bs-toggle="modal"
              data
              bs-target="#add_todo"
            >
              <i className="ti ti-circle-plus me-1"></i>Create New Task
            </a>
            <a
              href="#"
              className="btn btn-primary ms-2"
              data-bs-toggle="modal"
              data-bs-target="#add_taskboard"
            >
              <i className="ti ti-circle-plus me-1"></i>Create New TaskBoard
            </a>
          </div>
        </div>

        {/* TaskBoard Selector */}
        <div className="mb-3">
          <h5>Select TaskBoard</h5>
          {isTaskBoardsLoading ? (
            <p>Loading TaskBoards...</p>
          ) : taskBoardsError ? (
            <p>Error loading TaskBoards: {taskBoardsError.message}</p>
          ) : (
            <select
              className="form-select"
              value={selectedTaskBoard?._id || ""}
              onChange={(e) => {
                const taskBoard = taskBoardsData.taskBoards.find(
                  (tb) => tb._id === e.target.value
                );
                handleTaskBoardSelect(taskBoard);
              }}
            >
              {taskBoardsData?.taskBoards?.map((taskBoard) => (
                <option key={taskBoard._id} value={taskBoard._id}>
                  {taskBoard.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <h5 className="d-flex align-items-center">
              {selectedTaskBoard ? `${selectedTaskBoard.name} Tasks` : "Tasks"}
              <span className="badge bg-soft-pink ms-2">
                {tasksData?.totalCount || 0} Tasks
              </span>
            </h5>
            <div className="d-flex align-items-center flex-wrap row-gap-3">
              <div className="input-icon-start me-2 position-relative">
                <span className="icon-addon">
                  <i className="ti ti-calendar"></i>
                </span>
                <input
                  type="text"
                  className="form-control date-range bookingrange"
                  placeholder="dd/mm/yyyy - dd/mm/yyyy"
                  onChange={(e) =>
                    handleFilterChange("dateRange", e.target.value)
                  }
                />
              </div>
              <div className="input-icon position-relative w-120 me-2">
                <span className="input-icon-addon">
                  <i className="ti ti-calendar text-gray-9"></i>
                </span>
                <input
                  type="text"
                  className="form-control datetimepicker"
                  placeholder="Due Date"
                  onChange={(e) =>
                    handleFilterChange("dueDate", e.target.value)
                  }
                />
              </div>
              <div className="dropdown me-2">
                <a
                  href="#"
                  className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Tags
                </a>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  <li>
                    <a
                      href="#"
                      className="dropdown-item rounded-1"
                      onClick={() => handleFilterChange("tags", "")}
                    >
                      All Tags
                    </a>
                  </li>
                  {["Urgent", "High", "Medium"].map((tag) => (
                    <li key={tag}>
                      <a
                        href="#"
                        className="dropdown-item rounded-1"
                        onClick={() => handleFilterChange("tags", tag)}
                      >
                        {tag}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="dropdown me-2">
                <a
                  href="#"
                  className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Assignee
                </a>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  {tasksData?.tasks
                    ?.reduce((acc, task) => {
                      if (
                        task.assignedToUser &&
                        !acc.find(
                          (a) => a.userId === task.assignedToUser.userId
                        )
                      ) {
                        acc.push(task.assignedToUser);
                      }
                      return acc;
                    }, [])
                    .map((assignee) => (
                      <li key={assignee.userId}>
                        <a
                          href="#"
                          className="dropdown-item rounded-1"
                          onClick={() =>
                            handleFilterChange("assignedTo", assignee.userId)
                          }
                        >
                          {assignee.name}
                        </a>
                      </li>
                    ))}
                </ul>
              </div>
              <div className="dropdown me-2">
                <a
                  href="#"
                  className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Select Status
                </a>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  {["Completed", "Pending", "Inprogress", "Onhold"].map(
                    (status) => (
                      <li key={status}>
                        <a
                          href="#"
                          className="dropdown-item rounded-1"
                          onClick={() => handleFilterChange("status", status)}
                        >
                          {status}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div className="dropdown">
                <a
                  href="#"
                  className="dropdown-toggle btn btn-white d-inline-flex align-items-center fs-12"
                  data-bs-toggle="dropdown"
                >
                  <span className="fs-12 d-inline-flex me-1">Sort By: </span>
                  Last 7 Days
                </a>
                <ul className="dropdown-menu dropdown-menu-end p-3">
                  {["Last 7 Days", "Last 1 month", "Last 1 year"].map(
                    (sort) => (
                      <li key={sort}>
                        <a
                          href="#"
                          className="dropdown-item rounded-1"
                          onClick={() => handleFilterChange("sortBy", sort)}
                        >
                          {sort}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive no-search">
              {isTasksLoading ? (
                <p>Loading tasks...</p>
              ) : tasksError ? (
                <p>Error loading tasks: {tasksError.message}</p>
              ) : (
                <table className="table datatable">
                  <thead className="thead-light">
                    <tr>
                      <th className="no-sort">
                        <div className="form-check form-check-md">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="select-all"
                          />
                        </div>
                      </th>
                      <th>Title</th>
                      <th>Tags</th>
                      <th>Assignee</th>
                      <th>Created On</th>
                      <th>Progress</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th className="no-sort"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasksData?.tasks?.map((task) => (
                      <tr key={task._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="form-check form-check-md">
                              <input
                                className="form-check-input"
                                type="checkbox"
                              />
                            </div>
                            <span className="mx-2 d-flex align-items-center rating-select">
                              <i
                                className={`ti ti-star${
                                  task.isStarred ? "-filled filled" : ""
                                }`}
                              ></i>
                            </span>
                            <span className="d-flex align-items-center">
                              <i
                                className={`ti ti-square-rounded ${getPriorityColor(
                                  task.priority
                                )} me-2`}
                              ></i>
                            </span>
                          </div>
                        </td>
                        <td>
                          <p className="fw-medium text-dark">{task.title}</p>
                        </td>
                        <td>
                          {task.tags?.map((tag) => (
                            <span
                              key={tag}
                              className={`badge badge-${tag.toLowerCase()}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </td>
                        <td>
                          <div className="avatar-list-stacked avatar-group-sm">
                            {renderAvatars([task.assignedToUser])}
                          </div>
                        </td>
                        <td>
                          {task.createdAt
                            ? format(new Date(task.createdAt), "dd MMM yyyy")
                            : "-"}
                        </td>
                        <td>
                          <span className="d-block mb-1">
                            Progress: {task.progress}%
                          </span>
                          <div
                            className="progress progress-xs flex-grow-1 mb-2"
                            style={{ width: "190px" }}
                          >
                            <div
                              className={`progress-bar bg-${
                                task.progress === 100
                                  ? "success"
                                  : task.progress > 50
                                  ? "purple"
                                  : "danger"
                              } rounded`}
                              role="progressbar"
                              style={{ width: `${task.progress}%` }}
                              aria-valuenow={task.progress}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                        </td>
                        <td>
                          {task.dueDate
                            ? format(new Date(task.dueDate), "dd MMM yyyy")
                            : "-"}
                        </td>
                        <td>
                          <span
                            className={`badge ${getStatusClass(
                              task.status
                            )} shadow-none d-inline-flex align-items-center`}
                          >
                            <i className="ti ti-circle-filled fs-5 me-1"></i>
                            {task.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <a
                              href="#"
                              className="btn btn-sm btn-icon"
                              data-bs-toggle="modal"
                              data-bs-target="#edit_todo"
                            >
                              <i className="ti ti-edit"></i>
                            </a>
                            <a
                              href="#"
                              className="btn btn-sm btn-icon"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_modal"
                            >
                              <i className="ti ti-trash"></i>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {/* Pagination */}
              {tasksData?.totalPages > 1 && (
                <div className="d-flex justify-content-end mt-3">
                  <nav>
                    <ul className="pagination">
                      <li
                        className={`page-item ${
                          filters.page === 1 ? "disabled" : ""
                        }`}
                      >
                        <a
                          className="page-link"
                          href="#"
                          onClick={() => handlePageChange(filters.page - 1)}
                        >
                          Previous
                        </a>
                      </li>
                      {Array.from({ length: tasksData.totalPages }, (_, i) => (
                        <li
                          key={i}
                          className={`page-item ${
                            filters.page === i + 1 ? "active" : ""
                          }`}
                        >
                          <a
                            className="page-link"
                            href="#"
                            onClick={() => handlePageChange(i + 1)}
                          >
                            {i + 1}
                          </a>
                        </li>
                      ))}
                      <li
                        className={`page-item ${
                          filters.page === tasksData.totalPages
                            ? "disabled"
                            : ""
                        }`}
                      >
                        <a
                          className="page-link"
                          href="#"
                          onClick={() => handlePageChange(filters.page + 1)}
                        >
                          Next
                        </a>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskBoard;
