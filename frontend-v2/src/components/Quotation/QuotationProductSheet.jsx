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
//   - Drag the S.No. handle to reorder rows within a section (like the Cart)
//   - A share is only ever "Unassigned" or "Floor + Room" — never a bare
//     floor. There is exactly ONE Unassigned tab, at the top level; there
//     is no per-floor "Unassigned" sub-tab anymore.

import React, { useMemo, useState, useEffect } from "react";
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
  Alert,
  message,
} from "antd";
import {
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  ScissorOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "./quotationproductsheet.css";

const { Option } = Select;
const { Text } = Typography;

const UNASSIGNED = "__unassigned__";

// A section only ever exists for the single global Unassigned bucket, or
// for a concrete floor+room pair. A floor without a room is not a valid
// section, so it collapses to Unassigned.
const sectionKey = (floorId, roomId) =>
  floorId && roomId ? `${floorId}::${roomId}` : UNASSIGNED;

const locationKey = (loc) => `${loc?.floorId || ""}::${loc?.roomId || ""}`;

// Stable row id used both as React key and as the dnd-kit sortable id.
const rowId = (p) => `${p.productId}::${p._locationKey || "root"}`;

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

/* ───────────────────────── S.No. drag handle (reorder) ───────────────────────── */
const SNO_HANDLE_STYLE = {
  cursor: "grab",
  minWidth: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 600,
  color: "#595959",
  borderRadius: 6,
  userSelect: "none",
  background: "#f5f5f5",
};

/* ───────────────────────── Product row ───────────────────────── */
function ProductRow({
  product,
  serialNumber,
  floors,
  onChangeSectionQty,
  onMoveShare,
  onSplitShare,
  onRemove,
  onAddOption,
  dragEnabled = true,
}) {
  const sectionQty = product._sectionQty ?? product.qty;
  const hasMultipleLocations =
    Array.isArray(product.locations) && product.locations.length > 1;

  /**
   * Floor selection is staged locally and does NOT move the item by
   * itself — a floor with no room is not a valid assignment. The move
   * only commits (via onMoveShare) once a room is also chosen.
   */
  const [pendingFloorId, setPendingFloorId] = useState(
    product.floorId || undefined,
  );

  useEffect(() => {
    setPendingFloorId(product.floorId || undefined);
  }, [product.floorId, product.roomId]);

  const pendingFloor = floors.find((f) => f.floorId === pendingFloorId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: rowId(product),
    disabled: !dragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
    background: isDragging ? "#fafafa" : undefined,
    boxShadow: isDragging ? "0 10px 25px rgba(0,0,0,0.15)" : undefined,
    position: "relative",
    zIndex: isDragging ? 100 : "auto",
  };

  const handleFloorChange = (floorId) => {
    if (!floorId) {
      // Clearing the floor clears the whole assignment outright — there
      // is nothing partial worth keeping.
      setPendingFloorId(undefined);
      onMoveShare(product.productId, product._locationKey, {
        floorId: null,
        roomId: null,
      });
      return;
    }
    // Stage locally; wait for a room pick before this actually moves.
    setPendingFloorId(floorId);
  };

  const handleRoomChange = (roomId) => {
    if (!roomId || !pendingFloorId) {
      // No room chosen → nothing to commit, stays/returns to Unassigned.
      onMoveShare(product.productId, product._locationKey, {
        floorId: null,
        roomId: null,
      });
      return;
    }
    onMoveShare(product.productId, product._locationKey, {
      floorId: pendingFloorId,
      roomId,
    });
  };

  const isFullyAssigned = Boolean(product.floorId && product.roomId);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`qs-row${product.isOptionFor ? " qs-option-row" : ""}`}
    >
      {dragEnabled && (
        <td className="qs-cell qs-sno-cell" style={{ width: 40 }}>
          <div
            {...attributes}
            {...listeners}
            style={SNO_HANDLE_STYLE}
            title="Drag to reorder"
          >
            {serialNumber ?? "–"}
          </div>
        </td>
      )}

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
            value={pendingFloorId}
            style={{ width: 110 }}
            allowClear
            onChange={handleFloorChange}
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
            disabled={!pendingFloorId}
            onChange={handleRoomChange}
          >
            {(pendingFloor?.rooms || []).map((r) => (
              <Option key={r.roomId} value={r.roomId}>
                {r.roomName}
              </Option>
            ))}
          </Select>
        </Space.Compact>

        {!isFullyAssigned && (
          <Text
            type="secondary"
            style={{ fontSize: 11, display: "block", marginTop: 2 }}
          >
            Pick both a floor and a room to assign
          </Text>
        )}
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
  onReorder,
}) {
  const subtotal = products.reduce(
    (sum, p) => sum + lineTotal(p, p._sectionQty ?? p.qty),
    0,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = useMemo(() => products.map((p) => rowId(p)), [products]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(products, oldIndex, newIndex);
    onReorder?.(reordered);
  };

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <table className="qs-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>S.No.</th>
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
                {products.map((p, idx) => (
                  <ProductRow
                    key={rowId(p)}
                    product={p}
                    serialNumber={idx + 1}
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
          </SortableContext>
        </DndContext>
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
  // Anything that isn't a concrete floor+room pair (including legacy
  // floor-only records) falls into the single global Unassigned bucket.
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
        // A floor-only (no room) entry is not a valid assignment —
        // normalize it to Unassigned so it doesn't silently disappear.
        const isValidAssignment = Boolean(loc.floorId && loc.roomId);

        (map[key] = map[key] || []).push({
          ...p,
          floorId: isValidAssignment ? loc.floorId : null,
          roomId: isValidAssignment ? loc.roomId : null,
          floorName: isValidAssignment ? loc.floorName : null,
          roomName: isValidAssignment ? loc.roomName : null,
          _sectionQty: Number(loc.assignedQuantity) || 0,
          _locationKey: locationKey(
            isValidAssignment ? loc : { floorId: null, roomId: null },
          ),
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
    floorId && roomId
      ? [
          {
            floorId,
            floorName,
            roomId,
            roomName,
            areaId: null,
            areaName: null,
            assignedQuantity: qty,
          },
        ]
      : [];

  const syncSingularFields = (product) => {
    const locs = product.locations || [];
    if (locs.length === 1 && locs[0].floorId && locs[0].roomId) {
      return {
        ...product,
        floorId: locs[0].floorId,
        roomId: locs[0].roomId,
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
  // A share is only ever "Unassigned" (null/null) or "Floor + Room"
  // (both set) — never a bare floor. Any call missing one half is
  // treated as a full clear back to Unassigned.
  const moveShare = (productId, locKey, { floorId, roomId }) => {
    const isValidTarget = Boolean(floorId && roomId);
    const targetFloorId = isValidTarget ? floorId : null;
    const targetRoomId = isValidTarget ? roomId : null;
    const { floorName, roomName } = resolveNames(targetFloorId, targetRoomId);

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

        locs[idx] = {
          ...locs[idx],
          floorId: targetFloorId,
          floorName: targetFloorId ? floorName : null,
          roomId: targetRoomId,
          roomName: targetRoomId ? roomName : null,
        };

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

    message.success("Split 1 qty → Unassigned. Assign it to a floor + room.");
  };

  const removeProduct = (productId) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.productId !== productId),
    }));
  };

  /**
   * Reorder handler passed to each SheetSection.
   * `reorderedSectionProducts` is the section's exploded rows in their
   * new visual order. We map that order back onto `priority` for just
   * those productIds — mirrors handleCartOrderChange in Cart.jsx.
   */
  const reorderSection = (reorderedSectionProducts) => {
    const priorityByProductId = new Map();
    reorderedSectionProducts.forEach((row, idx) => {
      priorityByProductId.set(row.productId, idx);
    });

    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        priorityByProductId.has(p.productId)
          ? { ...p, priority: priorityByProductId.get(p.productId) }
          : p,
      ),
    }));
  };

  // ─── Catalog add ─────────────────────────────────────────────────
  // Adding from the catalog while viewing a floor tab only targets a
  // real floor+room pair. If the floor has no rooms (or none is
  // selected), the new item goes to the global Unassigned tab instead
  // of landing on a bare floor.
  const getCurrentTarget = () => {
    if (activeTab === UNASSIGNED || !activeTab) {
      return { floorId: null, roomId: null, floorName: null, roomName: null };
    }
    const floor = formData.floors.find((f) => f.floorId === activeTab);
    if (!floor || !floor.rooms?.length) {
      return { floorId: null, roomId: null, floorName: null, roomName: null };
    }
    const roomId = activeRoomTab[floor.floorId] || floor.rooms[0].roomId;
    const room = floor.rooms.find((r) => r.roomId === roomId);
    if (!room) {
      return { floorId: null, roomId: null, floorName: null, roomName: null };
    }
    return {
      floorId: floor.floorId,
      roomId: room.roomId,
      floorName: floor.floorName,
      roomName: room.roomName,
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
  // Only ONE Unassigned tab exists, at the top level. Each floor tab
  // shows just its rooms — no per-floor "Unassigned" sub-tab, since a
  // floor with no room is never a valid place for an item to live.
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
          onReorder={reorderSection}
        />
      ),
    },
    ...formData.floors.map((floor) => {
      const rooms = floor.rooms || [];
      const total = rooms.reduce(
        (sum, r) =>
          sum +
          (productsBySection[sectionKey(floor.floorId, r.roomId)]?.length || 0),
        0,
      );

      if (!rooms.length) {
        return {
          key: floor.floorId,
          closable: false,
          label: `🏢 ${floor.floorName}`,
          children: (
            <div style={{ padding: 12 }}>
              <Alert
                message="Add a room to this floor before assigning items"
                type="info"
                showIcon
                action={
                  <Button
                    size="small"
                    onClick={() => onAddRoom?.(floor.floorId)}
                  >
                    Add Room
                  </Button>
                }
              />
            </div>
          ),
        };
      }

      const roomTabItems = rooms.map((room) => {
        const roomKey = sectionKey(floor.floorId, room.roomId);
        const roomProducts = productsBySection[roomKey] || [];
        return {
          key: room.roomId,
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
              onReorder={reorderSection}
            />
          ),
        };
      });

      return {
        key: floor.floorId,
        closable: false,
        label: `🏢 ${floor.floorName}${total ? ` (${total})` : ""}`,
        children: (
          <div className="qs-floor-sheet">
            <Tabs
              activeKey={activeRoomTab[floor.floorId] || rooms[0].roomId}
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
