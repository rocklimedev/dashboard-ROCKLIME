const cleanPart = (value, fallback) =>
  Array.from(String(value ?? ''), (character) =>
    character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127 ? '-' : character,
  )
    .join('')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '')
    .trim() || fallback;
function documentExportFilename({
  customerName,
  documentNumber,
  date,
  extension = 'pdf',
  documentType = 'quotation',
  formats = {},
}) {
  let formattedDate = 'Undated';
  const value = date ? new Date(date) : null;
  if (value && !Number.isNaN(value.getTime())) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: formats.dateFormat === 'DD-MMM-YYYY' ? 'short' : '2-digit',
      year: 'numeric',
    }).formatToParts(value);
    const part = (type) => parts.find((p) => p.type === type).value;
    formattedDate =
      formats.dateFormat === 'YYYY-MM-DD'
        ? [part('year'), part('month'), part('day')].join('-')
        : [part('day'), part('month'), part('year')].join('-');
  }
  const tokens = {
    customer: cleanPart(customerName, 'Customer').slice(0, 100),
    number: cleanPart(documentNumber, 'Document').slice(0, 80),
    date: formattedDate,
  };
  const template = formats[documentType] || '{customer} - {number} - {date}';
  return (
    cleanPart(
      template.replace(/\{(customer|number|date)\}/g, (_, key) => tokens[key]),
      'Document',
    ).slice(0, 220) +
    '.' +
    cleanPart(extension, 'pdf')
  );
}
async function configuredDocumentExportFilename(options) {
  const formats = await require('../modules/settings/settings.service').getSetting(
    'documentExports',
  );
  return documentExportFilename({ ...options, formats });
}
module.exports = { documentExportFilename, configuredDocumentExportFilename };
