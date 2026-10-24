import { Button, Dropdown } from 'antd';
import { toast } from 'sonner';
import { DownloadOutlined } from '@ant-design/icons';

/** Export only the explicitly projected rows supplied by a screen, never raw API records. */
export default function ListExportActions({
  data,
  title = 'Records',
  options = { pdf: true, excel: true },
}) {
  if (!Array.isArray(data)) return null;
  const items = [
    options.pdf && { key: 'pdf', label: 'Download PDF' },
    options.excel && { key: 'excel', label: 'Download Excel' },
  ].filter(Boolean);
  if (!items.length) return null;
  const download = async ({ key }) => {
    if (!data.length) return;
    const filename =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '') || 'records';
    try {
      if (key === 'excel') {
        const XLSX = await import('xlsx');
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), 'Records');
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      } else {
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([
          import('jspdf'),
          import('jspdf-autotable'),
        ]);
        const doc = new jsPDF();
        const headers = Object.keys(data[0]);
        doc.setFontSize(16);
        doc.text(`${title} Report`, 14, 20);
        autoTable(doc, {
          head: [headers],
          body: data.map((row) => headers.map((header) => String(row[header] ?? '—'))),
          startY: 30,
        });
        doc.save(`${filename}.pdf`);
      }
    } catch {
      toast.error('Export failed. Please try again.');
    }
  };
  return (
    <Dropdown menu={{ items, onClick: download }} disabled={!data.length} trigger={['click']}>
      <Button icon={<DownloadOutlined />}>Export visible rows</Button>
    </Dropdown>
  );
}
