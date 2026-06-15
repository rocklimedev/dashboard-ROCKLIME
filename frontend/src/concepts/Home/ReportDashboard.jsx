import React, { useMemo, useState } from "react";
import { Card, Empty, Select, Spin, Tag } from "antd";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useGetProductCountQuery,
  useGetLowStockProductsQuery,
} from "../../api/productApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useAuth } from "../../context/AuthContext";
import { FaShoppingBag } from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi";
import { MdWarningAmber } from "react-icons/md";
import "./reportdashboard.css";

const BRAND_RED = "#e31e24";
const TEXT_DARK = "#303030";
const SOFT_GREY = "#f6f6f6";

const CHART_COLORS = [
  "#e31e24",
  "#303030",
  "#777777",
  "#a8a8a8",
  "#d8d8d8",
  "#111111",
  "#c2410c",
  "#57534e",
  "#9ca3af",
];

const DATE_RANGE_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
];

const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });

const formatFullDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const getDateKey = (date) => new Date(date).toISOString().slice(0, 10);

const normaliseStatus = (status = "UNKNOWN") => status.split("_").join(" ");

const getAmount = (record) =>
  Number(
    record?.finalAmount ||
      record?.grandTotal ||
      record?.totalAmount ||
      record?.amount ||
      0,
  );

const buildDateBuckets = (days) => {
  const buckets = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);

    buckets.push({
      key: getDateKey(d),
      date: formatDate(d),
      orders: 0,
      quotations: 0,
      quoteValue: 0,
    });
  }

  return buckets;
};

const ReportDashboard = () => {
  const [range, setRange] = useState(30);
  const { auth } = useAuth();

  const role = (auth?.user?.role || auth?.role || auth?.user?.userType || "")
    .toString()
    .toUpperCase();

  const isRestrictedRole =
    role && !["ADMIN", "SUPER_ADMIN", "DEVELOPER"].includes(role);

  const { data: countData, isLoading: productCountLoading } =
    useGetProductCountQuery();

  const { data: lowStockData, isLoading: lowStockLoading } =
    useGetLowStockProductsQuery({
      threshold: 20,
      limit: 20,
    });

  const { data: ordersResponse, isLoading: ordersLoading } =
    useGetAllOrdersQuery({ limit: 500, page: 1 }, { pollingInterval: 30000 });

  const { data: quotationsResponse, isLoading: quotationsLoading } =
    useGetAllQuotationsQuery({
      limit: 500,
      page: 1,
    });

  const { data: customersResponse, isLoading: customersLoading } =
    useGetCustomersQuery({ limit: 1000 });

  const loading =
    productCountLoading ||
    lowStockLoading ||
    ordersLoading ||
    quotationsLoading ||
    customersLoading;

  const productCount = countData?.totalProducts || 0;
  const lowStockProducts = lowStockData?.products || [];
  const orders = ordersResponse?.data || [];
  const quotations = quotationsResponse?.data || [];
  const customers = customersResponse?.data || [];

  const customerMap = useMemo(() => {
    return customers.reduce((map, customer) => {
      map[customer.customerId] = customer.name;
      return map;
    }, {});
  }, [customers]);

  const getCustomerName = (customerId) => customerMap[customerId] || "Unknown";

  const filteredData = useMemo(() => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - range);
    startDate.setHours(0, 0, 0, 0);

    const filteredOrders = orders.filter(
      (order) => new Date(order.createdAt) >= startDate,
    );

    const filteredQuotations = quotations.filter(
      (quotation) => new Date(quotation.createdAt) >= startDate,
    );

    return { filteredOrders, filteredQuotations };
  }, [orders, quotations, range]);

  const reportSummary = useMemo(() => {
    const quotationValue = filteredData.filteredQuotations.reduce(
      (sum, quotation) => sum + getAmount(quotation),
      0,
    );

    const conversionRate = quotations.length
      ? Math.round((orders.length / quotations.length) * 100)
      : 0;

    const criticalStock = lowStockProducts.filter(
      (product) => Number(product.quantity || 0) <= 5,
    ).length;

    return {
      totalOrders: ordersResponse?.pagination?.total || orders.length,
      totalQuotations:
        quotationsResponse?.pagination?.total || quotations.length,
      productCount,
      lowStockCount: lowStockProducts.length,
      quotationValue,
      conversionRate,
      criticalStock,
    };
  }, [
    filteredData.filteredQuotations,
    lowStockProducts,
    orders,
    ordersResponse,
    productCount,
    quotations,
    quotationsResponse,
  ]);

  const timelineData = useMemo(() => {
    const buckets = buildDateBuckets(range);
    const bucketMap = buckets.reduce((map, bucket) => {
      map[bucket.key] = bucket;
      return map;
    }, {});

    filteredData.filteredOrders.forEach((order) => {
      const key = getDateKey(order.createdAt);
      if (bucketMap[key]) bucketMap[key].orders += 1;
    });

    filteredData.filteredQuotations.forEach((quotation) => {
      const key = getDateKey(quotation.createdAt);
      if (bucketMap[key]) {
        bucketMap[key].quotations += 1;
        bucketMap[key].quoteValue += getAmount(quotation);
      }
    });

    return buckets;
  }, [filteredData, range]);

  const statusData = useMemo(() => {
    const statusMap = filteredData.filteredOrders.reduce((map, order) => {
      const key = normaliseStatus(order.status || "UNKNOWN");
      map[key] = (map[key] || 0) + 1;
      return map;
    }, {});

    return Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
    }));
  }, [filteredData.filteredOrders]);

  const lowStockChartData = useMemo(() => {
    return [...lowStockProducts]
      .sort((a, b) => Number(a.quantity || 0) - Number(b.quantity || 0))
      .slice(0, 8)
      .map((product) => ({
        name: product.name,
        quantity: Number(product.quantity || 0),
      }));
  }, [lowStockProducts]);

  const customerAnalytics = useMemo(() => {
    const summary = {};

    const ensureCustomer = (customerId) => {
      if (!summary[customerId]) {
        summary[customerId] = {
          customerId,
          name: getCustomerName(customerId),
          orders: 0,
          quotations: 0,
          quoteValue: 0,
        };
      }
      return summary[customerId];
    };

    filteredData.filteredOrders.forEach((order) => {
      const customer = ensureCustomer(
        order.customerId || order.customer?.customerId,
      );
      customer.orders += 1;
    });

    filteredData.filteredQuotations.forEach((quotation) => {
      const customer = ensureCustomer(
        quotation.customerId || quotation.customer?.customerId,
      );
      customer.quotations += 1;
      customer.quoteValue += getAmount(quotation);
    });

    return Object.values(summary)
      .sort((a, b) => b.quoteValue + b.orders - (a.quoteValue + a.orders))
      .slice(0, 7);
  }, [filteredData, getCustomerName]);

  const latestOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 7);
  }, [orders]);

  const latestQuotations = useMemo(() => {
    return [...quotations]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 7);
  }, [quotations]);

  if (isRestrictedRole) {
    return (
      <div className="report-page-wrapper">
        <Empty description="This report dashboard is available only for Admin and Super Admin users." />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="report-page-wrapper">
          {loading ? (
            <div className="report-loading">
              <Spin size="large" />
            </div>
          ) : (
            <>
              <div className="report-kpi-grid">
                <ReportMetricCard
                  title="Total Orders"
                  value={reportSummary.totalOrders}
                  helper={`${filteredData.filteredOrders.length} in selected range`}
                  icon={<FaShoppingBag />}
                />

                <ReportMetricCard
                  title="Total Quotations"
                  value={reportSummary.totalQuotations}
                  helper={`${filteredData.filteredQuotations.length} in selected range`}
                  icon={<HiDocumentText />}
                />

                <ReportMetricCard
                  title="Critical Stock"
                  value={reportSummary.criticalStock}
                  helper="Products with quantity 5 or below"
                  icon={<MdWarningAmber />}
                />
              </div>
              <div className="report-grid report-grid-lists">
                <ReportListCard title="Latest Orders">
                  {latestOrders.length ? (
                    latestOrders.map((order) => (
                      <div className="report-list-item" key={order.id}>
                        <div>
                          <a
                            href={`/order/${order.id}`}
                            className="report-link"
                          >
                            #{order.orderNo || order.id}
                          </a>
                          <p>
                            {order.customer?.name ||
                              getCustomerName(order.customerId)}
                          </p>
                        </div>
                        <div className="report-list-right">
                          <Tag color="red">{normaliseStatus(order.status)}</Tag>
                          <span>{formatFullDate(order.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <Empty description="No orders found" />
                  )}
                </ReportListCard>

                <ReportListCard title="Latest Quotations">
                  {latestQuotations.length ? (
                    latestQuotations.map((quotation) => (
                      <div
                        className="report-list-item"
                        key={quotation.quotationId}
                      >
                        <div>
                          <a
                            href={`/quotation/${quotation.quotationId}`}
                            className="report-link"
                          >
                            {quotation.reference_number || "Quotation"}
                          </a>
                          <p>
                            {quotation.customer?.name ||
                              getCustomerName(quotation.customerId)}
                          </p>
                        </div>
                        <div className="report-list-right">
                          <strong>
                            {formatCurrency(getAmount(quotation))}
                          </strong>
                          <span>{formatFullDate(quotation.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <Empty description="No quotations found" />
                  )}
                </ReportListCard>
              </div>
              <div className="report-grid report-grid-main">
                <ReportChartCard
                  title="Orders & Quotations"
                  description={`Daily comparison for the last ${range} days`}
                  extra={
                    <Select
                      value={range}
                      options={DATE_RANGE_OPTIONS}
                      onChange={setRange}
                      className="report-chart-select"
                    />
                  }
                >
                  <ResponsiveContainer width="100%" height={330}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" minTickGap={24} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="orders"
                        name="Orders"
                        stroke={BRAND_RED}
                        strokeWidth={3}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="quotations"
                        name="Quotations"
                        stroke={TEXT_DARK}
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ReportChartCard>
              </div>
              {/* <div className="report-grid report-grid-secondary">
                <ReportChartCard
                  title="Quotation Value Trend"
                  description="Daily value created through quotations"
                >
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timelineData}>
                      <defs>
                        <linearGradient
                          id="quoteValueFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor={BRAND_RED}
                            stopOpacity={0.22}
                          />
                          <stop
                            offset="95%"
                            stopColor={BRAND_RED}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" minTickGap={24} />
                      <YAxis
                        tickFormatter={(value) => `₹${Number(value) / 1000}k`}
                      />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Area
                        type="monotone"
                        dataKey="quoteValue"
                        name="Quotation Value"
                        stroke={BRAND_RED}
                        strokeWidth={3}
                        fill="url(#quoteValueFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ReportChartCard>

                <ReportChartCard
                  title="Low Stock Products"
                  description="Lowest quantity products requiring attention"
                >
                  {lowStockChartData.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={lowStockChartData} layout="vertical">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                        />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={130}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="quantity"
                          name="Quantity"
                          fill={BRAND_RED}
                          radius={[0, 8, 8, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Empty description="No low stock products" />
                  )}
                </ReportChartCard>

                <ReportChartCard
                  title="Top Customers"
                  description="Customers ranked by quotation value"
                >
                  {customerAnalytics.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={customerAnalytics}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11 }}
                          interval={0}
                        />
                        <YAxis
                          tickFormatter={(value) => `₹${Number(value) / 1000}k`}
                        />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Bar
                          dataKey="quoteValue"
                          name="Quotation Value"
                          fill={TEXT_DARK}
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Empty description="No customer analytics yet" />
                  )}
                </ReportChartCard>
              </div> */}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function ReportMetricCard({ title, value, helper, icon }) {
  return (
    <Card className="report-metric-card">
      <div className="report-metric-top">
        <div className="report-metric-icon">{icon}</div>
      </div>

      <h3>{value}</h3>
      <p>{title}</p>
      <small>{helper}</small>
    </Card>
  );
}

function ReportChartCard({ title, description, extra, children, className }) {
  return (
    <Card className={`report-chart-card ${className || ""}`}>
      <div className="report-card-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        {extra}
      </div>

      {children}
    </Card>
  );
}

const ReportListCard = ({ title, children }) => {
  return (
    <Card className="report-list-card" bordered={false}>
      <div className="report-card-heading">
        <h2>{title}</h2>
      </div>
      <div className="report-list-wrap">{children}</div>
    </Card>
  );
};

export default ReportDashboard;
