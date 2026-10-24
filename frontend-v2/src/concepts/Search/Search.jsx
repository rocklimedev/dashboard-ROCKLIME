import Loader from '../../components/Common/Loader';
import './Search.styles.css';
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Empty, Avatar, Space, Tag, Row, Col, Typography, Result, Pagination, Button } from 'antd';
import { toast } from 'sonner';
import {
  ReloadOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  TagsOutlined,
  ShopOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

// API Hooks
import { useSearchAllQuery } from '../../api/searchApi';
import { useAddProductToCartMutation } from '../../api/cartApi';
import { useGetProfileQuery } from '../../api/userApi';
import { searchProductSummary } from '../../utils/searchProductSummary';

const { Title, Text, Paragraph } = Typography;

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryFromUrl = searchParams.get('q') || '';

  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);

  // ==================== CART FUNCTIONALITY ====================
  const { data: user } = useGetProfileQuery();
  const userId = user?.user?.userId;
  const [addToCart, { isLoading: isCartLoadingGlobal }] = useAddProductToCartMutation();
  const [cartLoadingStates, setCartLoadingStates] = useState({});

  // Fetch results based on URL query parameter
  const {
    data: searchResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useSearchAllQuery(
    {
      query: queryFromUrl.trim(),
      page: currentPage,
      limit: 20,
    },
    { skip: !queryFromUrl.trim() },
  );

  const results = searchResponse?.data || {};
  const meta = searchResponse?.meta || {};

  const resultGroups = useMemo(() => {
    return Object.entries(results).filter(([_, group]) => group?.items?.length > 0);
  }, [results]);

  const hasResults = resultGroups.length > 0;

  const handlePageChange = (page) => {
    setCurrentPage(page);

    setSearchParams({
      q: queryFromUrl,
      page: page.toString(),
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add to Cart Handler
  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      return toast.error('Please login first');
    }
    if (!product?.productId) {
      return toast.error('Invalid product');
    }

    const productKey = product.productId;
    setCartLoadingStates((prev) => ({ ...prev, [productKey]: true }));

    try {
      await addToCart({
        userId,
        productId: product.productId,
        quantity: 1,
      }).unwrap();

      toast.success(`Added ${product.name || 'product'} to cart successfully!`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add to cart');
    } finally {
      setCartLoadingStates((prev) => ({ ...prev, [productKey]: false }));
    }
  };

  const highlight = (text, term) => {
    if (!term?.trim() || typeof text !== 'string') return text || '';
    try {
      const regex = new RegExp(`(${term.trim()})`, 'gi');
      return text.split(regex).map((part, i) =>
        regex.test(part) ? (
          <mark className="fv2-search-9dd1d76fdd" key={i}>
            {part}
          </mark>
        ) : (
          part
        ),
      );
    } catch {
      return text;
    }
  };

  // ... (getIcon, getSubtitle, getLinkProps functions remain unchanged)

  const getIcon = (modelName, item) => {
    const commonProps = { size: 48 };

    switch (modelName.toLowerCase()) {
      case 'user':
      case 'customer':
        return item.photo_thumbnail || item.photo ? (
          <Avatar src={item.photo_thumbnail || item.photo} {...commonProps} />
        ) : (
          <Avatar icon={<UserOutlined />} {...commonProps} />
        );

      case 'product': {
        let productImage = null;
        if (Array.isArray(item.images) && item.images.length > 0) {
          productImage = item.images[0];
        } else if (typeof item.images === 'string' && item.images.trim()) {
          try {
            const parsed = JSON.parse(item.images);
            productImage = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
          } catch {}
        }

        return productImage ? (
          <Avatar
            src={productImage}
            shape="square"
            {...commonProps}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <Avatar shape="square" icon={<ShoppingCartOutlined />} {...commonProps} />
        );
      }

      case 'purchaseorder':
        return (
          <Avatar
            icon={<FileTextOutlined />}
            {...commonProps}
            style={{ backgroundColor: '#722ed1' }}
          />
        );

      case 'order':
      case 'invoice':
      case 'quotation':
        return <Avatar icon={<FileTextOutlined />} {...commonProps} />;

      case 'brand':
        return <Avatar icon={<ShopOutlined />} {...commonProps} />;

      case 'category':
        return <Avatar icon={<TagsOutlined />} {...commonProps} />;

      case 'vendor':
      case 'team':
      case 'company':
        return <Avatar icon={<TeamOutlined />} {...commonProps} />;

      default:
        return <Avatar icon={<SearchOutlined />} {...commonProps} />;
    }
  };
  useEffect(() => {
    const pageFromUrl = Number(searchParams.get('page')) || 1;
    setCurrentPage(pageFromUrl);
  }, [searchParams]);
  const getSubtitle = (model, item) => {
    switch (model.toLowerCase()) {
      case 'user':
      case 'customer':
        return item.email || item.mobileNumber || null;
      case 'product':
        return searchProductSummary(item);
      case 'order':
        return item.status ? `Status: ${item.status}` : null;
      case 'quotation':
        return item.reference_number || (item.finalAmount && `₹${item.finalAmount}`);
      case 'purchaseorder':
        return item.status
          ? `Status: ${item.status}`
          : item.totalAmount
            ? `₹${item.totalAmount}`
            : null;
      case 'category':
        return item.parentCategoryId ? 'Sub Category' : 'Main Category';
      default:
        return null;
    }
  };

  const getLinkProps = (model, item) => {
    const map = {
      user: {
        to: `/u/${item.userId || item.id}`,
        title: item.name || item.username || 'User',
      },
      customer: {
        to: `/customer/${item.customerId || item.id}`,
        title: item.name || 'Customer',
      },
      product: {
        to: `/product/${item.productId || item.id}`,
        title: item.name || 'Product',
      },
      order: {
        to: `/order/${item.id || item.orderId}`,
        title: `Order #${item.orderNo || item.id}`,
      },
      quotation: {
        to: `/quotation/${item.quotationId || item.id}`,
        title: item.document_title || `Quotation #${item.reference_number}`,
      },
      brand: { to: `/store/${item.id}`, title: item.brandName || 'Brand' },
      category: {
        to: `/inventory/categories-keywords?category=${item.categoryId || item.id}`,
        title: item.name || 'Category',
      },
      vendor: {
        to: `/vendors/${item.id || item.vendorId}`,
        title: item.vendorName || 'Vendor',
      },
      purchaseorder: {
        to: `/purchase-order/${item.id || item.poNumber}`,
        title: `PO #${item.poNumber}`,
      },
    };

    const key = model.toLowerCase();
    return map[key] || { to: '#', title: 'Item' };
  };

  if (!queryFromUrl.trim()) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Empty
            className="fv2-search-2db79a69ee"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="fv2-search-ee2a5b7533">
                <Paragraph strong>No search query provided</Paragraph>
                <Text type="secondary">Use the search bar in the header to search the system</Text>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <Card className="fv2-search-6c3f70e18b">
          <Space align="center">
            <Title className="fv2-search-3469124879" level={4}>
              Search Results for "{queryFromUrl}"
            </Title>
            <Button icon={<ReloadOutlined />} onClick={refetch} loading={isFetching}>
              Refresh
            </Button>
          </Space>
        </Card>

        {isError ? (
          <Result
            status="error"
            title="Search Failed"
            subTitle="Something went wrong while fetching results."
            extra={
              <Button type="primary" icon={<ReloadOutlined />} onClick={refetch}>
                Retry Search
              </Button>
            }
          />
        ) : isLoading || isFetching ? (
          <div className="fv2-search-e3c8d5ffea">
            <Loader size="large" tip="Searching across all modules..." />
          </div>
        ) : hasResults ? (
          <>
            {resultGroups.map(([modelName, group]) => {
              const { items, total } = group;

              return (
                <section className="fv2-search-66b909c2e2" key={modelName}>
                  <Space className="fv2-search-42f4373cd4" align="center">
                    <Title className="fv2-search-191b72d501" level={5}>
                      {modelName}s
                    </Title>
                    <Tag className="fv2-search-5dbe98b1ad" color="geekblue">
                      {total} found
                    </Tag>
                  </Space>

                  <Row gutter={[16, 24]}>
                    {items.map((item) => {
                      const { to, title } = getLinkProps(modelName, item);
                      const subtitle = getSubtitle(modelName, item);
                      const isProduct = modelName.toLowerCase() === 'product';
                      const isAdding = cartLoadingStates[item.productId];

                      return (
                        <Col
                          xs={24}
                          sm={12}
                          lg={8}
                          xl={6}
                          key={item.id || item.userId || item.productId || Math.random()}
                        >
                          <Card
                            className="fv2-search-5a2426b393"
                            hoverable
                            bodyStyle={{ padding: 16 }}
                          >
                            <Space className="fv2-search-2862e5291a" align="start" size={16}>
                              {getIcon(modelName, item)}

                              <div className="fv2-search-091080602a">
                                <Title className="fv2-search-6f35857011" level={5}>
                                  <Link className="fv2-search-b12fd4d564" to={to}>
                                    {highlight(title, queryFromUrl)}
                                  </Link>
                                </Title>

                                {subtitle && (
                                  <Text className="fv2-search-173a08445a" type="secondary">
                                    {highlight(subtitle, queryFromUrl)}
                                  </Text>
                                )}

                                {/* Add to Cart Button for Products */}
                                {isProduct && (
                                  <Button
                                    className="fv2-search-f98e67cf0e"
                                    type="primary"
                                    icon={<ShoppingCartOutlined />}
                                    loading={isAdding}
                                    disabled={isCartLoadingGlobal}
                                    onClick={(e) => handleAddToCart(e, item)}
                                  >
                                    Add to Cart
                                  </Button>
                                )}
                              </div>
                            </Space>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </section>
              );
            })}

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="fv2-search-2ec4227414">
                <Pagination
                  current={currentPage}
                  total={meta.totalResults || 0}
                  pageSize={20}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total) => `Total ${total} results`}
                />
              </div>
            )}
          </>
        ) : (
          <Empty
            className="fv2-search-ae01e6e45b"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="fv2-search-ee2a5b7533">
                <Paragraph strong>No results found for "{queryFromUrl}"</Paragraph>
                <Text type="secondary">Try different keywords or check your spelling</Text>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
};

export default SearchPage;
