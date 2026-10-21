import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Input, InputNumber, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  LeftOutlined,
  MinusOutlined,
  PlusOutlined,
  RightOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import '../../utils/pdfjs';
import {
  catalogueFileUrl,
  useGetCatalogueQuery,
  useSaveCatalogueTextMutation,
} from '../../api/catalogueApi';
import { token } from '../../components/Quotation/quotationPdf';
import './catalogues.css';

const { Text } = Typography;
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** One page, drawn only when it is near the screen (big catalogues stay fast). */
function LazyPage({ number, width, ratio, query, onVisible, registerRef }) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    registerRef(number, el);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setNear(true);
            if (e.intersectionRatio > 0.4) onVisible(number);
          }
        }
      },
      { rootMargin: '800px 0px', threshold: [0, 0.4] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [number, onVisible, registerRef]);

  const re = useMemo(
    () => (query && query.length >= 2 ? new RegExp(escapeRe(query), 'gi') : null),
    [query],
  );
  const renderText = useCallback(
    ({ str }) => (re ? str.replace(re, (m) => `<mark class="cat-mark">${m}</mark>`) : str),
    [re],
  );

  return (
    <div
      ref={ref}
      className="cat-page"
      style={{ width, minHeight: Math.round(width * ratio) }}
      data-page={number}
    >
      {near ? (
        <Page
          pageNumber={number}
          width={width}
          customTextRenderer={renderText}
          renderAnnotationLayer={false}
          loading={<Spin />}
        />
      ) : null}
      <span className="cat-page__no">{number}</span>
    </div>
  );
}

/** Catalogue viewer: every page in one scroll, zoom, go to page, search with highlights. */
export default function CatalogueViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data } = useGetCatalogueQuery(id);
  const cat = data?.catalogue;
  const [saveText] = useSaveCatalogueTextMutation();

  const [numPages, setNumPages] = useState(0);
  const [ratio, setRatio] = useState(1.414);
  const [zoom, setZoom] = useState(1);
  const [current, setCurrent] = useState(1);
  const [query, setQuery] = useState(params.get('q') || '');
  const [activeQuery, setActiveQuery] = useState(params.get('q') || '');
  const [hits, setHits] = useState(null); // [{ page, count }]
  const [hitIndex, setHitIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const scroller = useRef(null);
  const pageEls = useRef({});
  const pdfRef = useRef(null);
  const textCache = useRef({});
  const [boxWidth, setBoxWidth] = useState(900);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setBoxWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const width = Math.max(320, Math.min(1400, Math.round((boxWidth - 48) * zoom)));

  const file = useMemo(
    () => ({ url: catalogueFileUrl(id), httpHeaders: { Authorization: `Bearer ${token()}` } }),
    [id],
  );
  const options = useMemo(() => ({ rangeChunkSize: 1 << 20, disableAutoFetch: true }), []);

  const goTo = useCallback((n) => {
    const el = pageEls.current[n];
    if (el && scroller.current)
      scroller.current.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' });
  }, []);
  const registerRef = useCallback((n, el) => {
    pageEls.current[n] = el;
  }, []);
  const onVisible = useCallback((n) => setCurrent(n), []);

  const onLoad = async (pdf) => {
    pdfRef.current = pdf;
    setNumPages(pdf.numPages);
    try {
      const p1 = await pdf.getPage(1);
      const vp = p1.getViewport({ scale: 1 });
      setRatio(vp.height / vp.width);
    } catch {
      /* keep A4 */
    }
    const start = Number(params.get('page'));
    if (start > 1) setTimeout(() => goTo(start), 400);
  };

  // search: read page text (cached), count matches per page
  const runSearch = useCallback(
    async (term) => {
      const pdf = pdfRef.current;
      setActiveQuery(term);
      if (!pdf || term.trim().length < 2) {
        setHits(null);
        return;
      }
      setSearching(true);
      const re = new RegExp(escapeRe(term.trim()), 'gi');
      const found = [];
      let readAll = true;
      for (let i = 1; i <= pdf.numPages; i++) {
        if (textCache.current[i] == null) {
          try {
            const page = await pdf.getPage(i);
            const tc = await page.getTextContent();
            textCache.current[i] = tc.items.map((it) => it.str).join(' ');
          } catch {
            textCache.current[i] = '';
            readAll = false;
          }
        }
        const t = textCache.current[i];
        const n = (t.match(re) || []).length;
        if (n) {
          const at = t.toLowerCase().indexOf(term.trim().toLowerCase());
          found.push({
            page: i,
            count: n,
            snippet: `…${t.slice(Math.max(0, at - 40), at + term.trim().length + 50)}…`,
          });
        }
      }
      setHits(found);
      setHitIndex(0);
      setSearching(false);
      if (found.length) goTo(found[0].page);
      // first full read of an un-indexed catalogue: save its text so the catalogue list can search it
      if (readAll && cat && !cat.textIndexed) {
        saveText({
          id,
          pages: Array.from({ length: pdf.numPages }, (_, k) => textCache.current[k + 1] || ''),
          pageCount: pdf.numPages,
        }).catch(() => {});
      }
    },
    [goTo, cat, id, saveText],
  );

  // a search passed in the link runs once the PDF is open
  useEffect(() => {
    if (!numPages || !params.get('q')) return undefined;
    const t = setTimeout(() => runSearch(params.get('q')), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages]);

  const totalMatches = (hits || []).reduce((a, h) => a + h.count, 0);
  const step = (d) => {
    if (!hits?.length) return;
    const i = (hitIndex + d + hits.length) % hits.length;
    setHitIndex(i);
    goTo(hits[i].page);
  };

  return (
    <div className="page-wrapper cat-viewer">
      <div className="cat-toolbar">
        <Space size={8} wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/catalogues')} />
          <div style={{ minWidth: 0 }}>
            <Text strong ellipsis style={{ maxWidth: 320, display: 'block' }}>
              {cat?.title || 'Catalogue'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {[cat?.brandName, numPages ? `${numPages} pages` : null].filter(Boolean).join(' · ')}
            </Text>
          </div>
        </Space>
        <Space size={6} wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search in this catalogue"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value) {
                setHits(null);
                setActiveQuery('');
                setParams({});
              }
            }}
            onPressEnter={() =>
              activeQuery === query && hits?.length ? step(1) : runSearch(query)
            }
            style={{ width: 260 }}
          />
          {searching ? (
            <Spin size="small" />
          ) : hits ? (
            <Space size={2}>
              <Tag color={hits.length ? 'red' : 'default'}>
                {hits.length
                  ? `${hitIndex + 1}/${hits.length} pages · ${totalMatches} matches`
                  : 'Not found'}
              </Tag>
              <Button
                size="small"
                icon={<LeftOutlined />}
                disabled={!hits.length}
                onClick={() => step(-1)}
              />
              <Button
                size="small"
                icon={<RightOutlined />}
                disabled={!hits.length}
                onClick={() => step(1)}
              />
            </Space>
          ) : null}
          <span className="cat-sep" />
          <Tooltip title="Go to page">
            <InputNumber
              size="middle"
              min={1}
              max={numPages || 1}
              value={current}
              onChange={(v) => v && goTo(v)}
              style={{ width: 76 }}
              addonAfter={`/ ${numPages || '…'}`}
            />
          </Tooltip>
          <Button
            icon={<MinusOutlined />}
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))}
          />
          <Button onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</Button>
          <Button
            icon={<PlusOutlined />}
            onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.15).toFixed(2)))}
          />
          <Button
            icon={<DownloadOutlined />}
            onClick={async () => {
              const r = await fetch(catalogueFileUrl(id), {
                headers: { Authorization: `Bearer ${token()}` },
              });
              const url = URL.createObjectURL(await r.blob());
              const a = document.createElement('a');
              a.href = url;
              a.download = cat?.fileName || 'catalogue.pdf';
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 2000);
            }}
          />
        </Space>
      </div>

      <div className="cat-layout">
        {hits?.length ? (
          <aside className="cat-results">
            <div className="cat-results__head">
              “{activeQuery}” on {hits.length} page{hits.length === 1 ? '' : 's'}
            </div>
            {hits.map((h, i) => {
              return (
                <button
                  key={h.page}
                  className={`cat-result ${i === hitIndex ? 'is-active' : ''}`}
                  onClick={() => {
                    setHitIndex(i);
                    goTo(h.page);
                  }}
                >
                  <span className="cat-result__page">Page {h.page}</span>
                  <span className="cat-result__text">{h.snippet}</span>
                </button>
              );
            })}
          </aside>
        ) : null}
        <div className="cat-scroll" ref={scroller}>
          <Document
            file={file}
            options={options}
            onLoadSuccess={onLoad}
            loading={<Spin tip="Opening the catalogue…" style={{ marginTop: 80 }} />}
            error={<Text type="danger">The catalogue could not be opened.</Text>}
          >
            {Array.from({ length: numPages }, (_, i) => (
              <LazyPage
                key={i + 1}
                number={i + 1}
                width={width}
                ratio={ratio}
                query={activeQuery}
                onVisible={onVisible}
                registerRef={registerRef}
              />
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
}
