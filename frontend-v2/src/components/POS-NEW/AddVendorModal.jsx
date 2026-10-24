import ModalShell from '../Common/ModalShell';
import './AddVendorModal.styles.css';
import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Alert } from 'antd';
import { toast } from 'sonner';
import { useCheckVendorIdQuery, useCreateVendorMutation } from '../../api/vendorApi'; // Your vendor API hooks
import { useSendNotificationMutation } from '../../api/notificationApi';
import { useGetAllBrandsQuery } from '../../api/brandsApi';
import { useAuth } from '../../context/AuthContext';

const { Option } = Select;

const AddVendorModal = ({ show, onClose }) => {
  const { auth } = useAuth();

  // Fetch brands
  const {
    data: brandsData,
    isLoading: isBrandsLoading,
    error: brandsError,
  } = useGetAllBrandsQuery(undefined, { refetchOnMountOrArgChange: true });
  const brands = brandsData || [];

  // Vendor API
  const [createVendor, { isLoading: isCreating }] = useCreateVendorMutation();
  const [sendNotification] = useSendNotificationMutation();

  // Form and state
  const [form] = Form.useForm();
  const [vendorData, setVendorData] = useState({
    vendorId: '',
    vendorName: '',
    brandId: '',
    brandSlug: '',
  });
  const [vendorIdError, setVendorIdError] = useState(null);

  // Check vendorId uniqueness only if provided
  const { data: isVendorIdUnique, error: vendorIdCheckError } = useCheckVendorIdQuery(
    vendorData.vendorId,
    {
      skip: !vendorData.vendorId || vendorData.vendorId.trim().length < 3,
    },
  );

  useEffect(() => {
    if (!vendorData.vendorId || vendorData.vendorId.trim() === '') {
      setVendorIdError(null); // No error if empty
    } else if (vendorIdCheckError) {
      setVendorIdError('Error checking Vendor ID availability');
    } else if (isVendorIdUnique === false) {
      setVendorIdError('Vendor ID already exists');
    } else {
      setVendorIdError(null);
    }
  }, [vendorIdCheckError, isVendorIdUnique, vendorData.vendorId]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setVendorData((prev) => ({ ...prev, [name]: value }));
    if (name === 'vendorId') setVendorIdError(null);
  };

  // Handle brand selection
  const handleBrandChange = (value) => {
    const selectedBrand = brands.find((b) => b.id === value);
    setVendorData((prev) => ({
      ...prev,
      brandId: value,
      brandSlug: selectedBrand ? selectedBrand.brandSlug : '',
    }));
    form.setFieldsValue({ brandId: value });
  };

  // Submit form
  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (vendorIdError || isVendorIdUnique === false) {
        toast.error('Please fix the Vendor ID error before submitting.');
        return;
      }

      const vendor = await createVendor({
        vendorId: vendorData.vendorId?.trim() || null,
        vendorName: vendorData.vendorName,
        brandId: vendorData.brandId || null,
        brandSlug: vendorData.brandSlug || null,
      }).unwrap();

      // Send notification
      await sendNotification({
        userId: auth?.user?.userId,
        title: 'New Vendor Created',
        message: `Vendor ${vendorData.vendorName}${
          vendorData.vendorId ? ` (${vendorData.vendorId})` : ''
        } has been created.`,
      }).unwrap();

      // Reset form
      setVendorData({
        vendorId: '',
        vendorName: '',
        brandId: '',
        brandSlug: '',
      });
      form.resetFields();
      onClose();
      toast.success('Vendor created successfully!');
    } catch (err) {
      const errorMessage =
        err.status === 400 && err.data?.message.includes('vendorId')
          ? 'Vendor ID already exists. Please use a unique ID.'
          : err.data?.message || 'Failed to create vendor';
      toast.error(errorMessage);
    }
  };

  return (
    <ModalShell
      title="Add New Vendor"
      open={show}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={<>Save Vendor</>}
      onCancelButton={onClose}
      confirmLoading={isCreating}
      okButtonProps={{ disabled: isCreating || isBrandsLoading || vendorIdError }}
      cancelButtonProps={{
        className: 'fv2-addvendormodal-18183f3181',
        disabled: isCreating || isBrandsLoading,
      }}
      centered
    >
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        {brandsError && (
          <Alert
            message="Failed to load brands"
            description={brandsError?.data?.message || 'Unknown error'}
            type="error"
            showIcon
            className="mb-3"
          />
        )}

        <Form.Item
          label="Vendor ID (Optional)"
          name="vendorId"
          rules={[{ min: 3, message: 'Vendor ID must be at least 3 characters' }]}
          validateStatus={vendorIdError ? 'error' : ''}
          help={vendorIdError}
        >
          <Input
            name="vendorId"
            value={vendorData.vendorId}
            onChange={handleChange}
            placeholder="e.g., VEND123 (optional)"
          />
        </Form.Item>
        <div className="fv2-addvendormodal-fa37dcc86a">
          Must be unique if provided (e.g., VEND123).
        </div>

        <Form.Item
          label="Vendor Name"
          name="vendorName"
          rules={[{ required: true, message: 'Please enter a Vendor Name' }]}
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
            className="fv2-addvendormodal-57a6721a26"

            value={vendorData.brandId || undefined}
            onChange={handleBrandChange}
            placeholder={isBrandsLoading ? 'Loading brands...' : 'Select a brand'}
            loading={isBrandsLoading}
            disabled={isBrandsLoading}
            aria-label="Select a brand"
            options={brands.map((brand) => ({
              value: brand.id,
              label: `${brand.brandName} (${brand.brandSlug})`,
            }))}
          />
        </Form.Item>
      </Form>
    </ModalShell>
  );
};

export default AddVendorModal;
