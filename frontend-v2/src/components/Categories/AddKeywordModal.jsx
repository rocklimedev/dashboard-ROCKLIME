import ModalShell from '../Common/ModalShell';
import './AddKeywordModal.styles.css';
import React, { useState, useEffect } from 'react';
import { Form, Input, Select } from 'antd';
import { useCreateKeywordMutation, useUpdateKeywordMutation } from '../../api/keywordApi';
import { useGetAllCategoriesQuery } from '../../api/categoryApi';
import { toast } from 'sonner';
const AddKeywordModal = ({ open, onClose, editData, selectedCategoryId }) => {
  const [form] = Form.useForm();
  const isEditMode = !!editData;

  const { data: categoryData } = useGetAllCategoriesQuery();
  const [createKeyword] = useCreateKeywordMutation();
  const [updateKeyword] = useUpdateKeywordMutation();

  useEffect(() => {
    if (isEditMode && editData) {
      form.setFieldsValue({
        keyword: editData.keyword || '',
        categoryId: editData.categoryId || '',
      });
    } else if (selectedCategoryId) {
      form.setFieldsValue({ categoryId: selectedCategoryId });
    } else {
      form.resetFields();
    }
  }, [editData, selectedCategoryId, form, isEditMode]);

  const onFinish = async (values) => {
    try {
      if (isEditMode) {
        await updateKeyword({ id: editData.id, ...values }).unwrap();
      } else {
        await createKeyword(values).unwrap();
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save keyword');
    }
  };

  return (
    <ModalShell
      title={isEditMode ? 'Edit Keyword' : 'Add Keyword'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={<>{isEditMode ? 'Update' : 'Add'} Keyword</>}
      onCancelButton={onClose}
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="keyword"
          label="Keyword"
          rules={[{ required: true, message: 'Please enter keyword' }]}
        >
          <Input placeholder="Enter keyword" />
        </Form.Item>

        <Form.Item
          name="categoryId"
          label="Category"
          rules={[{ required: true, message: 'Please select a category' }]}
        >
          <Select placeholder="Select category" showSearch optionFilterProp="children">
            {categoryData?.categories?.map((cat) => (
              <Select.Option key={cat.categoryId} value={cat.categoryId}>
                {cat.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </ModalShell>
  );
};

export default AddKeywordModal;
