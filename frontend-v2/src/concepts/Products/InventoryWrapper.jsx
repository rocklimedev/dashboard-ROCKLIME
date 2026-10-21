import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Table,
  Input,
  InputNumber,
  Button,
  Space,
  Typography,
  message,
  Row,
  Col,
  Grid,
  Pagination,
  Tag,
  Card,
  Spin,
  Tooltip,
  Dropdown,
  Menu,
  Select,
  Drawer,
  Checkbox,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  MinusOutlined,
  HistoryOutlined,
  ReloadOutlined,
  FilterOutlined,
  MoreOutlined,
} from '@ant-design/icons';

import StockModal from '../../components/modals/StockModal';
import {
  useGetAllProductsQuery,
  useGetCompanyCodesQuery,
  useAddStockMutation,
  useRemoveStockMutation,
  useDeleteProductMutation,
} from '../../api/productApi';

import PageHeader from '../../components/Common/PageHeader';
import pos from '../../assets/img/default.png';
import HistoryModalAntD from '../../components/modals/HistoryModal';

import DeleteModal from '../../components/Common/DeleteModal';
import PermissionGate from '../../context/PermissionGate';

import InventoryBulkActions from '../../components/Inventory/InventoryBulkActions';
import { useGetAllBrandsQuery } from '../../api/brandsApi';

const { Text } = Typography;

const InventoryWrapper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  // Initial values from URL
  const queryParams = new URLSearchParams(location.search);
  const validTabs = ['all', 'in-stock', 'low-stock', 'out-of-stock'];
  const initialTab = validTabs.includes(queryParams.get('tab')) ? queryParams.get('tab') : 'all';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [currentPage, setCurrentPage] = useState(
    Math.max(1, parseInt(queryParams.get('page'), 10) || 1),
  );
  const [pageSize, setPageSize] = useState(() => {
    const limit = Number(queryParams.get('limit'));
    return [10, 25, 50, 100].includes(limit) ? limit : 50;
  });

  const [search, setSearch] = useState(queryParams.get('search') || '');
  const [brandId, setBrandId] = useState(
    queryParams.get('brandId') || queryParams.get('brand') || undefined,
  );
  const { data: brands = [], isFetching: loadingBrands } = useGetAllBrandsQuery();
  const brandNames = useMemo(
    () => new Map(brands.map((brand) => [brand.id, brand.brandName])),
    [brands],
  );
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [companyCode, setCompanyCode] = useState(queryParams.get('companyCode') || undefined);
  const {
    data: companyCodes = [],
    isFetching: loadingCompanyCodes,
    isError: companyCodesError,
  } = useGetCompanyCodesQuery();
  const [duplicateCompanyCode, setDuplicateCompanyCode] = useState(
    queryParams.get('duplicateCompanyCode') === 'true',
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    Number(queryParams.get('lowStockThreshold')) || 10,
  );
  const numberParam = (key) =>
    queryParams.has(key) &&
    queryParams.get(key) !== '' &&
    Number.isFinite(Number(queryParams.get(key)))
      ? Number(queryParams.get(key))
      : null;
  const [maxStockFilter, setMaxStockFilter] = useState(numberParam('maxStock'));
  const [priceRange, setPriceRange] = useState([numberParam('minPrice'), numberParam('maxPrice')]);

  // Modals
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAction, setStockAction] = useState('add');

  const [selectedInventory, setSelectedInventory] = useState({});
  const selectedInventoryProducts = Object.values(selectedInventory);

  // ==================== MAIN QUERY (Optimized) ====================
  const queryArgs = useMemo(
    () => ({
      page: currentPage,
      limit: pageSize,
      search: search.trim() || undefined,
      tab: activeTab,
      brandId,
      duplicateCompanyCode,
      companyCode,
      maxStock: maxStockFilter,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      lowStockThreshold,
    }),
    [
      currentPage,
      pageSize,
      search,
      activeTab,
      lowStockThreshold,
      brandId,
      duplicateCompanyCode,
      companyCode,
      maxStockFilter,
      priceRange,
    ],
  );

  const {
    currentData: response,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllProductsQuery(queryArgs, { refetchOnMountOrArgChange: true });

  const [addStock] = useAddStockMutation();
  const [removeStock] = useRemoveStockMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const products = useMemo(() => response?.data || [], [response?.data]);
  useEffect(() => {
    setSelectedInventory((previous) => {
      const refreshed = { ...previous };
      let changed = false;
      for (const product of products)
        if (previous[product.productId] && previous[product.productId] !== product) {
          refreshed[product.productId] = product;
          changed = true;
        }
      return changed ? refreshed : previous;
    });
  }, [products]);
  const paginationInfo = response?.pagination || {
    total: 0,
    page: 1,
    limit: 50,
  };
  useEffect(() => {
    if (response?.pagination && response.pagination.page !== currentPage) {
      setCurrentPage(response.pagination.page);
    }
  }, [response, currentPage]);
  const getSellingPrice = (metaDetails) => {
    if (!Array.isArray(metaDetails) || metaDetails.length === 0) return null;

    // Primary: Exact match on slug or title (most reliable)
    const priceField = metaDetails.find(
      (d) =>
        d.slug?.replace(/[_\s-]/g, '').toLowerCase() === 'sellingprice' ||
        d.id === '9ba862ef-f993-4873-95ef-1fef10036aa5' ||
        d.id === 'sellingPrice' ||
        d.id === 'selling_price',
    );

    if (priceField) {
      if (priceField.value == null || String(priceField.value).trim() === '') return null;
      const num = Number(priceField.value);
      return Number.isFinite(num) ? num : null;
    }

    return null;
  };
  const filteredProducts = products;
  const counts = response?.counts || {
    all: 0,
    inStock: 0,
    lowStock: 0,
    outStock: 0,
  };
  // ==================== URL SYNC ====================
  useEffect(() => {
    const params = new URLSearchParams();

    if (activeTab !== 'all') params.set('tab', activeTab);
    if (currentPage > 1) params.set('page', currentPage);
    if (pageSize !== 50) params.set('limit', pageSize);
    if (search.trim()) params.set('search', search.trim());
    if (brandId) params.set('brandId', brandId);
    if (duplicateCompanyCode) params.set('duplicateCompanyCode', 'true');
    if (companyCode) params.set('companyCode', companyCode);
    if (maxStockFilter !== null) params.set('maxStock', maxStockFilter);
    if (priceRange[0] !== null) params.set('minPrice', priceRange[0]);
    if (priceRange[1] !== null) params.set('maxPrice', priceRange[1]);
    if (lowStockThreshold !== 10) {
      params.set('lowStockThreshold', lowStockThreshold);
    }

    const newSearch = params.toString();
    if (newSearch !== location.search.slice(1)) {
      navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, {
        replace: true,
      });
    }
  }, [
    activeTab,
    currentPage,
    pageSize,
    search,
    brandId,
    duplicateCompanyCode,
    companyCode,
    maxStockFilter,
    priceRange,
    lowStockThreshold,
    navigate,
    location.pathname,
  ]);

  // Auto-switch from dashboard
  useEffect(() => {
    if (queryParams.has('low_stock') && activeTab === 'all') {
      setActiveTab('low-stock');
      const newParams = new URLSearchParams(location.search);
      newParams.delete('low_stock');
      newParams.set('tab', 'low-stock');
      navigate(`${location.pathname}?${newParams.toString()}`, {
        replace: true,
      });
    }
  }, [location.search, activeTab, navigate]);

  const handleTabChange = (key) => {
    setCurrentPage(1);
    setActiveTab(key);
  };

  const handlePageChange = (page, size) => {
    setCurrentPage(size && size !== pageSize ? 1 : page);
    if (size) setPageSize(size);
  };

  // ==================== HELPERS ====================
  const parseImages = (images) => {
    try {
      if (typeof images === 'string') {
        const parsed = JSON.parse(images);
        return Array.isArray(parsed) && parsed.length ? parsed : [pos];
      }
      return Array.isArray(images) && images.length ? images : [pos];
    } catch {
      return [pos];
    }
  };

  const getCompanyCode = (metaDetails) => {
    if (!Array.isArray(metaDetails) || !metaDetails.length) return 'N/A';
    const field = metaDetails.find(
      (d) =>
        d.slug?.replace(/[_\s-]/g, '').toLowerCase() === 'companycode' ||
        d.id === 'd11da9f9-3f2e-4536-8236-9671200cca4a' ||
        d.id === 'companyCode' ||
        d.id === 'company_code',
    );
    return field?.value != null && String(field.value).trim() ? String(field.value).trim() : 'N/A';
  };

  // ==================== ACTIONS ====================
  const openStockModal = (product, action) => {
    setSelectedProduct(product);
    setStockAction(action);
    setStockModalOpen(true);
  };

  const openHistoryModal = (product) => {
    setSelectedProduct(product);
    setHistoryModalOpen(true);
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct?.productId) return;
    try {
      await deleteProduct(selectedProduct.productId).unwrap();
      message.success('Product deleted successfully');
      refetch();
    } catch (err) {
      message.error(err?.data?.message || 'Failed to delete product');
    } finally {
      setDeleteModalVisible(false);
      setSelectedProduct(null);
    }
  };

  const handleStockSubmit = async (values) => {
    try {
      if (stockAction === 'add') {
        await addStock({
          productId: selectedProduct.productId,
          quantity: values.quantity,
        }).unwrap();
        message.success(`Added ${values.quantity} units`);
      } else {
        await removeStock({
          productId: selectedProduct.productId,
          quantity: values.quantity,
        }).unwrap();
        message.success(`Removed ${values.quantity} units`);
      }
      refetch();
    } catch (err) {
      message.error(err?.data?.message || 'Failed to update stock');
    } finally {
      setStockModalOpen(false);
      setSelectedProduct(null);
    }
  };

  const moreMenu = (record) => (
    <Menu>
      <Menu.Item key="references">
        <Link to={`/inventory/${encodeURIComponent(record.productId)}/references`}>References</Link>
      </Menu.Item>
      <Menu.Item key="inventory">
        <Link to={`/product/${record.productId}/inventory`}>Check Inventory</Link>
      </Menu.Item>
      <Menu.Item key="edit">
        <Link to={`/product/${record.productId}/edit`}>Edit Product</Link>
      </Menu.Item>
      <PermissionGate api="delete" module="products">
        <Menu.Item danger key="delete" onClick={() => handleDeleteClick(record)}>
          Delete Product
        </Menu.Item>
      </PermissionGate>
    </Menu>
  );

  // ==================== TABLE COLUMNS ====================
  const columns = [
    {
      title: 'Image',
      dataIndex: 'images',
      width: 80,
      render: (images) => (
        <img
          src={parseImages(images)[0]}
          alt="Product"
          style={{
            width: 56,
            height: 56,
            objectFit: 'cover',
            borderRadius: 8,
            border: '1px solid #f0f0f0',
          }}
        />
      ),
    },
    {
      title: 'Product',
      dataIndex: 'name',
      render: (_, record) => (
        <div>
          <Link to={`/product/${record.productId}`} className="product-link">
            {record.name || 'Unnamed Product'}
          </Link>
          <div className="product-codes">
            <Tag color="blue">{brandNames.get(record.brandId) || 'Not Branded'}</Tag>
            {record.product_code && <Tag className="code-tag">{record.product_code}</Tag>}
            <Tag className="code-tag">{getCompanyCode(record.metaDetails)}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: 'Price',
      responsive: ['md'],
      render: (_, r) => {
        const price = getSellingPrice(r.metaDetails);
        return price !== null ? (
          <strong className="price-text">₹{price.toLocaleString('en-IN')}</strong>
        ) : (
          <Text type="secondary">—</Text>
        );
      },
      align: 'right',
    },
    {
      title: 'Stock',
      dataIndex: 'quantity',
      align: 'center',
      width: 120,
      render: (qty) => {
        if (qty === 0) return <Tag color="error">Out of Stock</Tag>;
        if (qty <= lowStockThreshold) return <Tag color="warning">{qty} Low</Tag>;
        return <Tag color="success">{qty} In Stock</Tag>;
      },
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      responsive: ['lg'],
      width: 140,
      render: (date) =>
        date ? (
          <Tooltip title={new Date(date).toLocaleString()}>
            <Text type="secondary">
              {new Date(date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: '2-digit',
              })}
            </Text>
          </Tooltip>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: isMobile ? false : 'right',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={() => openStockModal(record, 'add')}
          />
          <Button
            type="text"
            danger
            icon={<MinusOutlined />}
            disabled={record.quantity === 0}
            onClick={() => openStockModal(record, 'remove')}
          />
          <Button type="text" icon={<HistoryOutlined />} onClick={() => openHistoryModal(record)} />

          <PermissionGate api="edit|delete" module="products">
            <Dropdown overlay={moreMenu(record)} trigger={['click']}>
              <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
          </PermissionGate>
        </Space>
      ),
    },
  ];

  // ==================== RENDER ====================
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          background: '#f9fafb',
        }}
      >
        <Spin size="large" />
        <Text style={{ marginTop: 16 }} type="secondary">
          Loading inventory...
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <Card style={{ marginTop: 24, textAlign: 'center' }}>
        <Empty description="Failed to load inventory data" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <PageHeader
          title="Inventory"
          subtitle="Manage stock levels and update quantities"
          exportOptions={{ pdf: false, excel: false }}
        />

        {/* Filter Controls - Unchanged */}
        <Card
          bordered={false}
          style={{
            marginTop: 24,
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            background: 'white',
          }}
          bodyStyle={{ padding: isMobile ? '16px' : '24px' }}
        >
          <Row gutter={[12, 16]} align="middle">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search by name, code..."
                allowClear
                size="large"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </Col>

            <Col xs={24} sm={12} md={8} lg={5}>
              <Select
                aria-label="Filter inventory by duplicate company code"
                placeholder="Duplicate company codes"
                size="large"
                showSearch
                allowClear
                optionFilterProp="label"
                style={{ width: '100%' }}
                loading={loadingCompanyCodes}
                status={companyCodesError ? 'error' : undefined}
                value={companyCode}
                options={companyCodes.map((code) => ({
                  value: code,
                  label: code,
                }))}
                onChange={(value) => {
                  setCompanyCode(value);
                  setCurrentPage(1);
                }}
              />
              {companyCodesError && <Text type="danger">Unable to load company codes.</Text>}
            </Col>

            <Col xs={24} sm={12} md={8} lg={5}>
              <Select
                aria-label="Filter inventory by brand"
                placeholder="All brands"
                size="large"
                style={{ width: '100%' }}
                showSearch
                allowClear
                optionFilterProp="label"
                loading={loadingBrands}
                value={brandId}
                options={brands.map((brand) => ({
                  value: brand.id,
                  label: brand.brandName,
                }))}
                onChange={(value) => {
                  setBrandId(value);
                  setCurrentPage(1);
                }}
              />
            </Col>

            <Col xs={12} sm={6} md={5} lg={4}>
              <InputNumber
                placeholder="Low Stock ≤"
                min={1}
                size="large"
                style={{ width: '100%' }}
                value={lowStockThreshold}
                onChange={(v) => {
                  setLowStockThreshold(v || 10);
                  setCurrentPage(1);
                }}
              />
            </Col>

            <Col xs={12} sm={6} md={5} lg={4}>
              <InputNumber
                placeholder="Max Stock"
                min={0}
                size="large"
                style={{ width: '100%' }}
                value={maxStockFilter}
                onChange={(v) => {
                  setMaxStockFilter(v);
                  setCurrentPage(1);
                }}
              />
            </Col>

            <Col xs={24} sm={12} md={6} lg={5}>
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber
                  placeholder="Min ₹"
                  min={0}
                  style={{ flex: 1 }}
                  value={priceRange[0]}
                  onChange={(v) => {
                    setPriceRange([v, priceRange[1]]);
                    setCurrentPage(1);
                  }}
                />
                <InputNumber
                  placeholder="Max ₹"
                  min={0}
                  style={{ flex: 1 }}
                  value={priceRange[1]}
                  onChange={(v) => {
                    setPriceRange([priceRange[0], v]);
                    setCurrentPage(1);
                  }}
                />
              </Space.Compact>
            </Col>

            <Col xs={24} sm="auto" style={{ textAlign: isMobile ? 'center' : 'right' }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSearch('');
                  setBrandId(undefined);
                  setDuplicateCompanyCode(false);
                  setCompanyCode(undefined);
                  setPriceRange([null, null]);
                  setMaxStockFilter(null);
                  setLowStockThreshold(10);
                  setCurrentPage(1);
                }}
              >
                Reset Filters
              </Button>
            </Col>
          </Row>

          {/* Action Bar */}
          <div style={{ marginTop: 16, textAlign: isMobile ? 'center' : 'right' }}>
            <Space wrap size="middle">
              <Button
                icon={<FilterOutlined />}
                type={duplicateCompanyCode ? 'primary' : 'default'}
                onClick={() => setAdvancedFilterOpen(true)}
              >
                Advanced Filter{duplicateCompanyCode ? ' (1)' : ''}
              </Button>
              <Link to="/inventory/onboard-new-brand">
                <Button icon={<PlusOutlined />}>Onboard New Brand Workspace</Button>
              </Link>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/inventory/import?tab=inventory')}
              >
                Update Inventory
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/product/add')}
              >
                Add New Product
              </Button>
            </Space>
          </div>
        </Card>

        <InventoryBulkActions
          products={selectedInventoryProducts}
          clearSelection={() => setSelectedInventory({})}
          getCompanyCode={getCompanyCode}
          getSellingPrice={getSellingPrice}
          onComplete={(action) => {
            if (['delete', 'merge'].includes(action)) setCurrentPage(1);
            refetch();
          }}
        />

        {/* Status Chips */}
        <div style={{ margin: '24px 0' }}>
          <Space wrap size={[8, 12]}>
            {[
              { key: 'all', label: 'All', count: counts.all, color: 'default' },
              {
                key: 'in-stock',
                label: 'In Stock',
                count: counts.inStock,
                color: 'green',
              },
              {
                key: 'low-stock',
                label: 'Low Stock',
                count: counts.lowStock,
                color: 'orange',
              },
              {
                key: 'out-of-stock',
                label: 'Out of Stock',
                count: counts.outStock,
                color: 'red',
              },
            ].map((item) => (
              <Tag
                key={item.key}
                color={activeTab === item.key ? item.color : 'default'}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  cursor: 'pointer',
                  borderRadius: 20,
                  fontWeight: activeTab === item.key ? 600 : 400,
                }}
                onClick={() => handleTabChange(item.key)}
              >
                {item.label} ({item.count})
              </Tag>
            ))}
          </Space>
        </div>

        <Card
          bordered={false}
          style={{
            marginTop: 24,
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            background: 'white',
            overflow: 'hidden',
          }}
        >
          <Table
            columns={columns}
            dataSource={filteredProducts}
            rowKey="productId"
            rowSelection={{
              selectedRowKeys: Object.keys(selectedInventory),
              preserveSelectedRowKeys: true,
              onChange: (keys, rows) => {
                if (keys.length > 500) {
                  message.warning('Select at most 500 products at a time.');
                  return;
                }
                const known = {
                  ...selectedInventory,
                  ...Object.fromEntries(
                    rows.filter(Boolean).map((product) => [product.productId, product]),
                  ),
                };
                setSelectedInventory(
                  Object.fromEntries(
                    keys.filter((key) => known[key]).map((key) => [key, known[key]]),
                  ),
                );
              },
            }}
            pagination={false}
            loading={isFetching}
            scroll={{ x: isMobile ? 'max-content' : undefined }}
            rowClassName={(record) =>
              record.quantity === 0
                ? 'stock-critical'
                : record.quantity <= lowStockThreshold
                  ? 'stock-warning'
                  : 'stock-ok'
            }
          />
        </Card>

        <div style={{ marginTop: 24, padding: '16px 0', textAlign: 'center' }}>
          <Pagination
            disabled={isFetching}
            current={currentPage}
            pageSize={pageSize}
            total={paginationInfo.total}
            onChange={handlePageChange}
            showSizeChanger
            pageSizeOptions={['10', '25', '50', '100']}
            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} products`}
          />
        </div>

        {/* Modals */}
        <Drawer
          title="Advanced Filter"
          open={advancedFilterOpen}
          onClose={() => setAdvancedFilterOpen(false)}
          width={380}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Checkbox
              checked={duplicateCompanyCode}
              onChange={(e) => {
                setDuplicateCompanyCode(e.target.checked);
                setCurrentPage(1);
              }}
            >
              Only products with duplicate company codes
            </Checkbox>
            <Text type="secondary">
              Shows every product whose non-empty company code is shared by another product in the
              catalog.
            </Text>
          </Space>
        </Drawer>
        <StockModal
          open={stockModalOpen}
          onCancel={() => {
            setStockModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
          action={stockAction}
          onSubmit={handleStockSubmit}
        />

        <HistoryModalAntD
          open={historyModalOpen}
          onCancel={() => {
            setHistoryModalOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />

        <DeleteModal
          isVisible={deleteModalVisible}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteModalVisible(false);
            setSelectedProduct(null);
          }}
          item={selectedProduct}
          itemType="Product"
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
};

export default InventoryWrapper;
