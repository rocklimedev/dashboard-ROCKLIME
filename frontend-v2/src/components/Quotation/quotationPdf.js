import { PDFDocument } from 'pdf-lib';
import { API_URL } from '../../store/config';

export const token = () => localStorage.getItem('token') || sessionStorage.getItem('token');

// cover: true / false, or null to follow the "cover page" setting
export async function fetchPdf(
  id,
  {
    style = 'detailed',
    cover = null,
    version = null,
    exportOptions,
    pageOrder,
    resourcePath = null,
    documentLabel = 'Quotation',
  } = {},
) {
  const p = new URLSearchParams({ style });
  if (cover != null) p.set('cover', cover ? '1' : '0');
  if (exportOptions) p.set('exportOptions', JSON.stringify(exportOptions));
  if (version) p.set('version', version);
  const r = await fetch(`${API_URL}${resourcePath || `/quotation/${id}`}/pdf?${p}`, {
    headers: { Authorization: `Bearer ${token()}` },
  });
  if (!r.ok) {
    let msg = 'Could not make the PDF';
    try {
      msg = (await r.json()).message || msg;
    } catch {
      /* not JSON */
    }
    throw new Error(msg);
  }
  const name =
    /filename="([^"]+)"/.exec(r.headers.get('Content-Disposition') || '')?.[1] ||
    `${documentLabel}.pdf`;
  let blob = await r.blob();
  const source = await PDFDocument.load(await blob.arrayBuffer());
  let labels = [];
  try {
    labels = JSON.parse(decodeURIComponent(r.headers.get('X-Quotation-Pages') || ''));
  } catch {
    /* older server */
  }
  if (!Array.isArray(labels) || labels.length !== source.getPageCount()) {
    try {
      labels = JSON.parse(source.getSubject() || '{}').quotationPages || [];
    } catch {
      labels = [];
    }
  }
  const names = Array.isArray(labels) ? labels : [];
  const occurrences = new Map();
  const pages = source.getPageIndices().map((i) => {
    const name = names[i] || `${documentLabel} page ${i + 1}`;
    const part = (occurrences.get(name) || 0) + 1;
    occurrences.set(name, part);
    return { id: i, label: part > 1 ? `${name} (continued ${part})` : name };
  });
  if (pageOrder) {
    const selected = pageOrder.filter((i) => Number.isInteger(i) && i >= 0 && i < pages.length);
    if (!selected.length) throw new Error('Select at least one page to export.');
    const output = await PDFDocument.create();
    for (const page of await output.copyPages(source, selected)) output.addPage(page);
    blob = new Blob([await output.save()], { type: 'application/pdf' });
  }
  return { blob, name, pages };
}

/** Downloads the server-made PDF of a quotation. */
export async function downloadQuotationPdf(id, opts) {
  const { blob, name } = await fetchPdf(id, opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** PDF of a quotation that is not saved yet (cart preview), in the same format. */
export async function fetchDraftPdf(draft, { style = 'detailed', cover = null } = {}) {
  const r = await fetch(`${API_URL}/quotation/preview-pdf`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ draft, style, cover }),
  });
  if (!r.ok) {
    let msg = 'Could not make the preview';
    try {
      msg = (await r.json()).message || msg;
    } catch {
      /* not JSON */
    }
    throw new Error(msg);
  }
  return r.blob();
}
