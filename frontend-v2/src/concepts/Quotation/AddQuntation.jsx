import { useGetSettingsQuery } from '../../api/settingsApi';
import Loader from '../../components/Common/Loader';
import ModalShell from '../../components/Common/ModalShell';
import './AddQuntation.styles.css';
// src/components/Quotation/AddQuotation.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  normalizeCharges,
  lineAmounts,
  quotationTotals,
  resolvePricingMode,
  pricingFromRecord,
} from '../../utils/quotationMath';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Input,
  Select,
  InputNumber,
  Space,
  Button,
  Typography,
  Form,
  Card,
  Row,
  Col,
  Statistic,
  Alert,
} from 'antd';
import { toast } from 'sonner';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { debounce } from 'lodash';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { v4 as uuidv4 } from 'uuid';
import AddCustomerModal from '../../components/Customers/AddCustomerModal';
import PageHeader from '../../components/Common/PageHeader';
import {
  useCreateQuotationMutation,
  useGetQuotationByIdQuery,
  useUpdateQuotationMutation,
  useGetQuotationVersionsQuery,
} from '../../api/quotationApi';
import { useSearchProductsQuery } from '../../api/productApi';
import { useGetCustomersQuery } from '../../api/customerApi';
import { useGetAllAddressesQuery } from '../../api/addressApi';
import { useGetProfileQuery } from '../../api/userApi';
import QuotationProductSheet from '../../components/Quotation/QuotationProductSheet';
import QuotationResyncModal from '../../components/Quotation/QuotationResyncModal';
import { productImage, productCompanyCode } from '../../components/Quotation/productSyncHelpers';
import AddAddress from '../../components/Address/AddAddressModal';

// Import Modals
import AddFloorModal from '../../components/modals/AddFloorModal';
import AddEditRoomModal from '../../components/modals/AddEditRoomModal';
import AssignItemModal from '../../components/modals/AssignItemModal';
import EditFloorModal from '../../components/modals/EditFloorModal';

const { Text } = Typography;
const { Option } = Select;

// Cleared location fields — used when a floor/room is deleted and its
// items fall back to Unassigned.
const CLEARED = {
  floorId: null,
  floorName: null,
  roomId: null,
  roomName: null,
  areaId: null,
  areaName: null,
};
// Legacy quotations: locations may be missing or lack `priority`, and product
// priorities collide within a section. Inherit the product priority, collapse
// bare-floor shares to Unassigned, merge duplicate shares, then re-rank each
// section 0..n (ties broken by original array order). Idempotent.
const normalizeLoadedProducts = (products) => {
  const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const secKey = (l) => (l.floorId && l.roomId ? `${l.floorId}::${l.roomId}` : '::');

  const prods = products.map((p, order) => {
    const base =
      Array.isArray(p.locations) && p.locations.length > 0
        ? p.locations
        : [
            {
              floorId: p.floorId || null,
              floorName: p.floorName || null,
              roomId: p.roomId || null,
              roomName: p.roomName || null,
              assignedQuantity: num(p.qty, 1),
            },
          ];

    // Collapse invalid (bare-floor) shares to Unassigned, then merge
    // shares that land on the same key so keys stay unique per product.
    const merged = new Map();
    base.forEach((l) => {
      const valid = Boolean(l.floorId && l.roomId);
      const loc = {
        ...(l.shareId ? { shareId: l.shareId } : {}),
        floorId: valid ? l.floorId : null,
        floorName: valid ? l.floorName || null : null,
        roomId: valid ? l.roomId : null,
        roomName: valid ? l.roomName || null : null,
        areaId: l.areaId || null,
        areaName: l.areaName || null,
        assignedQuantity: num(l.assignedQuantity, 0),
        priority: num(l.priority ?? p.priority, 0), // inherit legacy order
        _order: order,
      };
      const k = loc.shareId || secKey(loc);
      const ex = merged.get(k);
      if (ex) {
        ex.assignedQuantity += loc.assignedQuantity;
        ex.priority = Math.min(ex.priority, loc.priority);
      } else {
        merged.set(k, loc);
      }
    });

    return { ...p, locations: [...merged.values()] };
  });

  // Re-rank within each section
  const buckets = {};
  prods.forEach((p) => p.locations.forEach((l) => (buckets[secKey(l)] ||= []).push(l)));
  Object.values(buckets).forEach((arr) => {
    arr.sort((a, b) => a.priority - b.priority || a._order - b._order);
    arr.forEach((l, i) => (l.priority = i));
  });

  return prods.map((p) => {
    const locations = p.locations.map(({ _order, ...l }) => l);
    const single =
      locations.length === 1 && locations[0].floorId && locations[0].roomId ? locations[0] : null;
    return {
      ...p,
      locations,
      qty: locations.reduce((s, l) => s + l.assignedQuantity, 0) || p.qty,
      floorId: single?.floorId || null,
      floorName: single?.floorName || null,
      roomId: single?.roomId || null,
      roomName: single?.roomName || null,
      priority: locations.length === 1 ? locations[0].priority : p.priority,
    };
  });
};
const AddQuotation = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // ── API Hooks ─────────────────────────────────────────────────────
  const {
    data: existingQuotation,
    isLoading: loadingQuotation,
    isFetching: fetchingQuotation,
    error: quotationError,
  } = useGetQuotationByIdQuery(id, {
    skip: !isEditMode,
    refetchOnMountOrArgChange: true,
  });
  const { data: versionsData = [] } = useGetQuotationVersionsQuery(id, {
    skip: !isEditMode,
  });

  const { data: userData } = useGetProfileQuery();
  const { data: customersData } = useGetCustomersQuery({ limit: 10000 });
  const { data: addressesData, refetch: refetchAddresses } = useGetAllAddressesQuery();

  const [createQuotation, { isLoading: isCreating }] = useCreateQuotationMutation();
  const [updateQuotation, { isLoading: isUpdating }] = useUpdateQuotationMutation();

  // ── Product Search ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const { data: searchResult = [], isFetching: isSearching } = useSearchProductsQuery(
    searchTerm.trim(),
    {
      skip: searchTerm.trim().length < 2,
    },
  );

  const debouncedSearch = useCallback(
    debounce((value) => setSearchTerm(value.trim()), 400),
    [],
  );

  // ── State ─────────────────────────────────────────────────────────
  // "New quotation" from a customer's page opens with that customer chosen.
  const presetCustomerId = useLocation().state?.customerId;
  const userId = userData?.user?.userId || 'system';

  const initialFormData = {
    document_title: '',
    quotation_date: null,
    due_date: null,
    gst: null,
    discountMode: 'generic', // 'generic' | 'advanced'
    gstBasis: null, // advanced only: 'inclusive' | 'exclusive' | null (not chosen)
    shippingAmount: 0,
    miscellaneousChargeItems: [],
    additionalDiscount: 0,
    flatPrice: null,
    extraDiscount: 0,
    extraDiscountType: 'fixed',
    signature_name: '',
    signature_image: '',
    customerId: presetCustomerId || '',
    shipTo: '',
    createdBy: userId,
    products: [],
    followupDates: [],
    floors: [],
  };

  const [formData, setFormData] = useState(initialFormData);
  const { data: settingsResponse } = useGetSettingsQuery();
  const quotationDefaults = settingsResponse?.data?.quotation;
  useEffect(() => {
    if (!isEditMode && quotationDefaults)
      setFormData((prev) =>
        prev.gst == null ? { ...prev, gst: quotationDefaults.defaultGstRate } : prev,
      );
  }, [isEditMode, quotationDefaults]);

  // Saved quotations come from the API, never a browser draft.
  const initializedQuotation = useRef(null);

  // Modal Forms — each modal gets its own instance so one modal's
  // resetFields() can never wipe another's values.
  const [floorForm] = Form.useForm(); // add floor
  const [floorEditForm] = Form.useForm(); // edit floor
  const [roomForm] = Form.useForm(); // add room
  const [roomEditForm] = Form.useForm(); // edit room

  // Modal Visibility States
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddFloorModal, setShowAddFloorModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showEditFloorModal, setShowEditFloorModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [showResyncModal, setShowResyncModal] = useState(false);

  // Delete confirmation (controlled modal instead of static Modal.confirm)
  // { type: "floor", floor } | { type: "room", floorId, room } | null
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Option Modal States
  const [showAddOptionModal, setShowAddOptionModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [optionType, setOptionType] = useState('addon');

  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [editingFloor, setEditingFloor] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null); // { floorId, roomId, roomName, type }
  const [itemToAssign, setItemToAssign] = useState(null);

  const editRoomInitialValues = useMemo(
    () => ({ name: editingRoom?.roomName, type: editingRoom?.type }),
    [editingRoom],
  );

  // ── Helpers ───────────────────────────────────────────────────────
  const safeNum = (val, fallback = 0) => (Number.isFinite(Number(val)) ? Number(val) : fallback);

  const safeJsonParse = (value, fallback = []) => {
    if (Array.isArray(value)) return value;
    if (!value) return fallback;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  };

  const generateId = () => `id_${uuidv4().slice(0, 8)}`;

  // ── Load Existing Quotation ───────────────────────────────────────
  useEffect(() => {
    if (!isEditMode || !existingQuotation || fetchingQuotation || quotationError) return;
    const source = id + ':' + (existingQuotation.updatedAt || '');
    if (initializedQuotation.current === source) return;
    initializedQuotation.current = source;

    const parsedProducts = safeJsonParse(existingQuotation.products, []);
    const parsedFloors = safeJsonParse(existingQuotation.floors, []);

    const mappedProducts = parsedProducts.map((p) => ({
      ...p,
      qty: safeNum(p.quantity ?? p.qty, 1),
      sellingPrice: safeNum(p.price ?? p.sellingPrice, 0),
      companyCode: productCompanyCode(p),
      discount: safeNum(p.discount, 0),
      discountType: p.discountType || 'fixed',

      // Preserve the multi-location split from the saved payload
      locations: Array.isArray(p.locations) ? p.locations : [],

      floorId: p.floorId || null,
      floorName: p.floorName || null,
      roomId: p.roomId || null,
      roomName: p.roomName || null,
      areaId: p.areaId || null,
      areaName: p.areaName || null,
    }));

    setFormData({
      ...initialFormData,
      quotationId: id,
      document_title: existingQuotation.document_title || '',
      quotation_date: existingQuotation.quotation_date
        ? new Date(existingQuotation.quotation_date)
        : null,
      due_date: existingQuotation.due_date ? new Date(existingQuotation.due_date) : null,
      miscellaneousChargeItems: normalizeCharges(
        existingQuotation.miscellaneousChargeItems ?? existingQuotation.miscellaneousCharges,
      ),
      additionalDiscount: safeNum(existingQuotation.additionalDiscount),
      flatPrice: existingQuotation.flatPrice == null ? null : safeNum(existingQuotation.flatPrice),
      shippingAmount: safeNum(existingQuotation.shippingAmount, 0),
      gst: safeNum(existingQuotation.gst, 0),
      discountMode: pricingFromRecord(existingQuotation).discountMode,
      gstBasis: pricingFromRecord(existingQuotation).gstBasis,
      extraDiscount: safeNum(existingQuotation.extraDiscount, 0),
      extraDiscountType: existingQuotation.extraDiscountType || 'fixed',
      signature_name: existingQuotation.signature_name || '',
      signature_image: existingQuotation.signature_image || '',
      customerId: existingQuotation.customerId || '',
      shipTo: existingQuotation.shipTo || '',
      createdBy: userId,
      products: normalizeLoadedProducts(mappedProducts),
      floors: parsedFloors,
      followupDates: safeJsonParse(existingQuotation.followupDates, [])
        .map((d) => (d ? new Date(d) : null))
        .filter(Boolean),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, existingQuotation, userId, id, fetchingQuotation, quotationError]);

  // ── Location remapping ────────────────────────────────────────────
  // Rewrites a product's locations[] with `mapLoc`, merges shares that end
  // up at the same floor/room, and re-syncs the flat fields the sheet uses.
  const remapProductLocations = (p, mapLoc) => {
    const locs =
      Array.isArray(p.locations) && p.locations.length > 0
        ? p.locations
        : p.floorId || p.roomId
          ? [
              {
                floorId: p.floorId || null,
                floorName: p.floorName || null,
                roomId: p.roomId || null,
                roomName: p.roomName || null,
                areaId: null,
                areaName: null,
                assignedQuantity: safeNum(p.qty, 1),
              },
            ]
          : [];
    if (locs.length === 0) return p;

    const merged = [];
    locs.map(mapLoc).forEach((l) => {
      const k = l.shareId || `${l.floorId || ''}::${l.roomId || ''}`;
      const existing = merged.find(
        (m) => (m.shareId || `${m.floorId || ''}::${m.roomId || ''}`) === k,
      );
      if (existing) {
        existing.assignedQuantity =
          safeNum(existing.assignedQuantity) + safeNum(l.assignedQuantity);
      } else {
        merged.push({ ...l });
      }
    });

    const single = merged.length === 1 && merged[0].floorId && merged[0].roomId ? merged[0] : null;

    return {
      ...p,
      locations: merged,
      floorId: single?.floorId || null,
      floorName: single?.floorName || null,
      roomId: single?.roomId || null,
      roomName: single?.roomName || null,
      areaId: null,
      areaName: null,
    };
  };

  // How many products have at least one share in this floor (or room).
  const countItemsIn = (floorId, roomId = null) =>
    formData.products.filter((p) => {
      const locs = p.locations?.length ? p.locations : [{ floorId: p.floorId, roomId: p.roomId }];
      return locs.some((l) => l.floorId === floorId && (!roomId || l.roomId === roomId));
    }).length;

  // ── Floor Handlers ────────────────────────────────────────────────
  const addFloor = (values) => {
    const newFloor = {
      floorId: generateId(),
      floorName: values.name.trim(),
      rooms: [],
    };
    setFormData((prev) => ({ ...prev, floors: [...prev.floors, newFloor] }));
    toast.success('Floor added');
    setShowAddFloorModal(false);
    floorForm.resetFields();
  };

  const openEditFloor = (floor) => {
    setEditingFloor(floor);
    setShowEditFloorModal(true);
  };

  // Also renames the denormalized floorName stored on assigned items.
  const editFloor = (values) => {
    if (!editingFloor) return;
    const name = values.name.trim();
    const { floorId } = editingFloor;
    setFormData((prev) => ({
      ...prev,
      floors: prev.floors.map((f) => (f.floorId === floorId ? { ...f, floorName: name } : f)),
      products: prev.products.map((p) =>
        remapProductLocations(p, (l) => (l.floorId === floorId ? { ...l, floorName: name } : l)),
      ),
    }));
    toast.success('Floor updated');
    setShowEditFloorModal(false);
    setEditingFloor(null);
    floorEditForm.resetFields();
  };

  // ── Room Handlers ─────────────────────────────────────────────────
  const addRoom = (values) => {
    if (!selectedFloorId) return;
    const newRoom = {
      roomId: generateId(),
      roomName: values.name.trim(),
      type: values.type || null,
      areas: [],
    };

    setFormData((prev) => ({
      ...prev,
      floors: prev.floors.map((f) =>
        f.floorId === selectedFloorId ? { ...f, rooms: [...(f.rooms || []), newRoom] } : f,
      ),
    }));
    toast.success('Room added');
    setShowAddRoomModal(false);
    roomForm.resetFields();
  };

  const openEditRoom = (floorId, room) => {
    setEditingRoom({
      floorId,
      roomId: room.roomId,
      roomName: room.roomName,
      type: room.type || undefined,
    });
    setShowEditRoomModal(true);
  };

  const editRoom = (values) => {
    if (!editingRoom) return;
    const name = values.name.trim();
    const { floorId, roomId } = editingRoom;
    setFormData((prev) => ({
      ...prev,
      floors: prev.floors.map((f) =>
        f.floorId !== floorId
          ? f
          : {
              ...f,
              rooms: (f.rooms || []).map((r) =>
                r.roomId === roomId ? { ...r, roomName: name, type: values.type || null } : r,
              ),
            },
      ),
      products: prev.products.map((p) =>
        remapProductLocations(p, (l) =>
          l.floorId === floorId && l.roomId === roomId ? { ...l, roomName: name } : l,
        ),
      ),
    }));
    toast.success('Room updated');
    setShowEditRoomModal(false);
    setEditingRoom(null);
  };

  // ── Delete Floor / Room (controlled confirm modal) ────────────────
  const deleteFloor = (floor) => setDeleteTarget({ type: 'floor', floor });

  const deleteRoom = (floorId, room) => setDeleteTarget({ type: 'room', floorId, room });

  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'floor') {
      const { floor } = deleteTarget;
      setFormData((prev) => ({
        ...prev,
        floors: prev.floors.filter((f) => f.floorId !== floor.floorId),
        products: prev.products.map((p) =>
          remapProductLocations(p, (l) => (l.floorId === floor.floorId ? { ...l, ...CLEARED } : l)),
        ),
      }));
      toast.success('Floor deleted');
    } else {
      const { floorId, room } = deleteTarget;
      setFormData((prev) => ({
        ...prev,
        floors: prev.floors.map((f) =>
          f.floorId !== floorId
            ? f
            : {
                ...f,
                rooms: (f.rooms || []).filter((r) => r.roomId !== room.roomId),
              },
        ),
        products: prev.products.map((p) =>
          remapProductLocations(p, (l) =>
            l.floorId === floorId && l.roomId === room.roomId ? { ...l, ...CLEARED } : l,
          ),
        ),
      }));
      toast.success('Room deleted');
    }

    setDeleteTarget(null);
  };

  // Text shown inside the delete confirm modal
  const deleteInfo = (() => {
    if (!deleteTarget) return null;

    if (deleteTarget.type === 'floor') {
      const { floor } = deleteTarget;
      const n = countItemsIn(floor.floorId);
      return {
        title: `Delete "${floor.floorName}"?`,
        body:
          n > 0
            ? `This floor and its rooms will be removed. ${n} item(s) placed here will move back to Unassigned.`
            : 'This floor and its rooms will be removed.',
      };
    }

    const { floorId, room } = deleteTarget;
    const n = countItemsIn(floorId, room.roomId);
    return {
      title: `Delete "${room.roomName}"?`,
      body:
        n > 0
          ? `${n} item(s) placed in this room will move back to Unassigned.`
          : 'This room will be removed.',
    };
  })();

  // ── Assign Location ───────────────────────────────────────────────
  const handleAssignLocation = (productId, assignments) => {
    if (!productId) {
      toast.error('Could not match this item — try again');
      setShowAssignModal(false);
      return;
    }

    const validAssignments = (assignments || []).filter((a) => a.floorId);
    if (validAssignments.length === 0) {
      toast.warning('No location selected');
      setShowAssignModal(false);
      return;
    }

    const primary = validAssignments[0];

    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.productId !== productId) return p;
        return {
          ...p,
          locations: validAssignments,
          floorId: primary.floorId || null,
          floorName: primary.floorName || null,
          roomId: primary.roomId || null,
          roomName: primary.roomName || null,
          areaId: primary.areaId || null,
          areaName: primary.areaName || null,
        };
      }),
    }));

    const label =
      validAssignments.length > 1
        ? `${validAssignments.length} locations`
        : [primary.floorName, primary.roomName, primary.areaName].filter(Boolean).join(' → ');

    toast.success(`Assigned to ${label}`);
    setShowAssignModal(false);
    setItemToAssign(null);
  };

  // ── Product Handlers ──────────────────────────────────────────────
  const addOption = (productId) => {
    if (!selectedParentId) return toast.error('Please select a parent product');

    const prod = searchResult.find((p) => (p.id || p.productId) === productId);
    if (!prod) return toast.warning('Product not found');

    const parent = formData.products.find(
      (p) => p.productId === selectedParentId && !p.isOptionFor,
    );
    if (!parent) return toast.error('Parent product not found');

    const price = safeNum(prod.meta?.['9ba862ef-f993-4873-95ef-1fef10036aa5'], 0);

    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          productId: prod.id || prod.productId,
          name: prod.name || 'Unknown',
          companyCode: productCompanyCode(prod),
          imageUrl: productImage(prod),
          qty: 1,
          sellingPrice: price,
          discount: 0,
          discountType: 'fixed',
          priority: prev.products.length,
          isOptionFor: selectedParentId,
          optionType,
          groupId: parent.groupId,
        },
      ],
    }));

    setShowAddOptionModal(false);
    setSearchTerm('');
    toast.success(`Added ${optionType}`);
  };

  const removeProduct = (productId) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.productId !== productId),
    }));
  };

  // ── Remove Product (location-aware) ──────────────────────────────
  const removeProductFromLocation = (productId, location) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.reduce((acc, p) => {
        if (p.productId !== productId) {
          acc.push(p);
          return acc;
        }

        if (!Array.isArray(p.locations) || p.locations.length <= 1 || !location) {
          return acc; // drop it
        }

        const remainingLocations = p.locations.filter(
          (loc) =>
            !(
              loc.floorId === location.floorId &&
              loc.roomId === location.roomId &&
              loc.areaId === location.areaId
            ),
        );

        if (remainingLocations.length === p.locations.length) {
          acc.push(p);
          return acc;
        }

        if (remainingLocations.length === 0) {
          return acc;
        }

        const newQty = remainingLocations.reduce(
          (sum, loc) => sum + safeNum(loc.assignedQuantity, 0),
          0,
        );
        const primary = remainingLocations[0];

        acc.push({
          ...p,
          qty: newQty,
          locations: remainingLocations,
          floorId: primary.floorId || null,
          floorName: primary.floorName || null,
          roomId: primary.roomId || null,
          roomName: primary.roomName || null,
          areaId: primary.areaId || null,
          areaName: primary.areaName || null,
        });
        return acc;
      }, []),
    }));
  };

  // Follow-up handlers
  const addFollowup = () =>
    setFormData((prev) => ({
      ...prev,
      followupDates: [...prev.followupDates, null],
    }));
  const removeFollowup = (index) =>
    setFormData((prev) => ({
      ...prev,
      followupDates: prev.followupDates.filter((_, i) => i !== index),
    }));
  const changeFollowup = (index, date) =>
    setFormData((prev) => {
      const dates = [...prev.followupDates];
      dates[index] = date;
      return { ...prev, followupDates: dates };
    });

  // ── Calculations ──────────────────────────────────────────────────
  const { mainProducts } = useMemo(
    () => ({
      mainProducts: formData.products.filter((p) => !p.isOptionFor),
    }),
    [formData.products],
  );

  // Same maths as the server and the PDF (utils/quotationMath)
  const calculations = useMemo(() => {
    // Advanced discounting cannot be calculated until the user chooses inclusive or exclusive.
    if (
      resolvePricingMode({ discountMode: formData.discountMode, gstBasis: formData.gstBasis })
        .pricingMode === null
    ) {
      return {
        mainSubtotal: 0,
        mainLineDiscount: 0,
        extraDiscAmt: 0,
        shipping: 0,
        taxableValue: 0,
        roundOff: 0,
        gstAmount: 0,
        finalAmount: 0,
        needsGstBasis: true,
      };
    }
    const t = quotationTotals({
      miscellaneousChargeItems: formData.miscellaneousChargeItems,
      additionalDiscount: formData.additionalDiscount,
      flatPrice: formData.flatPrice,
      items: mainProducts.map((p) => ({
        ...p,
        price: safeNum(p.sellingPrice, 0),
        quantity: safeNum(p.qty, 1),
        discount: safeNum(p.discount, 0),
        discountType: p.discountType || 'fixed',
      })),
      shipping: safeNum(formData.shippingAmount),
      extraDiscount: safeNum(formData.extraDiscount),
      extraDiscountType: formData.extraDiscountType || 'percent',
      gstRate: safeNum(formData.gst),
      discountMode: formData.discountMode,
      gstBasis: formData.gstBasis,
    });
    return {
      mainSubtotal: t.goodsValue,
      mainLineDiscount: t.lineDiscount,
      extraDiscAmt: t.extraDiscountAmount,
      shipping: t.freight,
      taxableValue: t.taxableValue,
      roundOff: t.roundOff,
      gstAmount: t.gstAmount,
      finalAmount: t.grandTotal,
      beforeRound: t.beforeRound,
      gstInclusive: t.gstInclusive,
      gstExcluded: t.gstExcluded,
      pricingLines: t.lines,
      needsGstBasis: false,
    };
  }, [
    mainProducts,
    formData.miscellaneousChargeItems,
    formData.additionalDiscount,
    formData.flatPrice,
    formData.shippingAmount,
    formData.gst,
    formData.discountMode,
    formData.gstBasis,
    formData.extraDiscount,
    formData.extraDiscountType,
  ]);

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if ((formData.miscellaneousChargeItems || []).some((charge) => !charge.name?.trim()))
      return toast.error('Please enter a name for each miscellaneous charge');
    if (formData.discountMode === 'advanced' && !formData.gstBasis)
      return toast.error('Choose GST inclusive or exclusive for advanced discounting');
    if (!formData.customerId) return toast.error('Please select a customer');
    if (formData.products.length === 0) return toast.error('Please add at least one product');

    const formatDateSafe = (date) => {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) return null;
      try {
        return format(date, 'yyyy-MM-dd');
      } catch {
        return null;
      }
    };

    const finalShipTo = formData.shipTo && formData.shipTo.trim() !== '' ? formData.shipTo : null;

    const cleanProducts = formData.products.map((p) => {
      const qty = safeNum(p.qty, 1);
      const sellingPrice = safeNum(p.sellingPrice, 0);
      const discount = safeNum(p.discount, 0);
      const discountType = p.discountType || 'fixed';

      const lineTotal = lineAmounts({ ...p, price: sellingPrice, quantity: qty }).net;

      const locations =
        p.locations && p.locations.length > 0
          ? p.locations.map((loc) => ({
              ...(loc.shareId ? { shareId: loc.shareId } : {}),
              floorId: loc.floorId || null,
              floorName: loc.floorName || null,
              roomId: loc.roomId || null,
              roomName: loc.roomName || null,
              areaId: loc.areaId || null,
              areaName: loc.areaName || null,
              assignedQuantity: safeNum(loc.assignedQuantity, qty),
              priority: loc.priority ?? p.priority ?? 0,
            }))
          : p.areaId || p.roomId || p.floorId
            ? [
                {
                  floorId: p.floorId || null,
                  floorName: p.floorName || null,
                  roomId: p.roomId || null,
                  roomName: p.roomName || null,
                  areaId: p.areaId || null,
                  areaName: p.areaName || null,
                  assignedQuantity: qty,
                  priority: p.priority ?? 0, // ← and here
                },
              ]
            : [];
      return {
        productId: p.productId,
        name: p.name,
        companyCode: productCompanyCode(p),
        imageUrl: productImage(p),
        quantity: qty,
        price: sellingPrice,
        sellingPrice: sellingPrice,
        additionalDiscount: safeNum(p.additionalDiscount),
        flatPrice: p.flatPrice == null ? null : safeNum(p.flatPrice),
        discount: discount,
        discountType: discountType,
        isOptionFor: p.isOptionFor || null,
        optionType: p.optionType || null,
        groupId: p.groupId,
        priority: safeNum(p.priority, 0),
        locations: locations,

        floorId: p.floorId || null,
        floorName: p.floorName || null,
        roomId: p.roomId || null,
        roomName: p.roomName || null,
        areaId: p.areaId || null,
        areaName: p.areaName || null,

        total: Number(lineTotal.toFixed(2)),
      };
    });

    const payload = {
      document_title: formData.document_title,
      customerId: formData.customerId,
      shipTo: finalShipTo,
      quotation_date: formatDateSafe(formData.quotation_date),
      due_date: formatDateSafe(formData.due_date),
      miscellaneousChargeItems: formData.miscellaneousChargeItems,
      additionalDiscount: safeNum(formData.additionalDiscount),
      flatPrice: formData.flatPrice == null ? null : safeNum(formData.flatPrice),
      shippingAmount: safeNum(formData.shippingAmount),
      discountMode: formData.discountMode,
      gstBasis: formData.discountMode === 'advanced' ? formData.gstBasis : null,
      gstInclusive: formData.discountMode === 'advanced' && formData.gstBasis === 'inclusive',
      gst: safeNum(formData.gst),
      extraDiscount: safeNum(formData.extraDiscount),
      extraDiscountType: formData.extraDiscountType || 'fixed',
      signature_name: formData.signature_name || '',
      signature_image: formData.signature_image || '',
      createdBy: userId,

      products: cleanProducts,
      floors: formData.floors || [],
      followupDates: formData.followupDates
        .filter(Boolean)
        .map((d) => formatDateSafe(d))
        .filter(Boolean),
    };

    try {
      if (isEditMode) {
        await updateQuotation({ id, updatedQuotation: payload }).unwrap();
        toast.success('Quotation updated successfully');
      } else {
        await createQuotation(payload).unwrap();
        toast.success('Quotation created successfully');
      }
      navigate('/quotations/list');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save quotation');
    }
  };

  if (loadingQuotation || (isEditMode && fetchingQuotation)) {
    return (
      <Loader className="fv2-addquntation-47183b8b0d" tip="Loading quotation..." size="large" />
    );
  }

  if (isEditMode && (quotationError || !existingQuotation)) {
    return (
      <Alert
        type="error"
        showIcon
        message="Could not load quotation from the database. Reload to try again."
      />
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title={isEditMode ? 'Edit Quotation' : 'Create Quotation'}
          subtitle="Fill in all quotation details"
        />

        <Space className="fv2-addquntation-1f25345416">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/quotations/list')}>
            Back
          </Button>
          <Button disabled={!formData.products.length} onClick={() => setShowResyncModal(true)}>
            RESYNC
          </Button>
          {isEditMode && versionsData.length > 0 && (
            <Button onClick={() => setShowVersionsModal(true)}>
              Versions ({versionsData.length})
            </Button>
          )}
        </Space>

        <Form layout="vertical">
          {/* Customer & Shipping Card */}
          <Card className="fv2-addquntation-1f25345416" title="Customer & Shipping">
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Customer *" required>
                  <Space.Compact className="fv2-addquntation-30e0040604">
                    <Select
                      className="fv2-addquntation-0855f99a21"
                      showSearch
                      value={formData.customerId}
                      onChange={(v) =>
                        setFormData({
                          ...formData,
                          customerId: v,
                          shipTo: null,
                        })
                      }
                      placeholder="Select customer"
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {(customersData?.data || []).map((c) => {
                        const displayName =
                          `${c.name} ${c.companyName ? `(${c.companyName})` : ''}`.trim();

                        return (
                          <Option key={c.customerId} value={c.customerId} label={displayName}>
                            {displayName}
                          </Option>
                        );
                      })}
                    </Select>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setShowCustomerModal(true)}
                    />
                  </Space.Compact>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item label="Shipping Address (Optional)">
                  <Space.Compact className="fv2-addquntation-30e0040604">
                    <Select
                      className="fv2-addquntation-0855f99a21"
                      placeholder="Select shipping address (optional)"
                      value={formData.shipTo || undefined}
                      onChange={(v) =>
                        setFormData({
                          ...formData,
                          shipTo: v || null,
                        })
                      }
                      disabled={!formData.customerId}

                      allowClear
                    >
                      {(addressesData || [])
                        .filter((a) => a.customerId === formData.customerId)
                        .map((a) => (
                          <Option key={a.addressId} value={a.addressId}>
                            {a.street}, {a.city}, {a.state}
                          </Option>
                        ))}
                    </Select>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setShowAddressModal(true)}
                      disabled={!formData.customerId}
                    />
                  </Space.Compact>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Quotation Details */}
          <Card
            className="fv2-addquntation-1f25345416"
            title="Quotation Details"

            styles={{ body: { paddingTop: 16 } }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item className="fv2-addquntation-0434bc7d7a" label="Quotation Title" required>
                  <Input
                    value={formData.document_title}
                    placeholder="e.g. Bathroom Fittings Quotation"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        document_title: e.target.value,
                      })
                    }
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item className="fv2-addquntation-0434bc7d7a" label="Quotation Number">
                  <Input value="Auto-generated" disabled />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Card className="fv2-addquntation-e0ef3fd3db" size="small">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        className="fv2-addquntation-61426fe4ee"
                        label="Quotation Date"
                        required
                      >
                        <DatePicker
                          selected={formData.quotation_date}
                          onChange={(d) => setFormData({ ...formData, quotation_date: d })}
                          dateFormat="dd/MM/yyyy"
                          className="ant-input"
                          isClearable
                          placeholderText="Select quotation date"
                          wrapperClassName="w-100"
                        />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item className="fv2-addquntation-61426fe4ee" label="Due Date">
                        <DatePicker
                          selected={formData.due_date}
                          onChange={(d) => setFormData({ ...formData, due_date: d })}
                          dateFormat="dd/MM/yyyy"
                          className="ant-input"
                          isClearable
                          placeholderText="Optional due date"
                          minDate={formData.quotation_date}
                          wrapperClassName="w-100"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </Col>

              <Col xs={24}>
                <Form.Item className="fv2-addquntation-0434bc7d7a" label="Follow-up Schedule">
                  <Space wrap>
                    {formData.followupDates.map((date, i) => (
                      <div className="fv2-addquntation-5e53744cdc" key={i}>
                        <DatePicker
                          selected={date}
                          onChange={(d) => changeFollowup(i, d)}
                          dateFormat="dd/MM/yyyy"
                          minDate={new Date()}
                          maxDate={formData.due_date}
                          className="ant-input"
                        />

                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => removeFollowup(i)}
                        />
                      </div>
                    ))}

                    <Button type="dashed" icon={<PlusOutlined />} onClick={addFollowup}>
                      Add Follow-up
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/*
            Products & Options — floors and rooms are created, renamed and
            deleted directly from the sheet's tabs.
          */}
          <Card
            className="fv2-addquntation-0ad1b53eb0"
            title="Products & Options"
            bodyStyle={{ padding: 12 }}
          >
            <QuotationProductSheet
              formData={formData}
              setFormData={setFormData}
              searchResult={searchResult}
              isSearching={isSearching}
              searchTerm={searchTerm}
              onSearch={debouncedSearch}
              safeNum={safeNum}
              onAddOption={(product) => {
                setSelectedParentId(product.productId);
                setShowAddOptionModal(true);
              }}
              onAddFloor={() => setShowAddFloorModal(true)}
              onEditFloor={openEditFloor}
              onDeleteFloor={deleteFloor}
              onAddRoom={(floorId) => {
                setSelectedFloorId(floorId);
                setShowAddRoomModal(true);
              }}
              onEditRoom={openEditRoom}
              onDeleteRoom={deleteRoom}
              onRemoveFromLocation={removeProductFromLocation}
              onRemoveProduct={removeProduct}
            />
          </Card>

          {/* Financial Summary */}
          <Card
            className="fv2-addquntation-355919982d"
            title="Financial Summary"

            bodyStyle={{ padding: 16 }}
          >
            <p>
              <Text type="secondary">
                Item additional discounts apply per unit. Flat price replaces the discounted goods
                price. Quotation adjustments, shipping and GST apply afterward.
              </Text>
            </p>
            <Form.Item label="Miscellaneous charges">
              {(formData.miscellaneousChargeItems || []).map((charge, index) => (
                <Space className="fv2-addquntation-1867c1767e" key={index}>
                  <Input
                    placeholder="Charge name (e.g. Packing)"
                    aria-label="Charge name"
                    value={charge.name}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        miscellaneousChargeItems: prev.miscellaneousChargeItems.map((row, i) =>
                          i === index ? { ...row, name: event.target.value } : row,
                        ),
                      }))
                    }
                  />
                  <InputNumber
                    min={0}
                    precision={2}
                    addonBefore="₹"
                    aria-label="Charge amount"
                    value={charge.amount}
                    onChange={(amount) =>
                      setFormData((prev) => ({
                        ...prev,
                        miscellaneousChargeItems: prev.miscellaneousChargeItems.map((row, i) =>
                          i === index ? { ...row, amount: amount ?? 0 } : row,
                        ),
                      }))
                    }
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    aria-label="Remove charge"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        miscellaneousChargeItems: prev.miscellaneousChargeItems.filter(
                          (_, i) => i !== index,
                        ),
                      }))
                    }
                  />
                </Space>
              ))}
              <Button
                icon={<PlusOutlined />}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    miscellaneousChargeItems: [
                      ...(prev.miscellaneousChargeItems || []),
                      { name: '', amount: 0 },
                    ],
                  }))
                }
              >
                Add charge
              </Button>
            </Form.Item>
            <Row gutter={[16, 16]}>
              {[
                ['additionalDiscount', 'Additional discount (₹)'],
                ['flatPrice', formData.discountMode === 'advanced'
                  ? 'Flat goods price including GST (₹, optional)'
                  : 'Flat goods price before GST (₹, optional)'],
              ].map(([field, label]) => (
                <Col xs={24} sm={8} key={field}>
                  <Form.Item label={label}>
                    <InputNumber
                      className="fv2-addquntation-30e0040604"
                      min={0}
                      precision={2}
                      value={formData[field]}

                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          [field]: field === 'flatPrice' ? value : (value ?? 0),
                        }))
                      }
                    />
                  </Form.Item>
                </Col>
              ))}
              <Col xs={24} sm={8}>
                <Card className="fv2-addquntation-9843215e0d" size="small">
                  <Statistic
                    title="Goods value (after line discounts)"
                    value={calculations.mainSubtotal}
                    precision={2}
                    prefix="₹"
                  />
                </Card>
              </Col>

              <Col xs={24} sm={8}>
                <Card className="fv2-addquntation-936ed52504" size="small">
                  <Statistic
                    title="Line Discounts"
                    value={-calculations.mainLineDiscount}
                    precision={2}
                    prefix="₹"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={8}>
                <Card className="fv2-addquntation-1c268ff557" size="small">
                  <Statistic
                    title="Extra Discount"
                    value={-calculations.extraDiscAmt}
                    precision={2}
                    prefix="₹"
                    valueStyle={{ color: '#d48806' }}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12}>
                <Card className="fv2-addquntation-904354e8f8" size="small">
                  <Form.Item label="Shipping Charges">
                    <InputNumber
                      className="fv2-addquntation-0159f17c20"
                      min={0}
                      value={formData.shippingAmount}
                      onChange={(v) => setFormData({ ...formData, shippingAmount: v })}

                      addonBefore="₹"
                    />
                  </Form.Item>
                </Card>
              </Col>

              <Col xs={24} sm={12}>
                <Card className="fv2-addquntation-904354e8f8" size="small">
                  <Form.Item label="Round Off">
                    <InputNumber
                      className="fv2-addquntation-0159f17c20"
                      disabled
                      value={calculations.roundOff}
                    />
                  </Form.Item>
                </Card>
              </Col>

              <Col xs={24} sm={12}>
                <Card className="fv2-addquntation-904354e8f8" size="small">
                  <Form.Item label="Import discount preset">
                    <Select
                      placeholder="Choose a preset"
                      value={undefined}
                      options={(quotationDefaults?.discountPresets || []).map((p) => ({
                        value: p.id,
                        label: p.name,
                      }))}
                      onChange={(id) => {
                        const p = quotationDefaults.discountPresets.find((p) => p.id === id);
                        if (p)
                          setFormData((prev) => ({
                            ...prev,
                            discountMode: p.discountMode,
                            gstBasis: p.gstBasis,
                            gst: p.gstRate,
                          }));
                      }}
                    />
                  </Form.Item>
                  <Form.Item label="Discount mode">
                    <Select
                      value={formData.discountMode}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, discountMode: value }))
                      }
                      options={[
                        { value: 'generic', label: 'Generic (GST added on top)' },
                        { value: 'advanced', label: 'Advanced' },
                      ]}
                    />
                  </Form.Item>
                  {formData.discountMode === 'advanced' && (
                    <Form.Item
                      label="GST basis of product prices"
                      help={
                        formData.gstBasis ? undefined : 'Choose one to calculate this quotation'
                      }
                      validateStatus={formData.gstBasis ? undefined : 'warning'}
                    >
                      <Select
                        placeholder="Choose inclusive or exclusive"
                        value={formData.gstBasis ?? undefined}
                        onChange={(value) => setFormData((prev) => ({ ...prev, gstBasis: value }))}
                        options={[
                          {
                            value: 'inclusive',
                            label: 'Inclusive: GST is inside the product price',
                          },
                          { value: 'exclusive', label: 'Exclusive: GST is added on top' },
                        ]}
                      />
                    </Form.Item>
                  )}
                  <Form.Item label="Global GST (%)">
                    <InputNumber
                      className="fv2-addquntation-0159f17c20"
                      min={0}
                      max={100}
                      precision={2}
                      value={formData.gst}
                      addonAfter="%"
                      onChange={(v) => setFormData((prev) => ({ ...prev, gst: v ?? 0 }))}
                    />
                  </Form.Item>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card className="fv2-addquntation-904354e8f8" size="small">
                  <Statistic
                    title={
                      formData.discountMode === 'advanced' && formData.gstBasis === 'inclusive'
                        ? 'GST included in total'
                        : 'GST Amount'
                    }
                    value={calculations.gstAmount}
                    precision={2}
                    prefix="₹"
                  />
                </Card>
              </Col>

              <Col xs={24}>
                <Card className="fv2-addquntation-2f8b506090">
                  <div className="fv2-addquntation-bd36d6c7fe">
                    <div>
                      <Text type="secondary">Grand Total</Text>
                      <div className="fv2-addquntation-224248bc4e">
                        ₹{calculations.finalAmount.toFixed(2)}
                      </div>
                    </div>

                    <div className="fv2-addquntation-4ab8a4d054">
                      <Text type="secondary">Taxable value (before GST)</Text>
                      <div className="fv2-addquntation-56bebc8945">
                        ₹{calculations.taxableValue.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              {calculations.optionalPotential > 0 && (
                <Col xs={24}>
                  <Card className="fv2-addquntation-d3339c9e51" size="small">
                    <div>
                      <Text className="fv2-addquntation-236cd17d91" strong>
                        Optional Items Potential
                      </Text>

                      <div className="fv2-addquntation-052cd930a9">
                        ₹{calculations.optionalPotential}
                      </div>

                      <Text type="secondary">(not included in final quotation total)</Text>
                    </div>
                  </Card>
                </Col>
              )}
            </Row>
          </Card>

          {/* Actions */}
          <div className="fv2-addquntation-84d1664c8b">
            <Space size="large">
              <Button size="large" onClick={() => navigate('/quotations/list')}>
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                size="large"
                loading={isCreating || isUpdating}
                onClick={handleSubmit}
                disabled={!formData.customerId || formData.products.length === 0}
              >
                {isEditMode ? 'Update Quotation' : 'Create Quotation'}
              </Button>
            </Space>
          </div>

          {/* ====================== MODALS ====================== */}

          <AddFloorModal
            visible={showAddFloorModal}
            onCancel={() => setShowAddFloorModal(false)}
            onFinish={addFloor}
            form={floorForm}
          />

          <EditFloorModal
            visible={showEditFloorModal}
            floorName={editingFloor?.floorName || ''}
            onCancel={() => {
              setShowEditFloorModal(false);
              setEditingFloor(null);
            }}
            onFinish={editFloor}
            form={floorEditForm}
          />

          <AddEditRoomModal
            visible={showAddRoomModal}
            onCancel={() => setShowAddRoomModal(false)}
            onFinish={addRoom}
            form={roomForm}
          />

          <AddEditRoomModal
            visible={showEditRoomModal}
            isEdit
            initialValues={editRoomInitialValues}
            onCancel={() => {
              setShowEditRoomModal(false);
              setEditingRoom(null);
            }}
            onFinish={editRoom}
            form={roomEditForm}
          />

          <AssignItemModal
            visible={showAssignModal}
            onCancel={() => setShowAssignModal(false)}
            onAssign={handleAssignLocation}
            item={itemToAssign}
            floors={formData.floors}
          />

          {/* Delete Floor / Room confirmation */}
          <ModalShell
            open={Boolean(deleteTarget)}
            title={deleteInfo?.title}
            okText="Delete"
            okButtonProps={{ danger: true }}
            onOk={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
            destroyOnClose
          >
            {deleteInfo?.body}
          </ModalShell>

          {/* Add Option Modal */}
          {showResyncModal && (
            <QuotationResyncModal
              open={showResyncModal}
              products={formData.products}
              onCancel={() => setShowResyncModal(false)}
              onApply={(updates) => {
                setFormData((prev) => ({
                  ...prev,
                  products: prev.products.map((p) =>
                    updates[p.productId] ? { ...p, ...updates[p.productId] } : p,
                  ),
                }));
                setShowResyncModal(false);
              }}
            />
          )}
          <ModalShell
            title="Add Option / Variant / Upgrade"
            open={showAddOptionModal}
            onCancel={() => {
              setShowAddOptionModal(false);
              setSelectedParentId(null);
            }}
            footer={null}
            width={600}
          >
            <Space className="fv2-addquntation-30e0040604" direction="vertical" size="large">
              <div>
                <label className="fv2-addquntation-f1990a45ec">Select parent product:</label>
                <Select
                  className="fv2-addquntation-30e0040604"
                  value={selectedParentId}
                  onChange={setSelectedParentId}

                  placeholder="Choose main product"
                >
                  {mainProducts.map((p) => (
                    <Option key={p.productId} value={p.productId}>
                      {p.name} — ₹{safeNum(p.sellingPrice, 0).toFixed(2)}
                    </Option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="fv2-addquntation-f1990a45ec">Option type:</label>
                <Select
                  className="fv2-addquntation-30e0040604"
                  value={optionType}
                  onChange={setOptionType}
                >
                  <Option value="addon">Add-on</Option>
                  <Option value="upgrade">Upgrade</Option>
                  <Option value="variant">Variant</Option>
                </Select>
              </div>

              <div>
                <label className="fv2-addquntation-f1990a45ec">Search product:</label>
                <Select
                  className="fv2-addquntation-30e0040604"
                  showSearch
                  prefix={<SearchOutlined />}
                  placeholder={`Search ${optionType}...`}
                  onSearch={debouncedSearch}
                  onChange={addOption}
                  filterOption={false}
                  notFoundContent={
                    isSearching ? (
                      <Loader size="small" />
                    ) : searchTerm ? (
                      'No results'
                    ) : (
                      'Type to search'
                    )
                  }
                >
                  {searchResult.map((p) => {
                    const price = safeNum(p.meta?.['9ba862ef-f993-4873-95ef-1fef10036aa5'], 0);
                    return (
                      <Option key={p.id || p.productId} value={p.id || p.productId}>
                        {p.name} — ₹{price.toFixed(2)}
                      </Option>
                    );
                  })}
                </Select>
              </div>
            </Space>
          </ModalShell>

          {/* Add Customer Modal */}
          <AddCustomerModal
            visible={showCustomerModal}
            onClose={() => setShowCustomerModal(false)}
          />

          {/* Add Address Modal */}
          {showAddressModal && (
            <AddAddress
              onClose={() => setShowAddressModal(false)}
              onSave={(addrId) => {
                setFormData((prev) => ({ ...prev, shipTo: addrId }));
                refetchAddresses();
              }}
              selectedCustomer={formData.customerId}
            />
          )}
        </Form>
      </div>
    </div>
  );
};

export default AddQuotation;
