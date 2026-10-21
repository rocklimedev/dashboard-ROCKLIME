import { useState } from 'react';
import { Button, Card, Space, message } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import ReportBuilderModal from '../modals/ReportBuilderModal';
import { generatePDF, generateExcel } from '../../utils/helpers';

const metaValue = (details, id, slug) =>
  details?.find((d) => d.id === id || d.slug?.replace(/[_\s-]/g, '').toLowerCase() === slug)?.value;
const companyCode = (details) =>
  metaValue(details, 'd11da9f9-3f2e-4536-8236-9671200cca4a', 'companycode') || '—';
const sellingPrice = (details) => {
  const value = metaValue(details, '9ba862ef-f993-4873-95ef-1fef10036aa5', 'sellingprice');
  return value != null && String(value).trim() && Number.isFinite(Number(value))
    ? Number(value)
    : null;
};

export default function InventoryReportActions({ products, loading }) {
  const [builderOpen, setBuilderOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const monthlyReport = async () => {
    setGenerating(true);
    try {
      const month = new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      await generatePDF(
        products.map((p, index) => ({
          'S.No': index + 1,
          'Company Code': companyCode(p.metaDetails),
          Name: p.name || 'Unnamed Product',
          Quantity: Number(p.quantity) || 0,
          Updated: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('en-IN') : '—',
        })),
        `Monthly Stock Report - ${month}`,
      );
      message.success('Monthly report generated successfully!');
    } catch {
      message.error('Failed to generate monthly report');
    } finally {
      setGenerating(false);
    }
  };
  return (
    <Card title="Inventory Reports" style={{ marginBottom: 24, borderRadius: 12 }}>
      <Space wrap>
        <Button
          type="primary"
          icon={<FileTextOutlined />}
          disabled={loading || !products.length}
          onClick={() => setBuilderOpen(true)}
        >
          Build Report
        </Button>
        <Button
          icon={<DownloadOutlined />}
          loading={generating}
          disabled={loading || !products.length}
          onClick={monthlyReport}
        >
          Monthly Report
        </Button>
      </Space>
      {builderOpen && (
        <ReportBuilderModal
          open
          onClose={() => setBuilderOpen(false)}
          products={products}
          getCompanyCode={companyCode}
          getSellingPrice={sellingPrice}
          generatePDF={generatePDF}
          generateExcel={generateExcel}
        />
      )}
    </Card>
  );
}
