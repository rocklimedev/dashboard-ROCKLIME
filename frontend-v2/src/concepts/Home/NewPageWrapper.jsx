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
import { useGetDashboardSummaryQuery } from "../../api/dashboardApi";
import { useAuth } from "../../context/AuthContext";
import { FaShoppingBag } from "react-icons/fa";
import { HiDocumentText } from "react-icons/hi";
import { MdWarningAmber } from "react-icons/md";
import "./pagewrapper.css";

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

const NewDashboard = () => {
  const [range, setRange] = useState(30);
  const { auth } = useAuth();

  const role = (auth?.user?.role || auth?.role || auth?.user?.userType || "")
    .toString()
    .toUpperCase();

  // Every number comes from one server-side summary for the chosen range.
  const { fromIso, toIso } = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (range - 1));
    from.setHours(0, 0, 0, 0);
    return { fromIso: from.toISOString(), toIso: to.toISOString() };
  }, [range]);

  const { data: summary, isLoading: loading } = useGetDashboardSummaryQuery(
    { from: fromIso, to: toIso, days: range, latest: 7 },
    { pollingInterval: 60000 },
  );

  const getCustomerName = () => "Unknown";

  const reportSummary = {
    totalOrders: summary?.orders?.count ?? 0,
    totalQuotations: summary?.quotations?.count ?? 0,
    quotationValue: summary?.quotations?.amount ?? 0,
    conversionRate: summary?.conversionRate ?? 0,
    lowStockCount: summary?.lowStock?.count ?? 0,
    criticalStock: summary?.lowStock?.count ?? 0,
  };

  const timelineData = (summary?.daily || []).map((d) => ({
    key: d.date,
    date: formatDate(d.date),
    orders: d.orders,
    quotations: d.quotations,
  }));

  const statusData = (summary?.statusBreakdown || []).map((r) => ({
    status: normaliseStatus(r.status || "UNKNOWN"),
    count: r.count,
  }));

  const lowStockChartData = (summary?.lowStockItems || []).map((p) => ({
    name: p.name,
    quantity: Number(p.quantity || 0),
  }));

  const customerAnalytics = (summary?.topCustomers || []).map((c) => ({
    customerId: c.customerId,
    name: c.name,
    orders: c.orders,
    quotations: c.quotations,
    quoteValue: c.quoteValue,
  }));

  const latestOrders = summary?.latestOrders || [];
  const latestQuotations = summary?.latestQuotations || [];

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
                  helper={`${reportSummary.totalOrders} in selected range`}
                  icon={<FaShoppingBag />}
                />

                <ReportMetricCard
                  title="Total Quotations"
                  value={reportSummary.totalQuotations}
                  helper={`${reportSummary.totalQuotations} in selected range`}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function ReportMetricCard({ title, value, helper, icon }) {
  return (
    <Card className="report-metric-card" bordered={false}>
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
    <Card className={`report-chart-card ${className || ""}`} bordered={false}>
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
export default NewDashboard;
