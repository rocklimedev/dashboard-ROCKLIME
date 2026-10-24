import ModalShell from '../../components/Common/ModalShell';
import './Catalogues.styles.css';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar, Button, Card, Empty, Form, Input, List, Popconfirm, Progress, Segmented, Select, Skeleton, Space, Tag, Typography, Upload } from 'antd';
import { toast } from 'sonner';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  EditOutlined,
  FilePdfOutlined,
  InboxOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { pdfjs } from '../../utils/pdfjs';
import {
  catalogueCoverUrl,
  useDeleteCatalogueMutation,
  useGetCataloguesQuery,
  useSearchCataloguesQuery,
  useUpdateCatalogueMutation,
  useUploadCatalogueMutation,
} from '../../api/catalogueApi';
import { useGetAllBrandsQuery } from '../../api/brandsApi';
import useCan from '../../utils/useCan';
import './catalogues.css';

const { Title, Text } = Typography;
const mb = (b) => `${(Number(b) / 1024 / 1024).toFixed(1)} MB`;

function useDebounced(v, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

/** Reads a PDF in the browser: page count, the text of every page (for search) and a cover image. */
async function readPdf(file, onProgress) {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages = [];
  let cover = null;
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    if (i === 1) {
      const vp = page.getViewport({ scale: 1 });
      const scale = 520 / vp.width;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport, canvas }).promise;
      cover = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    }
    const tc = await page.getTextContent();
    pages.push(tc.items.map((it) => it.str).join(' '));
    page.cleanup();
    onProgress?.(Math.round((i / pdf.numPages) * 100));
  }
  const numPages = pdf.numPages;
  pdf.destroy();
  return { pages, cover, numPages };
}

function UploadModal({ open, onClose, brands, categories }) {
  const [form] = Form.useForm();
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(null); // { label, percent }
  const [upload] = useUploadCatalogueMutation();

  const reset = () => {
    form.resetFields();
    setFile(null);
    setStep(null);
  };

  const submit = async (v) => {
    if (!file) return toast.error('Choose a PDF catalogue');
    try {
      setStep({ label: 'Reading the catalogue', percent: 0 });
      let parsed = { pages: [], cover: null, numPages: 0 };
      try {
        parsed = await readPdf(file, (p) =>
          setStep({ label: 'Reading pages for search', percent: p }),
        );
      } catch {
        toast.warning(
          'Could not read the text of this PDF; it will open, but search inside it may not work.',
        );
      }
      setStep({ label: 'Uploading', percent: 100 });
      const fd = new FormData();
      fd.append('file', file);
      if (parsed.cover) fd.append('cover', parsed.cover, 'cover.jpg');
      fd.append('title', v.title || file.name.replace(/\.pdf$/i, ''));
      if (v.brandId) fd.append('brandId', v.brandId);
      if (v.category) fd.append('category', v.category);
      if (v.year) fd.append('year', v.year);
      fd.append('pageCount', String(parsed.numPages || 0));
      fd.append('pages', JSON.stringify(parsed.pages));
      await upload(fd).unwrap();
      toast.success('Catalogue added');
      reset();
      onClose();
    } catch (e) {
      setStep(null);
      toast.error(e?.data?.message || 'Upload failed');
    }
  };

  return (
    <ModalShell
      open={open}
      title="Add a brand catalogue"
      okText="Upload"
      onOk={() => form.submit()}
      confirmLoading={!!step}
      onCancel={() => {
        if (step) return;
        reset();
        onClose();
      }}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item required label="PDF file">
          <Upload.Dragger
            accept="application/pdf,.pdf"
            maxCount={1}
            beforeUpload={(f) => {
              setFile(f);
              if (!form.getFieldValue('title'))
                form.setFieldsValue({
                  title: f.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' '),
                });
              return false;
            }}
            onRemove={() => setFile(null)}
            fileList={
              file ? [{ uid: '1', name: `${file.name} · ${mb(file.size)}`, status: 'done' }] : []
            }
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Drop the brand's PDF catalogue here, or click to choose
            </p>
            <p className="ant-upload-hint">
              Up to 300 MB. The text of every page is read so you can search it.
            </p>
          </Upload.Dragger>
        </Form.Item>
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Give it a title' }]}
        >
          <Input placeholder="e.g. Grohe Bathroom Collection 2026" />
        </Form.Item>
        <Space.Compact block>
          <Form.Item className="fv2-catalogues-1bf4f3aa3f" name="brandId" label="Brand">
            <Select
              showSearch
              allowClear
              optionFilterProp="label"
              placeholder="Choose brand"
              options={brands.map((b) => ({ value: b.id, label: b.brandName }))}
            />
          </Form.Item>
          <Form.Item className="fv2-catalogues-db589665f2" name="category" label="Type">
            <Select
              allowClear
              showSearch
              placeholder="e.g. Price list"
              options={[
                ...new Set([
                  'Product catalogue',
                  'Price list',
                  'Brochure',
                  'Technical guide',
                  ...categories,
                ]),
              ].map((c) => ({ value: c, label: c }))}
            />
          </Form.Item>
          <Form.Item className="fv2-catalogues-ab275572e1" name="year" label="Year">
            <Input placeholder="2026" />
          </Form.Item>
        </Space.Compact>
        {step && (
          <div>
            <Text type="secondary">{step.label}…</Text>
            <Progress percent={step.percent} size="small" />
          </div>
        )}
      </Form>
    </ModalShell>
  );
}

function EditModal({ item, onClose, brands }) {
  const [form] = Form.useForm();
  const [save, { isLoading }] = useUpdateCatalogueMutation();
  useEffect(() => {
    if (item)
      form.setFieldsValue({
        title: item.title,
        brandId: item.brandId,
        category: item.category,
        year: item.year,
      });
  }, [item, form]);
  return (
    <ModalShell
      open={!!item}
      title="Edit catalogue"
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={isLoading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={async (v) => {
          try {
            await save({ id: item.id, ...v }).unwrap();
            onClose();
          } catch (e) {
            toast.error(e?.data?.message || 'Could not save');
          }
        }}
      >
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="brandId" label="Brand">
          <Select
            showSearch
            allowClear
            optionFilterProp="label"
            options={brands.map((b) => ({ value: b.id, label: b.brandName }))}
          />
        </Form.Item>
        <Form.Item name="category" label="Type">
          <Input />
        </Form.Item>
        <Form.Item name="year" label="Year">
          <Input />
        </Form.Item>
      </Form>
    </ModalShell>
  );
}

/** Catalogue → Brand catalogues: the real PDF catalogues, searchable page by page. */
export default function Catalogues() {
  const navigate = useNavigate();
  const can = useCan();
  const canEdit = can('products', 'edit');
  const [params] = useSearchParams();
  const [text, setText] = useState(params.get('q') || '');
  const [mode, setMode] = useState('inside'); // inside = search page text, title = filter by name
  const [brandId, setBrandId] = useState();
  const [category, setCategory] = useState();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const q = useDebounced(text.trim());

  const { data: brandsData } = useGetAllBrandsQuery();
  const brands = useMemo(
    () => (Array.isArray(brandsData) ? brandsData : brandsData?.data || []),
    [brandsData],
  );
  const brandLogo = useMemo(() => Object.fromEntries(brands.map((b) => [b.id, b.logo])), [brands]);
  const { data, isLoading } = useGetCataloguesQuery({
    search: mode === 'title' ? q : '',
    brandId,
    category,
  });
  const { data: hits, isFetching: searching } = useSearchCataloguesQuery(
    { q, brandId },
    { skip: mode !== 'inside' || q.length < 2 },
  );
  const [remove] = useDeleteCatalogueMutation();
  const rows = data?.data || [];

  // group page hits by catalogue
  const hitGroups = useMemo(() => {
    const g = new Map();
    for (const h of hits?.data || []) {
      if (!g.has(h.catalogueId)) g.set(h.catalogueId, { ...h, pages: [] });
      g.get(h.catalogueId).pages.push(h);
    }
    return [...g.values()];
  }, [hits]);
  const showHits = mode === 'inside' && q.length >= 2;

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="cat-head">
          <div>
            <Title className="fv2-catalogues-e26fa6be65" level={4}>
              Brand catalogues
            </Title>
            <Text type="secondary">Open any brand's real catalogue and search inside it.</Text>
          </div>
          {canEdit && (
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={() => setUploadOpen(true)}
            >
              Add catalogue
            </Button>
          )}
        </div>

        <div className="cat-filters">
          <Input
            className="fv2-catalogues-ef9d2c85cb"
            allowClear
            size="large"
            prefix={<SearchOutlined />}
            placeholder={
              mode === 'inside'
                ? 'Search inside all catalogues: product name, code, series…'
                : 'Filter catalogues by title'
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Segmented
            size="large"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'inside', label: 'Inside PDFs' },
              { value: 'title', label: 'Titles' },
            ]}
          />
          <Select
            className="fv2-catalogues-813211784f"
            size="large"
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="All brands"
            value={brandId}
            onChange={setBrandId}

            options={brands.map((b) => ({ value: b.id, label: b.brandName }))}
          />
          <Select
            className="fv2-catalogues-5d7d01030a"
            size="large"
            allowClear
            placeholder="All types"
            value={category}
            onChange={setCategory}

            options={(data?.categories || []).map((c) => ({ value: c, label: c }))}
          />
        </div>

        {showHits ? (
          <Card className="cat-hits" loading={searching}>
            {hitGroups.length ? (
              <List
                dataSource={hitGroups}
                renderItem={(g) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <img
                          className="cat-hit-cover"
                          src={catalogueCoverUrl(g.catalogueId)}
                          alt=""
                          onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                        />
                      }
                      title={
                        <Space wrap size={6}>
                          <Text strong>{g.title}</Text>
                          {g.brandName && <Tag>{g.brandName}</Tag>}
                          <Text type="secondary">
                            {g.pages.length} page{g.pages.length === 1 ? '' : 's'}
                          </Text>
                        </Space>
                      }
                      description={
                        <div className="cat-hit-pages">
                          {g.pages.slice(0, 12).map((p) => (
                            <button
                              key={p.page}
                              className="cat-hit-page"
                              onClick={() =>
                                navigate(
                                  `/catalogues/${g.catalogueId}?page=${p.page}&q=${encodeURIComponent(q)}`,
                                )
                              }
                            >
                              <span className="cat-hit-page__no">p. {p.page}</span>
                              <span className="cat-hit-page__text">{p.snippet}</span>
                            </button>
                          ))}
                          {g.pages.length > 12 && (
                            <Button
                              type="link"
                              onClick={() =>
                                navigate(`/catalogues/${g.catalogueId}?q=${encodeURIComponent(q)}`)
                              }
                            >
                              Open and see all {g.pages.length}
                            </Button>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description={`“${q}” is not in any catalogue`} />
            )}
          </Card>
        ) : isLoading ? (
          <Skeleton active />
        ) : rows.length ? (
          <div className="cat-grid">
            {rows.map((c) => (
              <div
                key={c.id}
                className="cat-card"
                onClick={() => navigate(`/catalogues/${c.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(`/catalogues/${c.id}`)}
              >
                <div className="cat-card__cover">
                  {c.hasCover ? (
                    <img src={catalogueCoverUrl(c.id)} alt={c.title} loading="lazy" />
                  ) : (
                    <FilePdfOutlined className="cat-card__icon" />
                  )}
                  {canEdit && (
                    <div className="cat-card__tools" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="small"
                        shape="circle"
                        icon={<EditOutlined />}
                        onClick={() => setEditing(c)}
                      />
                      <Popconfirm
                        title="Delete this catalogue?"
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => remove(c.id)}
                      >
                        <Button size="small" shape="circle" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </div>
                  )}
                </div>
                <div className="cat-card__body">
                  <div className="cat-card__brand">
                    {brandLogo[c.brandId] ? <Avatar size={18} src={brandLogo[c.brandId]} /> : null}
                    <span>{c.brandName || 'No brand'}</span>
                  </div>
                  <div className="cat-card__title">{c.title}</div>
                  <div className="cat-card__meta">
                    {[c.category, c.year, c.pages ? `${c.pages} pages` : null]
                      .filter(Boolean)
                      .join(' · ')}
                    {!c.textIndexed && (
                      <Tag className="fv2-catalogues-0b6e127c7b">no search text</Tag>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <Empty description="No catalogues yet">
              {canEdit && (
                <Button
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  onClick={() => setUploadOpen(true)}
                >
                  Add the first catalogue
                </Button>
              )}
            </Empty>
          </Card>
        )}
      </div>
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        brands={brands}
        categories={data?.categories || []}
      />
      <EditModal item={editing} onClose={() => setEditing(null)} brands={brands} />
    </div>
  );
}
