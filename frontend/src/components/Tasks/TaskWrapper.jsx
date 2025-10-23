import React, { useState } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Checkbox,
  Tag,
  Dropdown,
  Menu,
  Avatar,
  Space,
  Spin,
  message,
  Collapse,
  List,
  Badge,
  Tabs,
} from "antd";
import {
  DownOutlined,
  StarFilled,
  StarOutlined,
  CalendarOutlined,
  PlusCircleOutlined,
  DragOutlined,
  RightOutlined,
  DownOutlined as DownArrow,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import PageHeader from "../Common/PageHeader";
import {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "../../api/taskApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetTaskBoardsByOwnerQuery } from "../../api/taskboardApi"; // Fixed import path (ensure case matches)
import { useAuth } from "../../context/AuthContext";

const { Option } = Select;
const { Panel } = Collapse;
const { TabPane } = Tabs;

const TaskWrapper = () => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [filters, setFilters] = useState({
    priority: "all",
    tags: null,
    sortBy: "createdAt",
    sortOrder: "desc",
    dueDate: null,
    resourceType: null,
    resourceId: null,
    page: 1,
    limit: 20,
  });
  const [taskBoardPage, setTaskBoardPage] = useState(1); // Separate pagination for TaskBoards
  const [activeTab, setActiveTab] = useState("all");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Get auth context
  const { auth } = useAuth();
  const userId = auth?.user?.userId;

  // RTK Query hooks
  const {
    data: tasksData,
    isLoading: isTasksLoading,
    error: tasksError,
  } = useGetTasksQuery({
    ...Object.fromEntries(
      Object.entries(filters).filter(
        ([key, value]) => value !== null && value !== undefined
      )
    ),
    priority:
      activeTab === "all" || activeTab === "taskboards" ? undefined : activeTab,
  });
  const { data: ordersData, isLoading: isOrdersLoading } = useGetAllOrdersQuery(
    {
      page: 1,
      limit: 100,
    }
  );
  const {
    data: taskBoardsData,
    isLoading: isTaskBoardsLoading,
    error: taskBoardsError,
  } = useGetTaskBoardsByOwnerQuery(
    {
      ownerId: userId,
      page: taskBoardPage,
      limit: 20,
    },
    { skip: !userId }
  );

  const [createTask, { isLoading: isCreating }] = useCreateTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const navigate = useNavigate();

  // Handle filter changes
  const handlePriorityChange = (tab) => {
    setActiveTab(tab);
    setFilters((prev) => ({
      ...prev,
      priority: tab === "all" || tab === "taskboards" ? undefined : tab,
      page: 1,
    }));
  };

  const handleTagChange = (value) => {
    setFilters((prev) => ({ ...prev, tags: value, page: 1 }));
  };

  const handleSortChange = (value) => {
    setFilters((prev) => ({ ...prev, sortBy: value, page: 1 }));
  };

  const handleDueDateChange = (date) => {
    setFilters((prev) => ({
      ...prev,
      dueDate: date ? moment(date).format("YYYY-MM-DD") : null,
      page: 1,
    }));
  };

  const handleOrderChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      resourceType: value ? "Order" : null,
      resourceId: value || null,
      page: 1,
    }));
  };

  // Handle modals
  const showAddModal = () => {
    form.resetFields();
    setIsAddModalVisible(true);
  };

  const showEditModal = (task) => {
    setSelectedTask(task);
    editForm.setFieldsValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? moment(task.dueDate) : null,
      tags: task.tags || [],
      linkedResource: task.linkedResource?.resourceId || null,
    });
    setIsEditModalVisible(true);
  };

  const showDeleteModal = (task) => {
    setSelectedTask(task);
    setIsDeleteModalVisible(true);
  };

  const showViewModal = (task) => {
    setSelectedTask(task);
    setIsViewModalVisible(true);
  };

  // Handle form submissions
  const handleCreateTask = async (values) => {
    if (!userId) {
      message.error("You must be logged in to create a task");
      return;
    }
    try {
      await createTask({
        ...values,
        assignedTo: userId,
        assignedBy: userId,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
        linkedResource: values.linkedResource
          ? { resourceType: "Order", resourceId: values.linkedResource }
          : undefined,
      }).unwrap();
      message.success("Task created successfully");
      setIsAddModalVisible(false);
      form.resetFields();
    } catch (err) {
      message.error(
        `Failed to create task: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const handleUpdateTask = async (values) => {
    try {
      await updateTask({
        id: selectedTask._id,
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
        linkedResource: values.linkedResource
          ? { resourceType: "Order", resourceId: values.linkedResource }
          : undefined,
      }).unwrap();
      message.success("Task updated successfully");
      setIsEditModalVisible(false);
      editForm.resetFields();
      setSelectedTask(null);
    } catch (err) {
      message.error(
        `Failed to update task: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  const handleDeleteTask = async () => {
    try {
      await deleteTask(selectedTask._id).unwrap();
      message.success("Task deleted successfully");
      setIsDeleteModalVisible(false);
      setSelectedTask(null);
    } catch (err) {
      message.error(
        `Failed to delete task: ${err.data?.message || "Unknown error"}`
      );
    }
  };

  // Handle TaskBoard click
  const handleTaskBoardClick = (taskBoardId) => {
    navigate(`/board/${taskBoardId}`);
  };

  // Priority color mapping
  const priorityColors = {
    critical: "red",
    high: "purple",
    medium: "yellow",
    low: "green",
  };

  // Status badge styles
  const statusStyles = {
    PENDING: "default",
    IN_PROGRESS: "processing",
    ON_HOLD: "warning",
    COMPLETED: "success",
    CANCELLED: "error",
    REVIEW: "warning",
  };

  // Tag color mapping
  const tagColors = {
    Internal: "red",
    Meeting: "purple",
    Projects: "green",
    Research: "pink",
    Reminder: "default",
    "Order Review": "blue",
    Invoice: "orange",
    Finance: "gold",
    Customer: "cyan",
    "Follow-up": "blue",
    Shipping: "green",
    Logistics: "lime",
    Admin: "orange",
  };

  // Dropdown menu for task actions
  const getMenu = (task) => (
    <Menu>
      <Menu.Item key="edit" onClick={() => showEditModal(task)}>
        <i className="anticon anticon-edit" /> Edit
      </Menu.Item>
      <Menu.Item key="delete" onClick={() => showDeleteModal(task)}>
        <i className="anticon anticon-delete" /> Delete
      </Menu.Item>
      <Menu.Item key="view" onClick={() => showViewModal(task)}>
        <i className="anticon anticon-eye" /> View
      </Menu.Item>
    </Menu>
  );

  // Render tasks for a priority
  const renderTasks = (priority, tasks) => (
    <Collapse
      defaultActiveKey={[priority]}
      expandIcon={({ isActive }) =>
        isActive ? <DownArrow /> : <RightOutlined />
      }
      key={priority}
      style={{ marginBottom: 16 }}
    >
      <Panel
        header={
          <Space>
            <Badge color={priorityColors[priority] || "gray"} />
            <span>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
            <Badge
              count={tasks.length}
              style={{ backgroundColor: "#d9d9d9" }}
            />
          </Space>
        }
        key={priority}
      >
        <List
          dataSource={tasks}
          renderItem={(task) => (
            <List.Item
              style={{
                padding: 16,
                borderRadius: 4,
                marginBottom: 8,
                background: "#fff",
                border: "1px solid #f0f0f0",
              }}
              actions={[
                <Space key="tags">
                  {task.tags?.map((tag) => (
                    <Tag key={tag} color={tagColors[tag] || "default"}>
                      {tag}
                    </Tag>
                  ))}
                </Space>,
                <Tag
                  key="status"
                  color={statusStyles[task.status] || "default"}
                >
                  {task.status.replace("_", " ").toLowerCase()}
                </Tag>,
                <Avatar.Group key="avatars" maxCount={3}>
                  {task.watchers?.map((watcherId) => (
                    <Avatar
                      key={watcherId}
                      src={`/assets/img/profiles/avatar-${Math.floor(
                        Math.random() * 25 + 1
                      )}.jpg`}
                    />
                  ))}
                </Avatar.Group>,
                <Dropdown
                  key="dropdown"
                  overlay={getMenu(task)}
                  trigger={["click"]}
                >
                  <a href="#!">
                    <DownOutlined />
                  </a>
                </Dropdown>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Space>
                    <DragOutlined style={{ color: "#8c8c8c" }} />
                    <Checkbox
                      checked={task.status === "COMPLETED"}
                      onChange={() =>
                        updateTask({
                          id: task._id,
                          status:
                            task.status === "COMPLETED"
                              ? "PENDING"
                              : "COMPLETED",
                        })
                      }
                    />
                    {task.isStarred ? (
                      <StarFilled style={{ color: "#fadb14" }} />
                    ) : (
                      <StarOutlined />
                    )}
                  </Space>
                }
                title={<span style={{ fontSize: 14 }}>{task.title}</span>}
                description={
                  <Space>
                    <Tag icon={<CalendarOutlined />}>
                      {task.dueDate
                        ? moment(task.dueDate).format("DD MMM YYYY")
                        : "No Due Date"}
                    </Tag>
                    {task.linkedResource?.resourceType === "Order" && (
                      <Tag color="blue">
                        Order #
                        {ordersData?.orders?.find(
                          (o) => o.id === task.linkedResource.resourceId
                        )?.orderNo || task.linkedResource.resourceId}
                      </Tag>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
        <Space style={{ marginTop: 8 }}>
          <Button type="default" onClick={showAddModal}>
            <PlusCircleOutlined /> Add New
          </Button>
          <Button type="text">
            See All <RightOutlined />
          </Button>
        </Space>
      </Panel>
    </Collapse>
  );

  // Render TaskBoards
  const renderTaskBoards = () => {
    if (!userId) {
      return (
        <div style={{ color: "#8c8c8c" }}>
          Please log in to view your task boards.
        </div>
      );
    }
    if (isTaskBoardsLoading) {
      return <Spin tip="Loading task boards..." />;
    }
    if (taskBoardsError) {
      return (
        <div>
          Error: {taskBoardsError.data?.message || "Failed to load task boards"}
        </div>
      );
    }
    const taskBoards = taskBoardsData?.data.taskBoards || [];

    if (!taskBoards.length) {
      return (
        <div style={{ color: "#8c8c8c" }}>
          No task boards available for this user.
        </div>
      );
    }
    return (
      <div>
        <List
          dataSource={taskBoards}
          renderItem={(taskBoard) => (
            <List.Item
              style={{
                padding: 16,
                borderRadius: 4,
                marginBottom: 8,
                background: "#fff",
                border: "1px solid #f0f0f0",
                cursor: "pointer",
              }}
              onClick={() => handleTaskBoardClick(taskBoard._id)}
              actions={[
                <Tag key="resourceType" color="blue">
                  {taskBoard.resourceType}
                </Tag>,
                <Avatar.Group key="watchers" maxCount={3}>
                  {taskBoard.watchers?.map((watcherId) => (
                    <Avatar
                      key={watcherId}
                      src={`/assets/img/profiles/avatar-${Math.floor(
                        Math.random() * 25 + 1
                      )}.jpg`}
                    />
                  ))}
                </Avatar.Group>,
              ]}
            >
              <List.Item.Meta
                title={<span style={{ fontSize: 14 }}>{taskBoard.name}</span>}
                description={
                  <Space>
                    <Tag>
                      {taskBoard.resourceType} #{taskBoard.resourceId}
                    </Tag>
                    <Tag icon={<CalendarOutlined />}>
                      Created:{" "}
                      {moment(taskBoard.createdAt).format("DD MMM YYYY")}
                    </Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Button
            type="primary"
            onClick={() => setTaskBoardPage((prev) => prev + 1)}
            disabled={taskBoardsData?.page >= taskBoardsData?.totalPages}
            icon={<i className="anticon anticon-loading" />}
          >
            Load More
          </Button>
        </div>
      </div>
    );
  };

  // Filter tasks by priority
  const filteredTasks = {
    all: tasksData?.data?.tasks || [],
    critical:
      tasksData?.data?.tasks?.filter((task) => task.priority === "critical") ||
      [],
    high:
      tasksData?.data?.tasks?.filter((task) => task.priority === "high") || [],
    medium:
      tasksData?.data?.tasks?.filter((task) => task.priority === "medium") ||
      [],
    low:
      tasksData?.data?.tasks?.filter((task) => task.priority === "low") || [],
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Tasks"
          subtitle="Manage your Tasks & Task Boards"
          onAdd={showAddModal}
        />
        <div style={{ background: "#fff", padding: 24, borderRadius: 8 }}>
          {/* Task Summary */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Space>
              <h4>Total Todo</h4>
              <Badge
                count={tasksData?.data?.totalCount || 0}
                style={{ backgroundColor: "#000" }}
              />
            </Space>
            <Space
              split={
                <div style={{ borderLeft: "1px solid #d9d9d9", height: 16 }} />
              }
            >
              <span>
                Total Task: <strong>{tasksData?.data?.totalCount || 0}</strong>
              </span>
              <span>
                Pending:{" "}
                <strong>
                  {tasksData?.data?.tasks?.filter((t) => t.status === "PENDING")
                    ?.length || 0}
                </strong>
              </span>
              <span>
                Completed:{" "}
                <strong>
                  {tasksData?.data?.tasks?.filter(
                    (t) => t.status === "COMPLETED"
                  )?.length || 0}
                </strong>
              </span>
            </Space>
          </div>

          {/* Tabs for Priority and TaskBoards */}
          <Tabs
            activeKey={activeTab}
            onChange={handlePriorityChange}
            style={{ marginBottom: 16 }}
          >
            <TabPane tab="All" key="all" />
            <TabPane tab="Critical" key="critical" />
            <TabPane tab="High" key="high" />
            <TabPane tab="Medium" key="medium" />
            <TabPane tab="Low" key="low" />
            <TabPane tab="Task Boards" key="taskboards" />
          </Tabs>

          {/* Filters */}
          {activeTab !== "taskboards" && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
                borderBottom: "1px solid #f0f0f0",
                paddingBottom: 16,
              }}
            >
              <Space>
                <h6>Priority</h6>
                <Space>
                  {["all", "critical", "high", "medium", "low"].map((tab) => (
                    <Button
                      key={tab}
                      type={activeTab === tab ? "primary" : "default"}
                      onClick={() => handlePriorityChange(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Button>
                  ))}
                </Space>
              </Space>
              <Space>
                <DatePicker
                  style={{ width: 120 }}
                  placeholder="Due Date"
                  onChange={handleDueDateChange}
                  format="YYYY-MM-DD"
                />
                <Select
                  placeholder="All Tags"
                  style={{ width: 120 }}
                  allowClear
                  onChange={handleTagChange}
                >
                  {[
                    "All Tags",
                    "Internal",
                    "Projects",
                    "Meetings",
                    "Reminder",
                    "Research",
                    "Order Review",
                    "Invoice",
                    "Finance",
                    "Customer",
                    "Follow-up",
                    "Shipping",
                    "Logistics",
                    "Admin",
                  ].map((tag) => (
                    <Option key={tag} value={tag === "All Tags" ? null : tag}>
                      {tag}
                    </Option>
                  ))}
                </Select>
                <Select
                  placeholder="Linked Order"
                  style={{ width: 120 }}
                  allowClear
                  onChange={handleOrderChange}
                  loading={isOrdersLoading}
                >
                  {ordersData?.orders?.map((order) => (
                    <Option key={order.id} value={order.id}>
                      Order #{order.orderNo}
                    </Option>
                  ))}
                </Select>
                <Space>
                  <span>Sort By:</span>
                  <Select
                    defaultValue="createdAt"
                    style={{ width: 120 }}
                    onChange={handleSortChange}
                  >
                    <Option value="createdAt">Created Date</Option>
                    <Option value="priority">Priority</Option>
                    <Option value="dueDate">Due Date</Option>
                  </Select>
                </Space>
              </Space>
            </div>
          )}

          {/* Content: Tasks or TaskBoards */}
          {activeTab === "taskboards" ? (
            renderTaskBoards()
          ) : isTasksLoading ? (
            <Spin tip="Loading tasks..." />
          ) : tasksError ? (
            <div>
              Error: {tasksError.data?.message || "Failed to load tasks"}
            </div>
          ) : (
            <div>
              {activeTab === "all" ? (
                ["critical", "high", "medium", "low"].map((priority) =>
                  filteredTasks[priority]?.length > 0 ? (
                    renderTasks(priority, filteredTasks[priority])
                  ) : (
                    <div
                      key={priority}
                      style={{ color: "#8c8c8c", marginBottom: 16 }}
                    >
                      No {priority.charAt(0).toUpperCase() + priority.slice(1)}{" "}
                      priority tasks available.
                    </div>
                  )
                )
              ) : filteredTasks[activeTab]?.length > 0 ? (
                renderTasks(activeTab, filteredTasks[activeTab])
              ) : (
                <div style={{ color: "#8c8c8c" }}>
                  No {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}{" "}
                  priority tasks available.
                </div>
              )}
            </div>
          )}

          {/* Load More for Tasks (only shown when not in TaskBoards tab) */}
          {activeTab !== "taskboards" && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Button
                type="primary"
                onClick={() =>
                  setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={tasksData?.data?.page >= tasksData?.data?.totalPages}
                icon={<i className="anticon anticon-loading" />}
              >
                Load More
              </Button>
            </div>
          )}

          {/* Add Task Modal */}
          <Modal
            title="Create New Task"
            open={isAddModalVisible}
            onCancel={() => setIsAddModalVisible(false)}
            footer={null}
          >
            <Form form={form} onFinish={handleCreateTask} layout="vertical">
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Please enter a title" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <Input.TextArea />
              </Form.Item>
              <Form.Item name="priority" label="Priority" initialValue="medium">
                <Select>
                  <Option value="critical">Critical</Option>
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </Form.Item>
              <Form.Item name="status" label="Status" initialValue="PENDING">
                <Select>
                  <Option value="PENDING">Pending</Option>
                  <Option value="IN_PROGRESS">In Progress</Option>
                  <Option value="REVIEW">Review</Option>
                  <Option value="ON_HOLD">On Hold</Option>
                  <Option value="COMPLETED">Completed</Option>
                  <Option value="CANCELLED">Cancelled</Option>
                </Select>
              </Form.Item>
              <Form.Item name="dueDate" label="Due Date">
                <DatePicker format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item name="tags" label="Tags">
                <Select mode="multiple">
                  {[
                    "Internal",
                    "Projects",
                    "Meetings",
                    "Reminder",
                    "Research",
                    "Order Review",
                    "Invoice",
                    "Finance",
                    "Customer",
                    "Follow-up",
                    "Shipping",
                    "Logistics",
                    "Admin",
                  ].map((tag) => (
                    <Option key={tag} value={tag}>
                      {tag}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="linkedResource" label="Linked Order">
                <Select allowClear>
                  {ordersData?.orders?.map((order) => (
                    <Option key={order.id} value={order.id}>
                      Order #{order.orderNo}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={isCreating}>
                  Create Task
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          {/* Edit Task Modal */}
          <Modal
            title="Edit Task"
            open={isEditModalVisible}
            onCancel={() => setIsEditModalVisible(false)}
            footer={null}
          >
            <Form form={editForm} onFinish={handleUpdateTask} layout="vertical">
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Please enter a title" }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="description" label="Description">
                <Input.TextArea />
              </Form.Item>
              <Form.Item name="priority" label="Priority">
                <Select>
                  <Option value="critical">Critical</Option>
                  <Option value="high">High</Option>
                  <Option value="medium">Medium</Option>
                  <Option value="low">Low</Option>
                </Select>
              </Form.Item>
              <Form.Item name="status" label="Status">
                <Select>
                  <Option value="PENDING">Pending</Option>
                  <Option value="IN_PROGRESS">In Progress</Option>
                  <Option value="REVIEW">Review</Option>
                  <Option value="ON_HOLD">On Hold</Option>
                  <Option value="COMPLETED">Completed</Option>
                  <Option value="CANCELLED">Cancelled</Option>
                </Select>
              </Form.Item>
              <Form.Item name="dueDate" label="Due Date">
                <DatePicker format="YYYY-MM-DD" />
              </Form.Item>
              <Form.Item name="tags" label="Tags">
                <Select mode="multiple">
                  {[
                    "Internal",
                    "Projects",
                    "Meetings",
                    "Reminder",
                    "Research",
                    "Order Review",
                    "Invoice",
                    "Finance",
                    "Customer",
                    "Follow-up",
                    "Shipping",
                    "Logistics",
                    "Admin",
                  ].map((tag) => (
                    <Option key={tag} value={tag}>
                      {tag}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="linkedResource" label="Linked Order">
                <Select allowClear>
                  {ordersData?.orders?.map((order) => (
                    <Option key={order.id} value={order.id}>
                      Order #{order.orderNo}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={isUpdating}>
                  Update Task
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          {/* Delete Task Modal */}
          <Modal
            title="Delete Task"
            open={isDeleteModalVisible}
            onCancel={() => setIsDeleteModalVisible(false)}
            footer={[
              <Button
                key="cancel"
                onClick={() => setIsDeleteModalVisible(false)}
              >
                Cancel
              </Button>,
              <Button
                key="delete"
                type="primary"
                danger
                onClick={handleDeleteTask}
                loading={isDeleting}
              >
                Delete
              </Button>,
            ]}
          >
            <p>
              Are you sure you want to delete the task "{selectedTask?.title}"?
            </p>
          </Modal>

          {/* View Task Modal */}
          <Modal
            title="View Task"
            open={isViewModalVisible}
            onCancel={() => setIsViewModalVisible(false)}
            footer={null}
          >
            {selectedTask && (
              <div>
                <p>
                  <strong>Task ID:</strong> {selectedTask.taskId}
                </p>
                <p>
                  <strong>Title:</strong> {selectedTask.title}
                </p>
                <p>
                  <strong>Description:</strong>{" "}
                  {selectedTask.description || "N/A"}
                </p>
                <p>
                  <strong>Priority:</strong> {selectedTask.priority}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {selectedTask.status.replace("_", " ")}
                </p>
                <p>
                  <strong>Due Date:</strong>{" "}
                  {selectedTask.dueDate
                    ? moment(selectedTask.dueDate).format("DD MMM YYYY")
                    : "N/A"}
                </p>
                <p>
                  <strong>Tags:</strong>{" "}
                  {selectedTask.tags?.join(", ") || "None"}
                </p>
                <p>
                  <strong>Assigned To:</strong>{" "}
                  {selectedTask.assignedToUser?.name || "Unknown"}
                </p>
                <p>
                  <strong>Assigned By:</strong>{" "}
                  {selectedTask.assignedByUser?.name || "Unknown"}
                </p>
                <p>
                  <strong>Linked Resource:</strong>{" "}
                  {selectedTask.linkedResource?.resourceType === "Order"
                    ? `Order #${
                        ordersData?.orders?.find(
                          (o) => o.id === selectedTask.linkedResource.resourceId
                        )?.orderNo || selectedTask.linkedResource.resourceId
                      }`
                    : selectedTask.linkedResource?.resourceType === "Customer"
                    ? `Customer #${selectedTask.linkedResource.resourceId}`
                    : "None"}
                </p>
                <p>
                  <strong>Checklist:</strong>{" "}
                  {selectedTask.checklist?.length ? (
                    <ul>
                      {selectedTask.checklist.map((item, index) => (
                        <li key={index}>
                          {item.item} -{" "}
                          {item.isCompleted ? "Completed" : "Pending"}
                          {item.completedAt &&
                            ` on ${moment(item.completedAt).format(
                              "DD MMM YYYY"
                            )}`}
                          {item.completedBy && ` by ${item.completedBy}`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "None"
                  )}
                </p>
                <p>
                  <strong>Watchers:</strong>{" "}
                  {selectedTask.watchers?.length
                    ? selectedTask.watchers.join(", ")
                    : "None"}
                </p>
              </div>
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default TaskWrapper;
