import ModalShell from '../Common/ModalShell';
import './ReportBuilderModal.styles.css';
// src/components/inventory/ReportBuilderModal.jsx
import React, { useState } from 'react';
import { Input, Table, Button, Space, Typography, Empty, Select } from 'antd';
import { toast } from 'sonner';
import { FileTextOutlined, FilePdfOutlined, FileExcelOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const ReportBuilderModal = ({
  open,
  onClose,
  products,
  getCompanyCode,
  getSellingPrice,
  generatePDF,
  generateExcel,
}) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  const handleAddProduct = (productId) => {
    if (!selectedIds.includes(productId)) {
      setSelectedIds([...selectedIds, productId]);
      toast.success('Product added to report');
    } else {
      toast.info('Already added');
    }
    setSearchValue(''); // Clear input
  };

  const handleRemove = (id) => {
    setSelectedIds(selectedIds.filter((x) => x !== id));
  };

  const selectedProducts = products.filter((p) => selectedIds.includes(p.productId));

  const generateReport = (format) => {
    const reportData = selectedProducts.map((p) => ({
      Name: p.name || 'Unnamed Product',
      'Product Code': p.product_code || '—',
      'Company Code': getCompanyCode(p.metaDetails),
      'Selling Price': getSellingPrice(p.metaDetails)
        ? `₹${getSellingPrice(p.metaDetails).toLocaleString('en-IN')}`
        : '—',
      Stock: p.quantity,
      Status: p.quantity === 0 ? 'Out of Stock' : p.quantity <= 10 ? 'Low Stock' : 'In Stock',
    }));

    const title = `Custom Report - ${new Date().toLocaleDateString('en-IN')}`;
    format === 'pdf' ? generatePDF(reportData, title) : generateExcel(reportData, title);

    onClose();
  };

  return (
    <ModalShell
      title={
        <Title level={4}>
          <FileTextOutlined /> Build Custom Report
        </Title>
      }
      open={open}
      onCancel={() => {
        onClose();
        setSelectedIds([]);
        setSearchValue('');
      }}
      width={1100}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="pdf"
          type="primary"
          danger
          icon={<FilePdfOutlined />}
          onClick={() => generateReport('pdf')}
          disabled={selectedIds.length === 0}
        >
          PDF ({selectedIds.length})
        </Button>,
        <Button
          key="excel"
          type="primary"
          icon={<FileExcelOutlined />}
          onClick={() => generateReport('excel')}
          disabled={selectedIds.length === 0}
        >
          Excel ({selectedIds.length})
        </Button>,
      ]}
    >
      <Space className="fv2-reportbuildermodal-2e9aea9e25" direction="vertical" size="large">
        {/* Search Dropdown */}
        <div>
          <Text strong>Add Product to Report</Text>
          <Select
            className="fv2-reportbuildermodal-4124252bcf"
            showSearch

            placeholder="Search by name, code, or company code..."
            value={searchValue}
            onChange={handleAddProduct}
            onSearch={setSearchValue}
            filterOption={false}
            notFoundContent="No product found"
            size="large"
            dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
          >
            {products
              .filter((p) => {
                const query = searchValue.toLowerCase();
                return (
                  p.name?.toLowerCase().includes(query) ||
                  p.product_code?.toLowerCase().includes(query) ||
                  getCompanyCode(p.metaDetails).toLowerCase().includes(query)
                );
              })
              .filter((p) => !selectedIds.includes(p.productId)) // Hide already added
              .slice(0, 50) // Limit for performance
              .map((p) => (
                <Option key={p.productId} value={p.productId}>
                  <div className="fv2-reportbuildermodal-24bed8093c">
                    <span>
                      <strong>{p.name || 'Unnamed'}</strong>
                    </span>
                    <span className="fv2-reportbuildermodal-a8fe090131">
                      {p.product_code} • {getCompanyCode(p.metaDetails)} • Stock: {p.quantity}
                    </span>
                  </div>
                </Option>
              ))}
          </Select>
        </div>

        {/* Selected Products */}
        <div>
          <Text strong>
            Selected Products ({selectedIds.length})
            {selectedIds.length > 0 && (
              <Button
                className="fv2-reportbuildermodal-96620f34ea"
                size="small"
                danger
                type="text"
                onClick={() => setSelectedIds([])}
              >
                Clear All
              </Button>
            )}
          </Text>

          {selectedIds.length === 0 ? (
            <Empty description="Start typing to add products..." />
          ) : (
            <Table
              dataSource={selectedProducts}
              columns={[
                {
                  title: 'Name',
                  dataIndex: 'name',
                  render: (t) => t || 'Unnamed',
                },
                { title: 'Code', dataIndex: 'product_code' },
                {
                  title: 'Company',
                  render: (_, r) => getCompanyCode(r.metaDetails),
                },
                {
                  title: 'Price',
                  render: (_, r) => {
                    const p = getSellingPrice(r.metaDetails);
                    return p ? `₹${p.toLocaleString('en-IN')}` : '—';
                  },
                },
                { title: 'Stock', dataIndex: 'quantity' },
                {
                  title: 'Action',
                  width: 100,
                  render: (_, r) => (
                    <Button danger size="small" onClick={() => handleRemove(r.productId)}>
                      Remove
                    </Button>
                  ),
                },
              ]}
              rowKey="productId"
              pagination={{ pageSize: 8 }}
              size="small"
              scroll={{ y: 320 }}
            />
          )}
        </div>
      </Space>
    </ModalShell>
  );
};

export default ReportBuilderModal;
