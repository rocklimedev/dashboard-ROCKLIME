import { normalizeCharges, pricingFromRecord } from '../../utils/quotationMath.js';

function asList(value) {
  for (let i = 0; i < 3 && typeof value === 'string'; i++) {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? structuredClone(value) : [];
}

export function quotationCartSnapshot(quotation, now = new Date()) {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const items = asList(quotation.items ?? quotation.products).map((item, index) => {
    const { _id, ...line } = item;
    const productId = item.productId || item.id;
    if (!productId) throw new Error('This quotation contains a product without an ID');
    return {
      ...line,
      id: productId,
      productId,
      quantity: Number(item.quantity ?? item.qty ?? 1),
      price: Number(item.price ?? item.sellingPrice ?? 0),
      priority: Number(item.priority ?? index),
    };
  });
  return {
    parent: {
      selectedCustomer: quotation.customerId || quotation.customer?.customerId || '',
      useBillingAddress: false,
      billingAddressId: null,
      quotationData: {
        ...pricingFromRecord(quotation),
        documentTitle: quotation.document_title || '',
        quotationDate: today,
        dueDate: '',
        shipTo: quotation.shipTo || null,
        floors: asList(quotation.floors),
        signatureName: quotation.signature_name ?? 'CM TRADING CO',
        signatureImage: quotation.signature_image || '',
        discountAmount: Number(quotation.extraDiscount) || 0,
        discountType: quotation.extraDiscountType || 'fixed',
        followupDates: asList(quotation.followupDates),
        miscellaneousChargeItems: normalizeCharges(
          quotation.miscellaneousChargeItems ?? quotation.miscellaneousCharges,
        ),
        additionalDiscount: Number(quotation.additionalDiscount) || 0,
        flatPrice: quotation.flatPrice == null ? null : Number(quotation.flatPrice),
      },
    },
    layout: {
      localCartItems: items,
      shipping: Number(quotation.shippingAmount) || 0,
      gst: quotation.gst == null || quotation.gst === '' ? null : Number(quotation.gst),
      itemDiscounts: Object.fromEntries(
        items.map((item) => [item.productId, Number(item.discount) || 0]),
      ),
      itemDiscountTypes: Object.fromEntries(
        items.map((item) => [item.productId, item.discountType || 'percent']),
      ),
      itemTaxes: Object.fromEntries(items.map((item) => [item.productId, Number(item.tax) || 0])),
    },
  };
}
