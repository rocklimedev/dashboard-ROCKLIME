import './DocumentExportOptions.styles.css';
import { Button, Checkbox, Divider, Dropdown, Typography } from 'antd';
import { SettingOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
const { Text } = Typography;
export default function DocumentExportOptions({
  exportOptions,
  setExportOptions,
  pages,
  pageOrder,
  setPageOrder,
  setPdfCover,
  documentLabel = 'quotation',
  pdfOnly = false,
  hasRooms = true,
  onExpand,
}) {
  const resetPages = () => setPageOrder(null);
  const selectedPages = pageOrder ?? pages.map((page) => page.id);
  const movePage = (index, direction) => {
    const next = [...selectedPages];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setPageOrder(next);
  };
  return (
    <Dropdown
      trigger={['click']}
      placement="bottomRight"
      dropdownRender={() => (
        <div className="fv2-documentexportoptions-5f69e0bdd3">
          <Text strong>{pdfOnly ? 'PDF export fields' : 'Export fields (PDF & Excel)'}</Text>
          <div className="fv2-documentexportoptions-d5bf6c693d">
            {[
              ['image', 'Image'],
              ['name', 'Product name'],
              ['code', 'Company code'],
              ['sno', 'S.No'],
              ['qty', 'Quantity'],
              ['mrp', 'MRP'],
              ['price', 'Unit price'],
              ['discount', 'Discount'],
              ['total', 'Amount'],
              ['roomTotals', 'Room totals'],
            ].map(([key, label]) =>
              key === 'roomTotals' && !hasRooms ? null : (
                <div key={key}>
                  <Checkbox
                    checked={!exportOptions.hidden.includes(key)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      resetPages();
                      setExportOptions((current) => ({
                        hidden: checked
                          ? current.hidden.filter((k) => k !== key)
                          : [...current.hidden, key],
                      }));
                    }}
                  >
                    {label}
                  </Checkbox>
                </div>
              ),
            )}
          </div>
          <Divider className="fv2-documentexportoptions-f558ec376e" />
          {onExpand && <Button block onClick={onExpand}>Expand view</Button>}<Text strong>PDF pages — include & order</Text>
          <div>
            <Text type="secondary">
              {hasRooms ? 'Room pages' : 'Pages'} appear after the preview loads. Excluding pages
              does not change {documentLabel} totals.
            </Text>
          </div>
          {[...pages]
            .sort((a, b) => {
              const ai = selectedPages.indexOf(a.id),
                bi = selectedPages.indexOf(b.id);
              return (ai < 0 ? pages.length + a.id : ai) - (bi < 0 ? pages.length + b.id : bi);
            })
            .map((page) => {
              const index = selectedPages.indexOf(page.id);
              return (
                <div className="fv2-documentexportoptions-6d22fb2064" key={page.id}>
                  <Checkbox
                    className="fv2-documentexportoptions-38de269a3f"

                    checked={index >= 0}
                    disabled={index >= 0 && selectedPages.length === 1}
                    onChange={(e) =>
                      setPageOrder(
                        e.target.checked
                          ? [...selectedPages, page.id]
                          : selectedPages.filter((i) => i !== page.id),
                      )
                    }
                  >
                    {page.id + 1}. {page.label}
                    {index >= 0 ? ` (export ${index + 1})` : ''}
                  </Checkbox>
                  <Button
                    size="small"
                    aria-label={`Move ${page.label} up`}
                    icon={<ArrowUpOutlined />}
                    disabled={index <= 0}
                    onClick={() => movePage(index, -1)}
                  />
                  <Button
                    size="small"
                    aria-label={`Move ${page.label} down`}
                    icon={<ArrowDownOutlined />}
                    disabled={index < 0 || index === selectedPages.length - 1}
                    onClick={() => movePage(index, 1)}
                  />
                </div>
              );
            })}
          <Button
            type="link"
            block
            onClick={() => {
              setExportOptions({ hidden: [] });
              resetPages();
              setPdfCover(true);
            }}
          >
            Reset defaults
          </Button>
        </div>
      )}
    >
      <Button icon={<SettingOutlined />}>Export options</Button>
    </Dropdown>
  );
}
