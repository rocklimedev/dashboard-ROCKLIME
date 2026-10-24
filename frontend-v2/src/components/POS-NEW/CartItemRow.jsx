import './CartItemRow.styles.css';
// src/components/POS-NEW/CartItemRow.jsx
import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Row, Col, Typography, Button, InputNumber, Select, Divider, Space, Tag } from 'antd';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { DeleteFilled, SplitCellsOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useGetProductByIdQuery } from '../../api/productApi';
import StockBadge from '../Stock/StockBadge';
import TileCalculator from './TileCalculator';

const { Text } = Typography;
const { Option } = Select;

/* ===================== STYLES ===================== */

const ItemContainer = styled.div.attrs(({ isDragging }) => ({
  className: `fv2-cartitemrow-item-container${isDragging ? ' fv2-cartitemrow-item-container--dragging' : ''}`,
}))``;

const MainRow = styled(Row).attrs({ className: 'fv2-cartitemrow-main-row' })``;

const SnoHandle = styled.div.attrs({ className: 'fv2-cartitemrow-sno-handle' })``;

const CartItemImage = styled(LazyLoadImage).attrs({
  className: 'fv2-cartitemrow-cart-item-image',
})``;

const QtyTotalCol = styled(Col).attrs({ className: 'fv2-cartitemrow-qty-total-col' })``;

const RemoveLabel = styled.span.attrs({ className: 'fv2-cartitemrow-remove-label' })``;

const ResponsiveDivider = styled(Divider).attrs({
  className: 'fv2-cartitemrow-responsive-divider',
})``;

const LocationChip = styled(Tag).attrs({ className: 'fv2-cartitemrow-location-chip' })``;

const SplitTags = styled.div.attrs({ className: 'fv2-cartitemrow-split-tags' })``;

const AssignRow = styled.div.attrs({ className: 'fv2-cartitemrow-assign-row' })``;

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
  stockInfo,
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
  onLocationChange, // NEW: assigns item to a floor+room together (replaces drag/drop)
  onUpdateAssignedQuantity, // updates allocated qty for current floor/room view
}) => {
  const itemId = item?.productId || item?.id;

  // ── Sortable = reordering via S.No. only (location drag removed) ──
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isDragging = isSorting;

  const { data: product, isLoading } = useGetProductByIdQuery(item?.productId, {
    skip: !item?.productId,
  });

  const imageUrl =
    item?.imageUrl ||
    (Array.isArray(product?.images) ? product?.images[0] : null) ||
    'https://via.placeholder.com/80';

  const isOption =
    Boolean(item?.isOption) ||
    Boolean(item?.isOptionFor) ||
    Boolean(item?.optionType && item?.optionType !== 'main');

  const isQuotationMode = (documentType || '').toLowerCase() === 'quotation';
  const showDiscountAndTax = ['quotation', 'order'].includes((documentType || '').toLowerCase());

  const currentParentName = item?.parentProductId
    ? mainCartItems.find((m) => m.productId === item.parentProductId)?.name
    : null;

  /* ── Location (Floor / Room) ── */
  const locations = useMemo(() => getLocations(item), [item]);
  const primaryLoc = useMemo(() => getPrimaryLocation(item), [item]);

  const totalQty = Number(item?.quantity) || 0;
  const totalAssigned = locations.reduce((s, l) => s + (Number(l.assignedQuantity) || 0), 0);
  const remainingQty = Math.max(0, totalQty - totalAssigned);
  const isSplit = locations.length > 1;
  const hasPartialUnassigned = remainingQty > 0 && locations.length > 0;

  const viewAssignedQty = item?._viewAssignedQty != null ? Number(item._viewAssignedQty) : null;
  const isPartialUnassignedView = Boolean(item?._partialUnassigned);

  const isLocationView = viewAssignedQty != null;
  const displayQty = isLocationView ? viewAssignedQty : Number(item?.quantity) || 1;

  const locationLabel = useMemo(() => {
    if (!primaryLoc?.floorId) return null;
    const floorName =
      primaryLoc.floorName ||
      floors.find((f) => f.floorId === primaryLoc.floorId)?.floorName ||
      'Floor';
    if (!primaryLoc.roomId) return floorName;
    const floor = floors.find((f) => f.floorId === primaryLoc.floorId);
    const roomName =
      primaryLoc.roomName ||
      floor?.rooms?.find((r) => r.roomId === primaryLoc.roomId)?.roomName ||
      'Room';
    return floor?.implicit || !floor?.floorName ? roomName : `${floorName} › ${roomName}`;
  }, [primaryLoc, floors]);

  const resolveLocLabel = (loc) => {
    const floorName =
      loc.floorName || floors.find((f) => f.floorId === loc.floorId)?.floorName || 'Floor';
    if (!loc.roomId) return floorName;
    const floor = floors.find((f) => f.floorId === loc.floorId);
    const roomName =
      loc.roomName || floor?.rooms?.find((r) => r.roomId === loc.roomId)?.roomName || 'Room';
    if (floor?.implicit || !floor?.floorName) return roomName;
    return `${floorName} › ${roomName}`;
  };

  const handleSplitClick = () => {
    onSplit?.(item.productId || item.id);
  };

  // Quantity change: edit allocated qty when in a location view, otherwise edit total
  const handleQtyChange = (raw) => {
    const newVal = Math.max(1, Number(raw) || 1);

    if (isLocationView && typeof onUpdateAssignedQuantity === 'function') {
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

  /* ── Room assignment: one picker, assigns on choice ── */
  // Rooms-only quotations keep their rooms under a hidden floor (implicit).
  const roomOptions = useMemo(() => {
    const rows = floors.filter((f) => (f.rooms || []).length);
    const opt = (f, r) => ({ value: `${f.floorId}|${r.roomId}`, label: r.roomName });
    if (rows.every((f) => f.implicit || !f.floorName))
      return rows.flatMap((f) => f.rooms.map((r) => opt(f, r)));
    return rows.map((f) => ({
      label: f.implicit ? 'Rooms' : f.floorName,
      options: f.rooms.map((r) => opt(f, r)),
    }));
  }, [floors]);
  const hasRooms = floors.some((f) => (f.rooms || []).length);
  const assignedValue =
    primaryLoc?.floorId && primaryLoc?.roomId
      ? `${primaryLoc.floorId}|${primaryLoc.roomId}`
      : undefined;
  const handleRoomPick = (v) => {
    if (!v) return onLocationChange?.(itemId, null, null);
    const [floorId, roomId] = String(v).split('|');
    onLocationChange?.(itemId, floorId, roomId);
  };

  if (isLoading) return <div className="fv2-cartitemrow-645379e773">Loading...</div>;

  return (
    <ItemContainer ref={setSortableRef} style={style} isDragging={isDragging}>
      <MainRow gutter={[12, 12]} align="middle">
        {/* S.No. — drag this to reorder (priority) */}
        {dragEnabled && (
          <Col flex="0 0 36px">
            <SnoHandle {...sortableAttributes} {...sortableListeners} title="Drag to reorder">
              {serialNumber ?? '–'}
            </SnoHandle>
          </Col>
        )}

        {/* IMAGE */}
        <Col flex="0 0 auto">
          <CartItemImage src={imageUrl} alt={item?.name} />
        </Col>

        {/* CONTENT */}
        <Col className="fv2-cartitemrow-23e4be640d" flex="1 1 160px">
          <Text className="fv2-cartitemrow-b8fd776dfa" strong ellipsis>
            {product?.name || item?.name}
          </Text>

          <div className="fv2-cartitemrow-1fbc87ccc0">
            <Text type="success">₹{Number(item?.price || 0).toLocaleString()}</Text>
            {isOption && (
              <Tag className="fv2-cartitemrow-318bf3c263" color="orange">
                Optional
              </Tag>
            )}
            {isSplit && (
              <Tag className="fv2-cartitemrow-318bf3c263" color="purple">
                Split
              </Tag>
            )}
          </div>
          {stockInfo && (
            <div className="fv2-cartitemrow-1fbc87ccc0">
              <StockBadge
                available={stockInfo.available}
                reserved={stockInfo.reserved}
                incoming={stockInfo.incoming}
                lowAt={stockInfo.lowAt}
                nextDate={stockInfo.nextIncoming}
                need={Number(item?.quantity) || 0}
              />
            </div>
          )}

          {isQuotationMode && viewAssignedQty != null && (
            <div className="fv2-cartitemrow-1fbc87ccc0">
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
                <Tag key={`${l.floorId}-${l.roomId || 'none'}-${idx}`} color="purple">
                  {resolveLocLabel(l)} ×{l.assignedQuantity || 1}
                </Tag>
              ))}
              {hasPartialUnassigned && <Tag color="orange">Unassigned ×{remainingQty}</Tag>}
            </SplitTags>
          )}

          {isQuotationMode && !isSplit && hasPartialUnassigned && locations.length === 1 && (
            <div className="fv2-cartitemrow-1fbc87ccc0">
              <Tag color="orange">Unassigned ×{remainingQty}</Tag>
            </div>
          )}

          {/* ── Room: pick it and the item is assigned ── */}
          {isQuotationMode && onLocationChange && hasRooms && !isSplit && (
            <AssignRow>
              <Select
                className="fv2-cartitemrow-938dfc111d"
                size="small"
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Choose room"

                value={assignedValue}
                onChange={handleRoomPick}
                options={roomOptions}
              />
            </AssignRow>
          )}

          {isQuotationMode && onSplit && (totalQty > 1 || isSplit) && (
            <div className="fv2-cartitemrow-d8f7c55c9a">
              <Button
                className="fv2-cartitemrow-43c85038d7"
                type="link"
                size="small"
                icon={<SplitCellsOutlined />}

                onClick={handleSplitClick}
              >
                {isSplit ? 'Edit split' : 'Split across floors/rooms'}
              </Button>
            </div>
          )}

          {isQuotationMode && handleMakeOption && (
            <Space className="fv2-cartitemrow-16aa65c514" wrap>
              <Select
                className="fv2-cartitemrow-fb26dcf3b0"
                size="small"
                value={item.optionType || 'main'}
                onChange={(v) =>
                  handleMakeOption(item.productId, v === 'main' ? null : v, item.parentProductId)
                }
              >
                <Option value="main">Main Product</Option>
                <Option value="addon">Add-on</Option>
                <Option value="upgrade">Upgrade</Option>
              </Select>
            </Space>
          )}

          {isOption && isQuotationMode && mainCartItems.length > 0 && (
            <div className="fv2-cartitemrow-16aa65c514">
              <Text className="fv2-cartitemrow-f30652ca3e" type="secondary">
                Attach to Main Product:
              </Text>
              <Select
                className="fv2-cartitemrow-0d7e10774a"
                size="small"
                placeholder="Select main product..."
                value={item.parentProductId || item.isOptionFor || undefined}
                onChange={(parentId) => handleAssignOptionToParent?.(item.productId, parentId)}

                allowClear
              >
                {mainCartItems.map((main) => (
                  <Option key={main.productId} value={main.productId}>
                    {main.name}
                  </Option>
                ))}
              </Select>

              {currentParentName && (
                <Tag className="fv2-cartitemrow-d8f7c55c9a" color="blue">
                  Attached to: {currentParentName}
                </Tag>
              )}
            </div>
          )}

          {showDiscountAndTax && (
            <Space className="fv2-cartitemrow-16aa65c514" wrap>
              <Select
                className="fv2-cartitemrow-9a71741ce7"
                size="small"
                value={itemDiscountTypes[item?.productId] || 'percent'}
                onChange={(v) => handleDiscountTypeChange?.(item.productId, v)}
              >
                <Option value="percent">%</Option>
                <Option value="fixed">₹</Option>
              </Select>

              <InputNumber
                className="fv2-cartitemrow-f89aeb003c"
                size="small"
                value={itemDiscounts[item?.productId] ?? 0}
                onChange={(v) => handleDiscountChange?.(item.productId, v ?? 0)}
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
              className="fv2-cartitemrow-9cb1382127"
              min={1}
              size="small"
              value={displayQty}
              onChange={handleQtyChange}

              disabled={updatingItems[item?.productId]}
            />

            <Button
              size="small"
              onClick={() => handleQtyChange(displayQty + 1)}
              disabled={updatingItems[item?.productId]}
            >
              +
            </Button>
            <TileCalculator
              product={product}
              onApply={handleQtyChange}
              disabled={updatingItems[item?.productId]}
            />
          </Space>

          <div className="fv2-cartitemrow-784a37453a">
            <Text className="fv2-cartitemrow-9ef4911efa" strong>
              ₹{lineTotal?.(item) || '0.00'}
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
