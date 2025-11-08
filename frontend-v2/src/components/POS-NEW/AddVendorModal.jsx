import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, Alert, Spin } from "antd";
import {
  useCheckVendorIdQuery,
  useGetVendorByIdQuery,
  useCreateVendorMutation,
} from "../../api/vendorApi"; // Assume vendorApi
import { useSendNotificationMutation } from "../../api/notificationApi";
import { toast } from "sonner";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { useAuth } from "../../context/AuthContext";
const { Option } = Select;

const AddVendorModal = ({ show, onClose, isCreatingVendor }) => {
  const { auth } = useAuth();
  const {
    data: brandsData,
    isLoading: isBrandsLoading,
    error: brandsError,
  } = useGetAllBrandsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [sendNotification] = useSendNotificationMutation();
  const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();
  const brands = brandsData || [];
  const [form] = Form.useForm();
  const [vendorData, setVendorData] = useState({
    vendorId: "",
    vendorName: "",
    brandId: "",
    brandSlug: "",
  });
  const [vendorIdError, setVendorIdError] = useState(null);

  // Check vendorId uniqueness
  const { data: isVendorIdUnique, error: vendorIdCheckError } =
    useCheckVendorIdQuery(vendorData.vendorId, {
      skip: !vendorData.vendorId || vendorData.vendorId.length < 3, // Debounce-like effect
    });

  useEffect(() => {
    if (vendorIdCheckError) {
      setVendorIdError("Error checking Vendor ID availability");
    } else if (isVendorIdUnique === false) {
      setVendorIdError("Vendor ID already exists");
    } else {
      setVendorIdError(null);
    }
  }, [isVendorIdUnique, vendorIdCheckError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVendorData((prev) => ({ ...prev, [name]: value }));
    if (name === "vendorId") {
      setVendorIdError(null); // Reset error on change
    }
  };

  const handleBrandChange = (value) => {
    const selectedBrand = brands.find((brand) => brand.id === value);
    setVendorData((prev) => ({
      ...prev,
      brandId: value,
      brandSlug: selectedBrand ? selectedBrand.brandSlug : "",
    }));
    form.setFieldsValue({ brandId: value });
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      if (vendorIdError || isVendorIdUnique === false) {
        toast.error("Please fix the Vendor ID error before submitting.");
        return;
      }
      const vendor = await createVendor({
        vendorId: vendorData.vendorId,
        vendorName: vendorData.vendorName,
        brandId: vendorData.brandId || null,
        brandSlug: vendorData.brandSlug || null,
      }).unwrap();

      // Send notification
      await sendNotification({
        userId: auth?.user?.userId, // Adjust based on AuthContext
        title: "New Vendor Created",
        message: `Vendor ${vendorData.vendorName} (${vendorData.vendorId}) has been created.`,
      }).unwrap();

      setVendorData({
        vendorId: "",
        vendorName: "",
        brandId: "",
        brandSlug: "",
      });
      form.resetFields();
      onClose();
    } catch (err) {
      const errorMessage =
        err.status === 400 && err.data?.message.includes("vendorId")
          ? "Vendor ID already exists. Please use a unique ID."
          : err.data?.message || "Failed to create vendor";
      toast.error(errorMessage);
    }
  };

  return (
    <Modal
      title="Add New Vendor"
      open={show}
      onCancel={onClose}
      footer={null}
      centered
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        {brandsError && (
          <Alert
            message="Failed to load brands"
            description={brandsError?.data?.message || "Unknown error"}
            type="error"
            showIcon
            className="mb-3"
          />
        )}
        <Form.Item
          label="Vendor ID"
          name="vendorId"
          rules={[
            { required: true, message: "Please enter a Vendor ID" },
            { min: 3, message: "Vendor ID must be at least 3 characters" },
          ]}
          validateStatus={vendorIdError ? "error" : ""}
          help={vendorIdError}
        >
          <Input
            name="vendorId"
            value={vendorData.vendorId}
            onChange={handleChange}
            placeholder="e.g., VEND123"
          />
        </Form.Item>
        <div
          style={{ color: "#8c8c8c", fontSize: "12px", marginBottom: "16px" }}
        >
          Must be unique (e.g., VEND123).
        </div>
        <Form.Item
          label="Vendor Name"
          name="vendorName"
          rules={[{ required: true, message: "Please enter a Vendor Name" }]}
        >
          <Input
            name="vendorName"
            value={vendorData.vendorName}
            onChange={handleChange}
            placeholder="e.g., Acme Supplies"
          />
        </Form.Item>
        <Form.Item label="Brand" name="brandId">
          <Select
            style={{ width: "100%" }}
            value={vendorData.brandId || undefined}
            onChange={handleBrandChange}
            placeholder={
              isBrandsLoading ? "Loading brands..." : "Select a brand"
            }
            loading={isBrandsLoading}
            disabled={isBrandsLoading}
            aria-label="Select a brand"
            options={brands.map((brand) => ({
              value: brand.id,
              label: `${brand.brandName} (${brand.brandSlug})`,
            }))}
          />
        </Form.Item>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            onClick={onClose}
            disabled={isCreating || isBrandsLoading}
            style={{ marginRight: "10px" }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            disabled={isCreating || isBrandsLoading || vendorIdError}
            loading={isCreating}
          >
            Save Vendor
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddVendorModal;
