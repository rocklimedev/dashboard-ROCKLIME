import React, { useState } from "react";
import { Modal, Form, Input, Select, Button, Alert, Spin } from "antd";
import { useGetAllBrandsQuery } from "../../api/brandsApi";
import { toast } from "sonner";

const { Option } = Select;

const AddVendorModal = ({ show, onClose, onSave, isCreatingVendor }) => {
  const {
    data: brandsData,
    isLoading: isBrandsLoading,
    error: brandsError,
  } = useGetAllBrandsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const brands = brandsData || [];
  const [form] = Form.useForm();
  const [vendorData, setVendorData] = useState({
    vendorId: "",
    vendorName: "",
    brandId: "",
    brandSlug: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVendorData((prev) => ({ ...prev, [name]: value }));
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
    if (!vendorData.vendorId || !vendorData.vendorName) {
      toast.error("Vendor ID and Name are required.");
      return;
    }
    try {
      await onSave({
        vendorId: vendorData.vendorId,
        vendorName: vendorData.vendorName,
        brandId: vendorData.brandId || null,
        brandSlug: vendorData.brandSlug || null,
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
          />
        )}
        <Form.Item
          label="Vendor ID"
          name="vendorId"
          rules={[{ required: true, message: "Please enter a Vendor ID" }]}
        >
          <Input
            name="vendorId"
            value={vendorData.vendorId}
            onChange={handleChange}
            placeholder="e.g., VEND123"
          />
          <div style={{ color: "#8c8c8c", fontSize: "12px" }}>
            Must be unique (e.g., VEND123).
          </div>
        </Form.Item>
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
            disabled={isCreatingVendor}
            style={{ marginRight: "10px" }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            disabled={isCreatingVendor || isBrandsLoading}
          >
            {isCreatingVendor ? <Spin size="small" /> : "Save Vendor"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddVendorModal;
