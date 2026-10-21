import dayjs from 'dayjs';

// Money in Indian units on cards: ₹45 L, ₹1.2 Cr (as INOS)
export const lakh = (value) => {
  const n = Number(value);
  if (value == null || value === '' || !Number.isFinite(n)) return '—';
  const trim = (x) => x.toFixed(2).replace(/\.?0+$/, '');
  if (n >= 1e7) return `₹${trim(n / 1e7)} Cr`;
  if (n >= 1e5) return `₹${trim(n / 1e5)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

/** "4.5 L", "1.2 cr", "45000", "₹45,000" → rupees */
export const parseRupees = (v) => {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v;
  const m = String(v)
    .trim()
    .match(/^₹?\s*([\d.,]+)\s*(l|lakh|lac|lakhs|cr|crore|k)?$/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  const u = (m[2] || '').toLowerCase();
  return Math.round(n * (u.startsWith('c') ? 1e7 : u.startsWith('l') ? 1e5 : u === 'k' ? 1e3 : 1));
};

export const dueText = (d) => {
  if (!d) return '';
  const n = dayjs(d).startOf('day').diff(dayjs().startOf('day'), 'day');
  return n < 0
    ? `${-n}d late`
    : n === 0
      ? 'today'
      : n === 1
        ? 'tomorrow'
        : dayjs(d).format('D MMM');
};
export const isLate = (d) => d && dayjs(d).startOf('day').isBefore(dayjs().startOf('day'));

export const TAG_COLOR = { Hot: 'red', Warm: 'orange', Cold: 'blue', VIP: 'purple' };
export const ACTIVITY_LABEL = {
  note: 'Note',
  call: 'Call',
  visit: 'Visit',
  whatsapp: 'WhatsApp',
  email: 'Email',
  stage: 'Stage',
  task: 'Follow-up',
  update: 'Edited',
  system: 'ERP',
  bigin: 'Bigin',
};

export const waLink = (phone, text = '') =>
  phone
    ? `https://wa.me/91${String(phone).replace(/\D/g, '').slice(-10)}${text ? `?text=${encodeURIComponent(text)}` : ''}`
    : null;
