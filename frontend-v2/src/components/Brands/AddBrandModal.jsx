import ModalShell from '../Common/ModalShell';
import './AddBrandModal.styles.css';
import React, { useEffect } from 'react';
import { Form, Input, Row, Col } from 'antd';
import { toast } from 'sonner';
import {
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useGetAllBrandsQuery,
} from '../../api/brandsApi';

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
        brandName: existingBrand.brandName || '',
        brandSlug: existingBrand.brandSlug || '',
      });
    } else {
      form.resetFields();
    }
  }, [existingBrand, form]);

  const handleSubmit = async (values) => {
    const { brandName, brandSlug, id } = values;

    // Check for duplicate slug (case-insensitive)
    const isDuplicate = allBrands.some(
      (brand) => brand.brandSlug?.toLowerCase() === brandSlug.toLowerCase() && brand.id !== id,
    );

    if (isDuplicate) {
      toast.error('This brand slug is already taken.');
      return;
    }

    try {
      if (id) {
        await updateBrand({ id, brandName, brandSlug }).unwrap();
        toast.success('Brand updated successfully!');
      } else {
        await createBrand({ brandName, brandSlug }).unwrap();
        toast.success('Brand created successfully!');
      }

      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save brand. Please try again.');
    }
  };

  const title = Form.useWatch('id', form) ? 'Edit Brand' : 'Add Brand';

  return (
    <ModalShell
      title={title}
      open={true} // controlled by parent visibility
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={<>{Form.useWatch('id', form) ? 'Update Brand' : 'Add Brand'}</>}
      onCancelButton={onClose}
      confirmLoading={isLoading}
      cancelButtonProps={{ className: 'fv2-addbrandmodal-98be2e43c3', disabled: isLoading }} // we use custom footer below
      maskClosable={false} // prevent closing by clicking backdrop (optional)
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          brandName: '',
          brandSlug: '',
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="brandName"
              label={
                <>
                  Brand Name <span className="fv2-addbrandmodal-6b096a9837">*</span>
                </>
              }
              rules={[
                { required: true, message: 'Please enter brand name' },
                { max: 100, message: 'Name cannot exceed 100 characters' },
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
                  Brand Slug <span className="fv2-addbrandmodal-6b096a9837">*</span>
                </>
              }
              rules={[
                { required: true, message: 'Please enter brand slug' },
                {
                  pattern: /^[a-z0-9-]+$/,
                  message: 'Slug can only contain lowercase letters, numbers, and hyphens',
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
      </Form>
    </ModalShell>
  );
};

export default AddBrand;
