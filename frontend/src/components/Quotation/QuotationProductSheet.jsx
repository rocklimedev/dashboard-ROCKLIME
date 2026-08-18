// src/components/Quotation/QuotationProductSheet.jsx
//
// Fully self-contained multi-location quantity split support.
// No AssignItemModal required.
//
// Rules:
//   - One product has a fixed total `qty` = sum of all locations[].assignedQuantity
//   - You can freely move any share between floors/rooms
//   - "Split" button (when qty ≥ 2) creates a new share of 1 in Unassigned
//   - Editing qty on a share only affects that location's assignedQuantity

import React, { useMemo, useState } from "react";
import {
  Tabs,
  Input,
  InputNumber,
  Select,
  Button,
  Spin,
  Typography,
  Space,
  Tooltip,
  message,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ScissorOutlined,
} from "@ant-design/icons";
import "./quotationproductsheet.css";

const { Option } = Select;
const { Text } = Typography;

const UNASSIGNED = "__unassigned__";
const FLOOR_ROOT = "__floor_root__";

const sectionKey = (floorId, roomId) =>
  !floorId ? UNASSIGNED : `${floorId}::${roomId || FLOOR_ROOT}`;

const locationKey = (loc) => `${loc?.floorId || ""}::${loc?.roomId || ""}`;

const lineTotal = (p, qtyOverride) => {
  const qty =
    qtyOverride !== undefined ? Number(qtyOverride) : Number(p.qty) || 0;
  const price = Number(p.sellingPrice) || 0;
  const disc = Number(p.discount) || 0;
  const discAmt =
    p.discountType === "percent" ? (price * qty * disc) / 100 : disc * qty;
  return price * qty - discAmt;
};

/* ───────────────────────── Catalog row ───────────────────────── */
function CatalogItem({ product, price, onAdd, alreadyAdded }) {
  return (
    <div className="qs-catalog-item">
      <span className="qs-catalog-name">{product.name}</span>
      <span className="qs-catalog-price">₹{price.toFixed(2)}</span>
      <Button
        type="text"
        size="small"
        icon={<PlusOutlined />}
        disabled={alreadyAdded}
        title={
          alreadyAdded ? "Already added" : "Add to the section you're viewing"
        }
        onClick={() => onAdd(product)}
      />
    </div>
  );
}

/* ───────────────────────── Product row ───────────────────────── */
function ProductRow({
  product,
  floors,
  onChangeSectionQty,
  onMoveShare,
  onSplitShare,
  onRemove,
  onAddOption,
}) {
  const floor = floors.find((f) => f.floorId === product.floorId);
  const sectionQty = product._sectionQty ?? product.qty;
  const hasMultipleLocations =
    Array.isArray(product.locations) && product.locations.length > 1;

  return (
    <tr className={`qs-row${product.isOptionFor ? " qs-option-row" : ""}`}>
      <td className="qs-cell qs-name-cell">
        {product.isOptionFor && <span className="qs-option-arrow">↳ </span>}
        {product.name}
        {hasMultipleLocations && (
          <Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
            (split)
          </Text>
        )}
      </td>

      <td className="qs-cell">
        <InputNumber
          size="small"
          min={1}
          value={sectionQty}
          onChange={(v) =>
            onChangeSectionQty(product.productId, product._locationKey, v)
          }
          className="qs-cell-input"
        />
      </td>

      <td className="qs-cell qs-readonly">
        ₹{Number(product.sellingPrice || 0).toFixed(2)}
      </td>

      <td className="qs-cell">
        <Space.Compact>
          <InputNumber
            size="small"
            min={0}
            value={product.discount}
            onChange={(v) =>
              onChangeSectionQty(product.productId, null, null, {
                discount: v,
              })
            }
            style={{ width: 70 }}
          />
          <Select
            size="small"
            value={product.discountType}
            onChange={(v) =>
              onChangeSectionQty(product.productId, null, null, {
                discountType: v,
              })
            }
            style={{ width: 56 }}
          >
            <Option value="fixed">₹</Option>
            <Option value="percent">%</Option>
          </Select>
        </Space.Compact>
      </td>

      <td className="qs-cell qs-location-cell">
        <Space.Compact className="qs-location-selects">
          <Select
            size="small"
            placeholder="Floor"
            value={product.floorId || undefined}
            style={{ width: 110 }}
            allowClear
            onChange={(floorId) =>
              onMoveShare(product.productId, product._locationKey, {
                floorId: floorId || null,
                roomId: null,
              })
            }
          >
            {floors.map((f) => (
              <Option key={f.floorId} value={f.floorId}>
                {f.floorName}
              </Option>
            ))}
          </Select>
          <Select
            size="small"
            placeholder="Room"
            value={product.roomId || undefined}
            style={{ width: 110 }}
            allowClear
            disabled={!product.floorId}
            onChange={(roomId) =>
              onMoveShare(product.productId, product._locationKey, {
                floorId: product.floorId,
                roomId: roomId || null,
              })
            }
          >
            {(floor?.rooms || []).map((r) => (
              <Option key={r.roomId} value={r.roomId}>
                {r.roomName}
              </Option>
            ))}
          </Select>
        </Space.Compact>
      </td>

      <td className="qs-cell qs-readonly qs-total-cell">
        ₹{lineTotal(product, sectionQty).toFixed(2)}
      </td>

      <td className="qs-cell qs-actions">
        {!product.isOptionFor && (
          <Tooltip title="Add option / variant">
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => onAddOption(product)}
            />
          </Tooltip>
        )}

        {/* Split button – only when this share has qty ≥ 2 */}
        {sectionQty >= 2 && (
          <Tooltip title="Split 1 qty into a new Unassigned share">
            <Button
              type="text"
              size="small"
              icon={<ScissorOutlined />}
              onClick={() =>
                onSplitShare(product.productId, product._locationKey)
              }
            />
          </Tooltip>
        )}

        <Button
          danger
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => onRemove(product.productId)}
        />
      </td>
    </tr>
  );
}

/* ───────────────────────── Sheet section ───────────────────────── */
function SheetSection({
  title,
  subtitle,
  products,
  floors,
  onChangeSectionQty,
  onMoveShare,
  onSplitShare,
  onRemove,
  onAddOption,
}) {
  const subtotal = products.reduce(
    (sum, p) => sum + lineTotal(p, p._sectionQty ?? p.qty),
    0,
  );

  return (
    <div className="qs-section">
      <div className="qs-section-header">
        <Text strong>{title}</Text>
        {subtitle && (
          <Text type="secondary" className="qs-section-subtitle">
            {subtitle}
          </Text>
        )}
        <Text type="secondary" className="qs-section-summary">
          {products.length} item{products.length !== 1 ? "s" : ""} · ₹
          {subtotal.toFixed(2)}
        </Text>
      </div>

      {products.length === 0 ? (
        <div className="qs-section-empty">
          No products here yet — search the catalog above and hit “+” to add
        </div>
      ) : (
        <table className="qs-table">
          <thead>
            <tr>
              <th>Product</th>
              <th style={{ width: 90 }}>Qty</th>
              <th style={{ width: 100 }}>Price</th>
              <th style={{ width: 160 }}>Discount</th>
              <th style={{ width: 240 }}>Location</th>
              <th style={{ width: 110 }}>Total</th>
              <th style={{ width: 100 }} />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <ProductRow
                key={`${p.productId}::${p._locationKey || "root"}`}
                product={p}
                floors={floors}
                onChangeSectionQty={onChangeSectionQty}
                onMoveShare={onMoveShare}
                onSplitShare={onSplitShare}
                onRemove={onRemove}
                onAddOption={onAddOption}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ───────────────────────── Main component ───────────────────────── */
export default function QuotationProductSheet({
  formData,
  setFormData,
  searchResult,
  isSearching,
  searchTerm,
  onSearch,
  safeNum,
  onAddOption,
  onAddFloor,
  onAddRoom,
}) {
  const [activeTab, setActiveTab] = useState(UNASSIGNED);
  const [activeRoomTab, setActiveRoomTab] = useState({});

  const priceOf = (p) =>
    safeNum(p.meta?.["9ba862ef-f993-4873-95ef-1fef10036aa5"], 0);

  // ─── Group by exploding locations[] ──────────────────────────────
  const productsBySection = useMemo(() => {
    const map = {};

    formData.products.forEach((p) => {
      const locs =
        Array.isArray(p.locations) && p.locations.length > 0
          ? p.locations
          : [
              {
                floorId: p.floorId || null,
                roomId: p.roomId || null,
                assignedQuantity: Number(p.qty) || 0,
                floorName: p.floorName || null,
                roomName: p.roomName || null,
              },
            ];

      locs.forEach((loc) => {
        const key = sectionKey(loc.floorId, loc.roomId);
        (map[key] = map[key] || []).push({
          ...p,
          floorId: loc.floorId || null,
          roomId: loc.roomId || null,
          floorName: loc.floorName || null,
          roomName: loc.roomName || null,
          _sectionQty: Number(loc.assignedQuantity) || 0,
          _locationKey: locationKey(loc),
        });
      });
    });

    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0)),
    );
    return map;
  }, [formData.products]);

  // ─── Helpers ─────────────────────────────────────────────────────
  const resolveNames = (floorId, roomId) => {
    const floor = formData.floors.find((f) => f.floorId === floorId);
    const room = floor?.rooms?.find((r) => r.roomId === roomId);
    return {
      floorName: floor?.floorName || null,
      roomName: room?.roomName || null,
    };
  };

  const buildSingleLocation = (floorId, roomId, floorName, roomName, qty) =>
    floorId
      ? [
          {
            floorId,
            floorName,
            roomId: roomId || null,
            roomName: roomName || null,
            areaId: null,
            areaName: null,
            assignedQuantity: qty,
          },
        ]
      : [];

  const syncSingularFields = (product) => {
    const locs = product.locations || [];
    if (locs.length === 1) {
      return {
        ...product,
        floorId: locs[0].floorId || null,
        roomId: locs[0].roomId || null,
        floorName: locs[0].floorName || null,
        roomName: locs[0].roomName || null,
      };
    }
    return {
      ...product,
      floorId: null,
      roomId: null,
      floorName: null,
      roomName: null,
    };
  };

  // ─── Change qty of one share ─────────────────────────────────────
  const updateSectionQty = (productId, locKey, newQty, extraFields = null) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.productId !== productId) return p;

        if (extraFields) {
          return { ...p, ...extraFields };
        }

        let locs = Array.isArray(p.locations) ? [...p.locations] : [];

        if (locs.length === 0) {
          locs = [
            {
              floorId: p.floorId || null,
              roomId: p.roomId || null,
              floorName: p.floorName || null,
              roomName: p.roomName || null,
              areaId: null,
              areaName: null,
              assignedQuantity: Number(p.qty) || 0,
            },
          ];
        }

        const idx = locs.findIndex((l) => locationKey(l) === locKey);
        if (idx === -1) return p;

        const safeQty = Math.max(1, Number(newQty) || 1);
        locs[idx] = { ...locs[idx], assignedQuantity: safeQty };

        const total = locs.reduce(
          (s, l) => s + (Number(l.assignedQuantity) || 0),
          0,
        );

        return syncSingularFields({
          ...p,
          locations: locs,
          qty: total,
        });
      }),
    }));
  };

  // ─── Move one share to another floor/room ────────────────────────
  const moveShare = (productId, locKey, { floorId, roomId }) => {
    const { floorName, roomName } = resolveNames(floorId, roomId);

    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.productId !== productId) return p;

        let locs = Array.isArray(p.locations) ? [...p.locations] : [];

        if (locs.length === 0) {
          locs = [
            {
              floorId: p.floorId || null,
              roomId: p.roomId || null,
              floorName: p.floorName || null,
              roomName: p.roomName || null,
              areaId: null,
              areaName: null,
              assignedQuantity: Number(p.qty) || 0,
            },
          ];
        }

        const idx = locs.findIndex((l) => locationKey(l) === locKey);
        if (idx === -1) return p;

        // Moving to Unassigned → just clear floor/room on this entry
        if (!floorId) {
          locs[idx] = {
            ...locs[idx],
            floorId: null,
            floorName: null,
            roomId: null,
            roomName: null,
          };
        } else {
          locs[idx] = {
            ...locs[idx],
            floorId,
            floorName,
            roomId: roomId || null,
            roomName: roomName || null,
          };
        }

        // Merge if target already exists
        const targetKey = locationKey(locs[idx]);
        const otherIdx = locs.findIndex(
          (l, i) => i !== idx && locationKey(l) === targetKey,
        );
        if (otherIdx !== -1) {
          locs[otherIdx] = {
            ...locs[otherIdx],
            assignedQuantity:
              (Number(locs[otherIdx].assignedQuantity) || 0) +
              (Number(locs[idx].assignedQuantity) || 0),
          };
          locs.splice(idx, 1);
        }

        const total = locs.reduce(
          (s, l) => s + (Number(l.assignedQuantity) || 0),
          0,
        );

        return syncSingularFields({
          ...p,
          locations: locs,
          qty: total,
        });
      }),
    }));
  };

  // ─── Split 1 qty from current share into a new Unassigned share ──
  const splitShare = (productId, locKey) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.productId !== productId) return p;

        let locs = Array.isArray(p.locations) ? [...p.locations] : [];

        if (locs.length === 0) {
          locs = [
            {
              floorId: p.floorId || null,
              roomId: p.roomId || null,
              floorName: p.floorName || null,
              roomName: p.roomName || null,
              areaId: null,
              areaName: null,
              assignedQuantity: Number(p.qty) || 0,
            },
          ];
        }

        const idx = locs.findIndex((l) => locationKey(l) === locKey);
        if (idx === -1) return p;

        const currentQty = Number(locs[idx].assignedQuantity) || 0;
        if (currentQty < 2) {
          message.warning("Need at least 2 quantity to split");
          return p;
        }

        // Reduce current share by 1
        locs[idx] = {
          ...locs[idx],
          assignedQuantity: currentQty - 1,
        };

        // Add new Unassigned share of 1
        locs.push({
          floorId: null,
          floorName: null,
          roomId: null,
          roomName: null,
          areaId: null,
          areaName: null,
          assignedQuantity: 1,
        });

        const total = locs.reduce(
          (s, l) => s + (Number(l.assignedQuantity) || 0),
          0,
        );

        return syncSingularFields({
          ...p,
          locations: locs,
          qty: total,
        });
      }),
    }));

    message.success("Split 1 qty → Unassigned. Move it to another floor.");
  };

  const removeProduct = (productId) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.productId !== productId),
    }));
  };

  // ─── Catalog add ─────────────────────────────────────────────────
  const getCurrentTarget = () => {
    if (activeTab === UNASSIGNED || !activeTab) {
      return { floorId: null, roomId: null, floorName: null, roomName: null };
    }
    const floor = formData.floors.find((f) => f.floorId === activeTab);
    if (!floor) {
      return { floorId: null, roomId: null, floorName: null, roomName: null };
    }
    const rootKey = sectionKey(floor.floorId, null);
    const roomTabKey = activeRoomTab[floor.floorId] || rootKey;
    if (roomTabKey === rootKey) {
      return {
        floorId: floor.floorId,
        roomId: null,
        floorName: floor.floorName,
        roomName: null,
      };
    }
    const roomId = roomTabKey.split("::")[1];
    const room = floor.rooms?.find((r) => r.roomId === roomId);
    return {
      floorId: floor.floorId,
      roomId,
      floorName: floor.floorName,
      roomName: room?.roomName || null,
    };
  };

  const addFromCatalog = (product) => {
    const productId = product.id || product.productId;
    if (formData.products.some((p) => p.productId === productId)) return;

    const target = getCurrentTarget();
    const price = priceOf(product);

    const newProduct = {
      productId,
      name: product.name || "Unknown",
      qty: 1,
      sellingPrice: price,
      discount: 0,
      discountType: "fixed",
      priority: formData.products.length,
      isOptionFor: null,
      groupId: `grp-${String(productId).slice(0, 8)}`,
      floorId: target.floorId,
      floorName: target.floorName,
      roomId: target.roomId,
      roomName: target.roomName,
      areaId: null,
      areaName: null,
      locations: buildSingleLocation(
        target.floorId,
        target.roomId,
        target.floorName,
        target.roomName,
        1,
      ),
    };

    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, newProduct],
    }));
  };

  const addedProductIds = useMemo(
    () => new Set(formData.products.map((p) => p.productId)),
    [formData.products],
  );

  // ─── Tabs ────────────────────────────────────────────────────────
  const tabItems = [
    {
      key: UNASSIGNED,
      closable: false,
      label: `Unassigned${
        productsBySection[UNASSIGNED]?.length
          ? ` (${productsBySection[UNASSIGNED].length})`
          : ""
      }`,
      children: (
        <SheetSection
          title="Unassigned"
          subtitle="Not placed on any floor/room yet"
          products={productsBySection[UNASSIGNED] || []}
          floors={formData.floors}
          onChangeSectionQty={updateSectionQty}
          onMoveShare={moveShare}
          onSplitShare={splitShare}
          onRemove={removeProduct}
          onAddOption={onAddOption}
        />
      ),
    },
    ...formData.floors.map((floor) => {
      const rootKey = sectionKey(floor.floorId, null);
      const rootProducts = productsBySection[rootKey] || [];
      const rooms = floor.rooms || [];
      const roomCount = rooms.reduce(
        (sum, r) =>
          sum +
          (productsBySection[sectionKey(floor.floorId, r.roomId)]?.length || 0),
        0,
      );
      const total = rootProducts.length + roomCount;

      const roomTabItems = [
        {
          key: rootKey,
          closable: false,
          label: `Unassigned${
            rootProducts.length ? ` (${rootProducts.length})` : ""
          }`,
          children: (
            <SheetSection
              title="Unassigned on this floor"
              subtitle="Not placed in a specific room yet"
              products={rootProducts}
              floors={formData.floors}
              onChangeSectionQty={updateSectionQty}
              onMoveShare={moveShare}
              onSplitShare={splitShare}
              onRemove={removeProduct}
              onAddOption={onAddOption}
            />
          ),
        },
        ...rooms.map((room) => {
          const roomKey = sectionKey(floor.floorId, room.roomId);
          const roomProducts = productsBySection[roomKey] || [];
          return {
            key: roomKey,
            closable: false,
            label: `🛏️ ${room.roomName}${
              roomProducts.length ? ` (${roomProducts.length})` : ""
            }`,
            children: (
              <SheetSection
                title={room.roomName}
                products={roomProducts}
                floors={formData.floors}
                onChangeSectionQty={updateSectionQty}
                onMoveShare={moveShare}
                onSplitShare={splitShare}
                onRemove={removeProduct}
                onAddOption={onAddOption}
              />
            ),
          };
        }),
      ];

      return {
        key: floor.floorId,
        closable: false,
        label: `🏢 ${floor.floorName}${total ? ` (${total})` : ""}`,
        children: (
          <div className="qs-floor-sheet">
            <Tabs
              activeKey={activeRoomTab[floor.floorId] || rootKey}
              onChange={(key) =>
                setActiveRoomTab((prev) => ({
                  ...prev,
                  [floor.floorId]: key,
                }))
              }
              onEdit={(targetKey, action) => {
                if (action === "add") onAddRoom?.(floor.floorId);
              }}
              items={roomTabItems}
              type="editable-card"
              hideAdd={false}
              addIcon={<PlusOutlined />}
              size="small"
              className="qs-room-tabs"
            />
          </div>
        ),
      };
    }),
  ];

  return (
    <div className="qs-workbook">
      <div className="qs-catalog-bar">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search products to add…"
          allowClear
          onChange={(e) => onSearch(e.target.value)}
          className="qs-catalog-search"
        />
        {(searchTerm || searchResult.length > 0) && (
          <Text className="qs-catalog-list-label">
            Click “+” to add a result into the floor/room tab you're viewing
            below
          </Text>
        )}
        <div className="qs-catalog-list-horizontal">
          {isSearching ? (
            <Spin size="small" style={{ margin: "0 16px" }} />
          ) : searchResult.length === 0 ? (
            <Text type="secondary" className="qs-catalog-empty-hint">
              {searchTerm ? "No products found" : "Type to search the catalog"}
            </Text>
          ) : (
            searchResult.map((p) => {
              const id = p.id || p.productId;
              return (
                <CatalogItem
                  key={id}
                  product={p}
                  price={priceOf(p)}
                  onAdd={addFromCatalog}
                  alreadyAdded={addedProductIds.has(id)}
                />
              );
            })
          )}
        </div>
      </div>

      <div className="qs-workbook-body">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          onEdit={(targetKey, action) => {
            if (action === "add") onAddFloor?.();
          }}
          items={tabItems}
          type="editable-card"
          hideAdd={false}
          addIcon={<PlusOutlined />}
        />
      </div>
    </div>
  );
}
