// Renders sample quotation PDFs (all styles, a long one, inter-state) without a database,
// to check the layout after changes:  node local-tools/quotation-pdf-sample.js [outDir]
const path = require("path");
const B = path.join(__dirname, "..");
const OUT = process.argv[2] || path.join(B, "storage");
const svc = require.resolve(B + "/modules/settings/settings.service.js");
const { DEFAULTS } = require(B + "/migrations/20261016000100-app-settings.js");
require.cache[svc] = { id: svc, filename: svc, loaded: true, exports: { getSetting: async (k) => DEFAULTS[k] } };
const { renderQuotationPdf } = require(B + "/modules/quotations/quotation-pdf.js");
const fs = require("fs");
const company = { ...DEFAULTS.company, website: "cmtradingco.com", bankAccountName: "Embark Enterprises", bankName: "IDFC First Bank", bankAccountNo: "10179237657", bankIfsc: "IDFB0020149", bankBranch: "Bhera Enclave, Paschim Vihar", upiId: "paytm.s10y1wv@pty" };
// A shortened copy of the Chhabra Marble sample: rooms, net-rate items, an optional upgrade
const room = (roomName, list) => list.map(([name, qty, price, disc], i) => ({ productId: `${roomName}-${i}`, name, quantity: qty, price, discount: disc === "net" ? 0 : disc, discountType: "percent", roomName, floorName: "Ground floor" }));
const items = [
  ...room("Master Bathroom", [["Lido Hand Shower, Chrome", 1, 4498, 50], ["Grohtherm SmartControl Thermostat, Square, 2 Control", 1, 62130, 57], ["Rapido SmartBox", 1, 17870, 54], ["Angle Valve 1/2 × 1/2", 3, 2080, 54], ["VE-Smart Wall-Hung WC", 1, 159998, 50], ["12.0 kW Intelligent Steam Generator, SS Body", 1, 194998, 50]]),
  { productId: "net-1", name: "Uniset WC Frame", quantity: 1, price: 10200, discount: 5700, discountType: "fixed", roomName: "Master Bathroom", floorName: "Ground floor" },
  ...room("Parents' Bathroom", [["Tempesta 250 Head Shower Set, Round 142 mm, 9.5 L", 1, 21200, 54], ["Euphoria Cosmopolitan Stick Hand Shower Set, 9.5 L", 1, 14580, 56], ["Euro Ceramic 2.0 Wall-Hung WC, 2/4 L", 1, 26200, 52]]),
  ...room("Guest / Powder Washroom", [["Single-Lever Tall Basin Mixer", 1, 20998, 50], ["Angle Valve 1/2 × 1/2, Brushed Hard Graphite", 5, 6000, 54]]),
  { productId: "opt-1", name: "Rain shower upgrade, 310 mm", quantity: 1, price: 38000, discount: 50, isOptionFor: "x", optionType: "upgrade" },
];
const many = Array.from({ length: 26 }, (_, i) => ({ productId: "x" + i, name: `JTC Wall Ivory 30x60 matt ${i + 1}`, companyCode: "JTC" + (1000 + i), quantity: 10 + i, price: 650 + i * 10, discount: i % 3 ? 10 : 0, discountType: "percent" }));
const base = {
  quotation: { reference_number: "QUO141026101", quotation_date: "2026-10-14", document_title: "Bathroom fittings — 5 bathrooms", shippingAmount: 500, gst: 18, extraDiscount: 0, createdAt: "2026-10-14" },
  customer: { name: "Anikant Jain", gender: "Male", mobileNumber: "98187 04413" },
  shipTo: { street: "102, Tagore Park", city: "New Delhi", state: "Delhi" },
  billing: null,
  creator: { name: "Aman Sharma", mobileNumber: "9811122233" },
  productInfo: { p1: { brand: "Grohe", hsn: "8481" }, p2: { brand: "American Standard", hsn: "6910" }, p3: { brand: "Colston", hsn: "8481" } },
  stockBy: { p1: { available: 37, incoming: 0 }, p2: { available: 1, incoming: 10 }, p3: { available: 0, incoming: 0 } },
  versionNo: 2,
};
(async () => {
  const runs = [
    ["detailed", { ...base, items }],
    ["compact", { ...base, items }],
    ["areawise", { ...base, items }],
    ["long", { ...base, items: many, shipTo: { street: "Plot 4, Sector 54", city: "Gurugram", state: "Haryana" } }],
  ];
  for (const [name, data] of runs) {
    const { buffer, totals } = await renderQuotationPdf(data, { company, settings: DEFAULTS.quotation, style: name === "long" ? "compact" : name, cover: name === "detailed" ? null : false });
    fs.writeFileSync(path.join(OUT, `sample-quotation-${name}.pdf`), buffer);
    console.log(`${name}: ${Math.round(buffer.length / 1024)} KB, grand total ${totals.grandTotal} → ${path.join(OUT, `sample-quotation-${name}.pdf`)}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });

// Gate pass sample
(async () => {
  const { renderGatePass } = require(B + "/modules/orders/gate-pass.js");
  const { buffer } = await renderGatePass({
    company: { ...company },
    dispatch: { orderNo: "141026101", dispatchNumber: 1, dispatchDate: "2026-10-16T06:30:00Z", vehicleNo: "DL1LAB1234", driverName: "Ramesh", driverPhone: "98100 00000", transporter: "Shree Ganesh Transport", lrNumber: "LR-55821", ewayBillNo: "331012345678", remarks: "Handle basins with care. Deliver before 6 pm." },
    order: { status: "PARTIALLY_DISPATCHED" },
    customer: base.customer,
    ship: base.shipTo,
    invoiceNo: "CM/26-27/0007",
    quotationRef: "QUO141026101",
    issuedBy: "Aman Sharma",
    lines: items.slice(0, 9).map((i) => ({ name: i.name, code: "GR-" + String(i.price).slice(0, 5), quantity: i.quantity })),
    link: "http://localhost:5050/api/public/gp/sample.pdf",
  });
  fs.writeFileSync(path.join(OUT, "sample-gate-pass.pdf"), buffer);
  console.log(`gate pass: ${Math.round(buffer.length / 1024)} KB → ${path.join(OUT, "sample-gate-pass.pdf")}`);
})().catch((e) => { console.error(e); process.exit(1); });

// Purchase order sample
(async () => {
  const { renderPoPdf } = require(B + "/modules/purchase-order/po-pdf.js");
  const poItems = [
    { productId: "a", productName: "Grohe Euphoria 310 Shower System, Thermostat", companyCode: "26075000", hsn: "8481", quantity: 2, unitPrice: 74884.5, discount: 0, tax: 18 },
    { productId: "b", productName: "Essence Wall-Hung WC (without seat cover)", companyCode: "3957100H", hsn: "6910", quantity: 4, unitPrice: 36270, discount: 52, discountType: "percent", tax: 18 },
    { productId: "c", productName: "Uniset WC Frame", companyCode: "38528SET", hsn: "7324", quantity: 4, unitPrice: 10200, discount: 5700, discountType: "fixed", tax: 18 },
    { productId: "d", productName: "JTC Wall Ivory 30x60 matt (box)", companyCode: "JTC1001", hsn: "6907", quantity: 120, unitPrice: 650, discount: 10, discountType: "percent", tax: 12 },
  ];
  const { buffer, totals } = await renderPoPdf({
    po: { poNumber: "171026101", orderDate: "2026-10-17", expectDeliveryDate: "2026-10-24", vendorRef: "SGT/Q/2391", freight: 1500, notes: "Call Aman before delivery. Unloading at the back gate." },
    items: poItems,
    vendor: { vendorName: "SGT Distributors Pvt Ltd", address: "Plot 14, Kirti Nagar Industrial Area", city: "New Delhi", state: "Delhi", pincode: "110015", gstin: "07AAACS1234F1Z9", contactPerson: "Rakesh Gupta", phone: "98110 22334", paymentTerms: "30 days from invoice" },
    creator: { name: "Aman Sharma", mobileNumber: "98111 22233" },
    warehouse: { name: "Main godown", address: "487/65, National Market, Peera Garhi, Delhi 110087" },
    company,
    purchase: DEFAULTS.purchase,
  });
  fs.writeFileSync(path.join(OUT, "sample-purchase-order.pdf"), buffer);
  console.log(`purchase order: ${Math.round(buffer.length / 1024)} KB, total ${totals.grandTotal} → ${path.join(OUT, "sample-purchase-order.pdf")}`);
})().catch((e) => { console.error(e); process.exit(1); });
