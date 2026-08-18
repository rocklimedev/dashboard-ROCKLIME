// src/components/POS-NEW/CartItemRow.jsx
import React, { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  Row,
  Col,
  Typography,
  Button,
  InputNumber,
  Select,
  Divider,
  Space,
  Tag,
} from "antd";
import { LazyLoadImage } from "react-lazy-load-image-component";
import {
  DeleteFilled,
  HolderOutlined,
  SplitCellsOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { useGetProductByIdQuery } from "../../api/productApi";

const { Text } = Typography;
const { Option } = Select;

/* ===================== STYLES ===================== */

const ItemContainer = styled.div`
  padding: 12px 8px;
  transition: all 0.2s;
  background: #fff;
  border-radius: 8px;
  position: relative;

  &:hover {
    background: #fafafa;
  }

  ${({ isDragging }) =>
    isDragging &&
    `
    opacity: 0.75;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    z-index: 100;
  `}

  @media (min-width: 768px) {
    padding: 14px 10px;
  }
`;

const MainRow = styled(Row)`
  flex-wrap: wrap;

  @media (min-width: 576px) {
    flex-wrap: nowrap;
  }
`;

const SnoHandle = styled.div`
  cursor: grab;
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #595959;
  border-radius: 6px;
  user-select: none;
  background: #f5f5f5;

  &:hover {
    background: #e6f4ff;
    color: #1677ff;
  }

  &:active {
    cursor: grabbing;
  }
`;

const LocationDragHandle = styled.div`
  cursor: grab;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  border-radius: 6px;

  &:hover {
    color: #1677ff;
    background: rgba(22, 119, 255, 0.08);
  }

  &:active {
    cursor: grabbing;
  }
`;

const CartItemImage = styled(LazyLoadImage)`
  border-radius: 8px;
  object-fit: cover;
  width: 56px;
  height: 56px;
  background: #f5f5f5;

  @media (min-width: 576px) {
    width: 64px;
    height: 64px;
  }

  @media (min-width: 768px) {
    width: 80px;
    height: 80px;
  }
`;

const QtyTotalCol = styled(Col)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  margin-top: 10px;

  @media (min-width: 576px) {
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-start;
    gap: 8px;
    width: auto;
    margin-top: 0;
  }
`;

const RemoveLabel = styled.span`
  display: none;

  @media (min-width: 576px) {
    display: inline;
    margin-left: 4px;
  }
`;

const ResponsiveDivider = styled(Divider)`
  margin: 12px 0 0 0 !important;

  @media (min-width: 576px) {
    margin: 12px 0 0 80px !important;
  }
`;

const LocationChip = styled(Tag)`
  margin-top: 6px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SplitTags = styled.div`
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

/* ===================== HELPERS ===================== */

const getPrimaryLocation = (item) => {
  if (Array.isArray(item?.locations) && item.locations.length > 0) {
    return item.locations[0];
  }
  if (item?.floorId) {
    return {
      floorId: item.floorId,
      roomId: item.roomId || null,
      floorName: item.floorName,
      roomName: item.roomName,
      assignedQuantity: item.quantity || 1,
    };
  }
  return null;
};

const getLocations = (item) => {
  if (Array.isArray(item?.locations) && item.locations.length > 0) {
    return item.locations;
  }
  if (item?.floorId) {
    return [
      {
        floorId: item.floorId,
        roomId: item.roomId || null,
        floorName: item.floorName,
        roomName: item.roomName,
        assignedQuantity: item.quantity || 1,
      },
    ];
  }
  return [];
};

/* ===================== COMPONENT ===================== */

const CartItemRow = ({
  item,
  itemDiscounts = {},
  itemDiscountTypes = {},
  updatingItems = {},
  handleUpdateQuantity,
  handleRemoveItem,
  handleDiscountChange,
  handleDiscountTypeChange,
  handleMakeOption,
  lineTotal,
  documentType,
  dragEnabled = false,
  serialNumber,

  /* Option handling */
  mainCartItems = [],
  handleAssignOptionToParent,

  /* Site layout (quotation) */
  floors = [],
  onSplit,
  onUpdateAssignedQuantity, // NEW: updates allocated qty for current floor/room view
}) => {
  const itemId = item?.productId || item?.id;

  // ── Sortable = reordering via S.No. ──
  const {
    attributes: sortableAttributes,
    listeners: sortableListeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging: isSorting,
  } = useSortable({
    id: itemId,
    disabled: !dragEnabled,
  });

  // ── Separate draggable = location assignment via corner handle ──
  const {
    attributes: locationAttributes,
    listeners: locationListeners,
    setNodeRef: setLocationRef,
    isDragging: isLocationDragging,
  } = useDraggable({
    id: `loc-${itemId}`,
    data: { type: "location-assign", itemId },
    disabled: !dragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isDragging = isSorting || isLocationDragging;

  const { data: product, isLoading } = useGetProductByIdQuery(item?.productId, {
    skip: !item?.productId,
  });

  const imageUrl =
    item?.imageUrl ||
    (Array.isArray(product?.images) ? product?.images[0] : null) ||
    "https://via.placeholder.com/80";

  const isOption =
    Boolean(item?.isOption) ||
    Boolean(item?.isOptionFor) ||
    Boolean(item?.optionType && item?.optionType !== "main");

  const isQuotationMode = (documentType || "").toLowerCase() === "quotation";
  const showDiscountAndTax = ["quotation", "order"].includes(
    (documentType || "").toLowerCase(),
  );

  const currentParentName = item?.parentProductId
    ? mainCartItems.find((m) => m.productId === item.parentProductId)?.name
    : null;

  /* ── Location (Floor / Room) ── */
  const locations = useMemo(() => getLocations(item), [item]);
  const primaryLoc = useMemo(() => getPrimaryLocation(item), [item]);

  const totalQty = Number(item?.quantity) || 0;
  const totalAssigned = locations.reduce(
    (s, l) => s + (Number(l.assignedQuantity) || 0),
    0,
  );
  const remainingQty = Math.max(0, totalQty - totalAssigned);
  const isSplit = locations.length > 1;
  const hasPartialUnassigned = remainingQty > 0 && locations.length > 0;

  const viewAssignedQty =
    item?._viewAssignedQty != null ? Number(item._viewAssignedQty) : null;
  const isPartialUnassignedView = Boolean(item?._partialUnassigned);

  // When viewing a specific floor/room (or partial unassigned), show the allocated qty
  const isLocationView = viewAssignedQty != null;
  const displayQty = isLocationView
    ? viewAssignedQty
    : Number(item?.quantity) || 1;

  const locationLabel = useMemo(() => {
    if (!primaryLoc?.floorId) return null;
    const floorName =
      primaryLoc.floorName ||
      floors.find((f) => f.floorId === primaryLoc.floorId)?.floorName ||
      "Floor";
    if (!primaryLoc.roomId) return floorName;
    const floor = floors.find((f) => f.floorId === primaryLoc.floorId);
    const roomName =
      primaryLoc.roomName ||
      floor?.rooms?.find((r) => r.roomId === primaryLoc.roomId)?.roomName ||
      "Room";
    return `${floorName} › ${roomName}`;
  }, [primaryLoc, floors]);

  const resolveLocLabel = (loc) => {
    const floorName =
      loc.floorName ||
      floors.find((f) => f.floorId === loc.floorId)?.floorName ||
      "Floor";
    if (!loc.roomId) return floorName;
    const floor = floors.find((f) => f.floorId === loc.floorId);
    const roomName =
      loc.roomName ||
      floor?.rooms?.find((r) => r.roomId === loc.roomId)?.roomName ||
      "Room";
    return `${floorName} › ${roomName}`;
  };

  const handleSplitClick = () => {
    onSplit?.(item.productId || item.id);
  };

  // Quantity change: edit allocated qty when in a location view, otherwise edit total
  const handleQtyChange = (raw) => {
    const newVal = Math.max(1, Number(raw) || 1);

    if (isLocationView && typeof onUpdateAssignedQuantity === "function") {
      onUpdateAssignedQuantity(
        itemId,
        newVal,
        item._viewFloorId ?? null,
        item._viewRoomId ?? null,
        isPartialUnassignedView,
      );
    } else {
      handleUpdateQuantity?.(item.productId, newVal);
    }
  };

  if (isLoading) return <div style={{ padding: "20px" }}>Loading...</div>;

  return (
    <ItemContainer ref={setSortableRef} style={style} isDragging={isDragging}>
      <MainRow gutter={[12, 12]} align="middle">
        {/* S.No. — drag this to reorder (priority) */}
        {dragEnabled && (
          <Col flex="0 0 36px">
            <SnoHandle
              {...sortableAttributes}
              {...sortableListeners}
              title="Drag to reorder"
            >
              {serialNumber ?? "–"}
            </SnoHandle>
          </Col>
        )}

        {/* Corner handle — drag this onto floor/room tabs to assign location */}
        {dragEnabled && isQuotationMode && (
          <Col flex="0 0 32px">
            <LocationDragHandle
              ref={setLocationRef}
              {...locationAttributes}
              {...locationListeners}
              title="Drag onto a floor or room tab to assign location"
            >
              <HolderOutlined style={{ fontSize: 18 }} />
            </LocationDragHandle>
          </Col>
        )}

        {/* IMAGE */}
        <Col flex="0 0 auto">
          <CartItemImage src={imageUrl} alt={item?.name} />
        </Col>

        {/* CONTENT */}
        <Col flex="1 1 160px" style={{ minWidth: 0 }}>
          <Text strong ellipsis style={{ display: "block" }}>
            {product?.name || item?.name}
          </Text>

          <div style={{ marginTop: 4 }}>
            <Text type="success">
              ₹{Number(item?.price || 0).toLocaleString()}
            </Text>
            {isOption && (
              <Tag color="orange" style={{ marginLeft: 8 }}>
                Optional
              </Tag>
            )}
            {isSplit && (
              <Tag color="purple" style={{ marginLeft: 8 }}>
                Split
              </Tag>
            )}
          </div>

          {isQuotationMode && viewAssignedQty != null && (
            <div style={{ marginTop: 4 }}>
              {isPartialUnassignedView ? (
                <Tag color="orange">Unassigned portion ×{viewAssignedQty}</Tag>
              ) : (
                <Tag color="cyan">Here ×{viewAssignedQty}</Tag>
              )}
            </div>
          )}

          {isQuotationMode && !isSplit && locationLabel && (
            <LocationChip color="blue">{locationLabel}</LocationChip>
          )}

          {isQuotationMode && isSplit && (
            <SplitTags>
              {locations.map((l, idx) => (
                <Tag
                  key={`${l.floorId}-${l.roomId || "none"}-${idx}`}
                  color="purple"
                >
                  {resolveLocLabel(l)} ×{l.assignedQuantity || 1}
                </Tag>
              ))}
              {hasPartialUnassigned && (
                <Tag color="orange">Unassigned ×{remainingQty}</Tag>
              )}
            </SplitTags>
          )}

          {isQuotationMode &&
            !isSplit &&
            hasPartialUnassigned &&
            locations.length === 1 && (
              <div style={{ marginTop: 4 }}>
                <Tag color="orange">Unassigned ×{remainingQty}</Tag>
              </div>
            )}

          {isQuotationMode && !primaryLoc?.floorId && (
            <Text
              type="secondary"
              style={{ fontSize: 12, display: "block", marginTop: 4 }}
            >
              Drag the ⋮⋮ handle onto a floor/room tab to assign
            </Text>
          )}

          {isQuotationMode && onSplit && (totalQty > 1 || isSplit) && (
            <div style={{ marginTop: 6 }}>
              <Button
                type="link"
                size="small"
                icon={<SplitCellsOutlined />}
                style={{ padding: 0, height: "auto" }}
                onClick={handleSplitClick}
              >
                {isSplit ? "Edit split" : "Split across floors/rooms"}
              </Button>
            </div>
          )}

          {isQuotationMode && handleMakeOption && (
            <Space style={{ marginTop: 8 }} wrap>
              <Select
                size="small"
                value={item.optionType || "main"}
                onChange={(v) =>
                  handleMakeOption(
                    item.productId,
                    v === "main" ? null : v,
                    item.parentProductId,
                  )
                }
                style={{ width: 120 }}
              >
                <Option value="main">Main Product</Option>
                <Option value="addon">Add-on</Option>
                <Option value="upgrade">Upgrade</Option>
              </Select>
            </Space>
          )}

          {isOption && isQuotationMode && mainCartItems.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                Attach to Main Product:
              </Text>
              <Select
                size="small"
                placeholder="Select main product..."
                value={item.parentProductId || item.isOptionFor || undefined}
                onChange={(parentId) =>
                  handleAssignOptionToParent?.(item.productId, parentId)
                }
                style={{ width: "100%", marginTop: 4 }}
                allowClear
              >
                {mainCartItems.map((main) => (
                  <Option key={main.productId} value={main.productId}>
                    {main.name}
                  </Option>
                ))}
              </Select>

              {currentParentName && (
                <Tag color="blue" style={{ marginTop: 6 }}>
                  Attached to: {currentParentName}
                </Tag>
              )}
            </div>
          )}

          {showDiscountAndTax && (
            <Space style={{ marginTop: 8 }} wrap>
              <Select
                size="small"
                value={itemDiscountTypes[item?.productId] || "percent"}
                onChange={(v) => handleDiscountTypeChange?.(item.productId, v)}
                style={{ width: 70 }}
              >
                <Option value="percent">%</Option>
                <Option value="fixed">₹</Option>
              </Select>

              <InputNumber
                size="small"
                value={itemDiscounts[item?.productId] ?? 0}
                onChange={(v) => handleDiscountChange?.(item.productId, v ?? 0)}
                style={{ width: 90 }}
              />
            </Space>
          )}
        </Col>

        {/* QUANTITY & TOTAL */}
        <QtyTotalCol flex="0 0 auto">
          <Space size="small" wrap>
            <Button
              size="small"
              onClick={() => handleQtyChange(displayQty - 1)}
              disabled={updatingItems[item?.productId] || displayQty <= 1}
            >
              -
            </Button>

            <InputNumber
              min={1}
              size="small"
              value={displayQty}
              onChange={handleQtyChange}
              style={{ width: 56 }}
              disabled={updatingItems[item?.productId]}
            />

            <Button
              size="small"
              onClick={() => handleQtyChange(displayQty + 1)}
              disabled={updatingItems[item?.productId]}
            >
              +
            </Button>
          </Space>

          <div style={{ textAlign: "right" }}>
            <Text strong style={{ color: "#52c41a", fontSize: 15 }}>
              ₹{lineTotal?.(item) || "0.00"}
            </Text>
          </div>

          <Button
            danger
            size="small"
            icon={<DeleteFilled />}
            onClick={(e) => handleRemoveItem?.(e, item.productId)}
          >
            <RemoveLabel>Remove</RemoveLabel>
          </Button>
        </QtyTotalCol>
      </MainRow>

      <ResponsiveDivider />
    </ItemContainer>
  );
};

export default CartItemRow;
