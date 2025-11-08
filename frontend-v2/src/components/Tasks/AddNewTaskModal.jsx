import React from "react";
import { Modal, Form, Input, Select, DatePicker, Button } from "antd";
import { useGetAllOrdersQuery } from "../../api/orderApi";

const { Option } = Select;

const AddNewTaskModal = ({
  visible,
  onCancel,
  onSubmit,
  isLoading,
  editMode = false,
  initialValues = {},
  formInstance,
}) => {
  const { data: ordersData, isLoading: isOrdersLoading } = useGetAllOrdersQuery(
    {
      page: 1,
      limit: 100,
    }
  );

  return (
    <Modal
      title={editMode ? "Edit Task" : "Create New Task"}
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      <Form
        form={formInstance}
        onFinish={onSubmit}
        layout="vertical"
        initialValues={editMode ? initialValues : undefined}
      >
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
        <Form.Item
          name="priority"
          label="Priority"
          initialValue={editMode ? initialValues.priority : "medium"}
        >
          <Select>
            <Option value="critical">Critical</Option>
            <Option value="high">High</Option>
            <Option value="medium">Medium</Option>
            <Option value="low">Low</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="status"
          label="Status"
          initialValue={editMode ? initialValues.status : "PENDING"}
        >
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
          <Select allowClear loading={isOrdersLoading}>
            {ordersData?.orders?.map((order) => (
              <Option key={order.id} value={order.id}>
                Order #{order.orderNo}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {editMode ? "Update Task" : "Create Task"}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddNewTaskModal;
