// Quotation pipeline labels (shared by the list, the quotation page and dashboards).
export const STATUS_META = {
  DRAFT: { label: 'Draft', color: 'default', help: 'Not sent to the customer yet' },
  SENT: { label: 'Sent', color: 'blue', help: 'Customer has the quotation' },
  NEGOTIATION: {
    label: 'Negotiation',
    color: 'gold',
    help: 'Customer is discussing price or items',
  },
  WON: { label: 'Won', color: 'green', help: 'An order was made from it' },
  LOST: { label: 'Lost', color: 'red', help: 'Customer said no' },
  EXPIRED: { label: 'Expired', color: 'volcano', help: 'Past its valid-till date' },
};

export const LOST_REASONS = [
  'Price too high',
  'Bought from another dealer',
  'Product not available in time',
  'Project cancelled or postponed',
  'Chose a different brand',
  'No response from customer',
  'Other',
];
