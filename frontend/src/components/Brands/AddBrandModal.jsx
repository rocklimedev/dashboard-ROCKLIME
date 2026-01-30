import React, { useEffect } from "react";
import { Modal, Form, Input, Button, Row, Col, message } from "antd";
import {
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useGetAllBrandsQuery,
} from "../../api/brandsApi";

const AddBrand = ({ onClose, existingBrand }) => {
  const [form] = Form.useForm();

  const { data: allBrands = [] } = useGetAllBrandsQuery();
  const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
  const [updateBrand, { isLoading: isUpdating }] = useUpdateBrandMutation();

  const isLoading = isCreating || isUpdating;

  // Initialize form values when existingBrand changes
  useEffect(() => {
    if (existingBrand) {
      form.setFieldsValue({
        id: existingBrand.id,
        brandName: existingBrand.brandName || "",
        brandSlug: existingBrand.brandSlug || "",
      });
    } else {
      form.resetFields();
    }
  }, [existingBrand, form]);

  const handleSubmit = async (values) => {
    const { brandName, brandSlug, id } = values;

    // Check for duplicate slug (case-insensitive)
    const isDuplicate = allBrands.some(
      (brand) =>
        brand.brandSlug?.toLowerCase() === brandSlug.toLowerCase() &&
        brand.id !== id,
    );

    if (isDuplicate) {
      message.error("This brand slug is already taken.");
      return;
    }

    try {
      if (id) {
        await updateBrand({ id, brandName, brandSlug }).unwrap();
        message.success("Brand updated successfully!");
      } else {
        await createBrand({ brandName, brandSlug }).unwrap();
        message.success("Brand created successfully!");
      }

      onClose();
    } catch (err) {
      message.error(
        err?.data?.message || "Failed to save brand. Please try again.",
      );
    }
  };

  const title = Form.useWatch("id", form) ? "Edit Brand" : "Add Brand";

  return (
    <Modal
      title={title}
      open={true} // controlled by parent visibility
      onCancel={onClose}
      footer={null} // we use custom footer below
      maskClosable={false} // prevent closing by clicking backdrop (optional)
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          brandName: "",
          brandSlug: "",
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="brandName"
              label={
                <>
                  Brand Name <span style={{ color: "#ff4d4f" }}>*</span>
                </>
              }
              rules={[
                { required: true, message: "Please enter brand name" },
                { max: 100, message: "Name cannot exceed 100 characters" },
              ]}
            >
              <Input placeholder="e.g. Nike" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="brandSlug"
              label={
                <>
                  Brand Slug <span style={{ color: "#ff4d4f" }}>*</span>
                </>
              }
              rules={[
                { required: true, message: "Please enter brand slug" },
                {
                  pattern: /^[a-z0-9-]+$/,
                  message:
                    "Slug can only contain lowercase letters, numbers, and hyphens",
                },
              ]}
              tooltip="Used in URLs — keep it short, unique and URL-friendly"
            >
              <Input placeholder="e.g. nike" />
            </Form.Item>
          </Col>
        </Row>

        {/* Hidden field for id */}
        <Form.Item name="id" hidden>
          <Input type="hidden" />
        </Form.Item>

        <div style={{ textAlign: "right", marginTop: 24 }}>
          <Button
            style={{ marginRight: 12 }}
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {Form.useWatch("id", form) ? "Update Brand" : "Add Brand"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddBrand;
