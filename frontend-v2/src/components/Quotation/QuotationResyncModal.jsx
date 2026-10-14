import { useEffect, useState } from "react";
import { Alert, Checkbox, Image, Modal, Space, Table, message } from "antd";
import { useLazyGetProductsByIdsQuery } from "../../api/productApi";
import { catalogPrice, productImage } from "./productSyncHelpers";

export default function QuotationResyncModal({ open, products, onCancel, onApply }) {
  const [fetchProducts] = useLazyGetProductsByIdsQuery();
  const [catalog, setCatalog] = useState({});
  const [selection, setSelection] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const ids = JSON.stringify([...new Set(products.map((p) => p.productId))]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const productIds = JSON.parse(ids);
    const request = fetchProducts(productIds, false);
    request.unwrap().then((response) => {
      if (!active) return;
      const rows = Array.isArray(response) ? response : response?.data;
      if (!Array.isArray(rows)) throw new Error("Invalid product response");
      setCatalog(Object.fromEntries(rows.map((p) => [p.productId || p.id, p])));
    }).catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; request.unsubscribe(); };
  }, [open, ids, fetchProducts]);

  const rows = [...new Map(products.map((p) => [p.productId, p])).values()];
  const canSync = (id, field) => Boolean(catalog[id]) &&
    (field !== "sellingPrice" || catalogPrice(catalog[id]) !== null);
  const selectField = (id, field, checked) => {
    setSelection((prev) => ({ ...prev, [id]: { ...prev[id], [field]: checked } }));
  };
  const fieldCheckbox = (field, label, product) => {
    if (product) return (
      <Checkbox aria-label={`Update ${label} for ${product.name}`}
        disabled={loading || error || !canSync(product.productId, field)}
        checked={Boolean(selection[product.productId]?.[field])}
        onChange={(e) => selectField(product.productId, field, e.target.checked)} />
    );
    const eligible = rows.filter((p) => canSync(p.productId, field));
    const count = eligible.filter((p) => selection[p.productId]?.[field]).length;
    return (
      <Checkbox disabled={loading || error || !eligible.length}
        checked={eligible.length > 0 && count === eligible.length}
        indeterminate={count > 0 && count < eligible.length}
        onChange={(e) => {
          const checked = e.target.checked;
          setSelection((prev) => {
            const next = { ...prev };
            eligible.forEach((p) => {
              next[p.productId] = { ...next[p.productId], [field]: checked };
            });
            return next;
          });
        }}>Update {label}</Checkbox>
    );
  };
  const hasSelection = rows.some((p) => ["sellingPrice", "imageUrl"].some(
    (field) => selection[p.productId]?.[field] && canSync(p.productId, field),
  ));

  const apply = () => {
    const updates = {};
    rows.forEach(({ productId: id }) => {
      const product = catalog[id];
      if (!product) return;
      const patch = {};
      const price = catalogPrice(product);
      if (selection[id]?.sellingPrice && price !== null) patch.sellingPrice = price;
      if (selection[id]?.imageUrl) patch.imageUrl = productImage(product);
      if (Object.keys(patch).length) updates[id] = patch;
    });
    if (!Object.keys(updates).length) return message.warning("No available catalog data to resync");
    onApply(updates);
    message.success(`Resynced ${Object.keys(updates).length} products. Save the quotation to keep changes.`);
  };
  const image = (url) => url ? <Image src={url} width={48} height={48} style={{ objectFit: "contain" }} /> : "—";
  const price = (value) => value === null ? "Unavailable" : `₹${Number(value || 0).toFixed(2)}`;
  return (
    <Modal title="RESYNC quotation products" open={open} onCancel={onCancel}
      width={1000} okText="Resync selected" onOk={apply}
      okButtonProps={{ disabled: loading || error || !hasSelection }}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Alert type="info" showIcon message="Choose selling price and/or image separately for each product. Column checkboxes select all available products for that field. Save the quotation after resyncing. An empty catalog image clears the image." />
        {error && <Alert type="error" showIcon message="Could not load catalog data. Close and reopen RESYNC to retry." />}
        <Table size="small" loading={loading} rowKey="productId" pagination={false}
          scroll={{ x: 800, y: 400 }}
          dataSource={rows}
          columns={[
            { title: "Product", dataIndex: "name" },
            { title: "Current selling price", render: (_, p) => price(p.sellingPrice) },
            { title: "Catalog selling price", render: (_, p) => price(catalogPrice(catalog[p.productId])) },
            { title: fieldCheckbox("sellingPrice", "selling price"), render: (_, p) => fieldCheckbox("sellingPrice", "selling price", p) },
            { title: "Current image", render: (_, p) => image(productImage(p)) },
            { title: "Catalog image", render: (_, p) => catalog[p.productId] ? image(productImage(catalog[p.productId])) : "Product unavailable" },
            { title: fieldCheckbox("imageUrl", "image"), render: (_, p) => fieldCheckbox("imageUrl", "image", p) },
          ]} />
      </Space>
    </Modal>
  );
}
