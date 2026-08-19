import React, { useMemo, useState } from "react";
import {
  useGetProductCountQuery,
  useGetLowStockProductsQuery,
} from "../../api/productApi";
import { useGetAllQuotationsQuery } from "../../api/quotationApi";
import { useGetAllOrdersQuery } from "../../api/orderApi";
import { useGetCustomersQuery } from "../../api/customerApi";
import { useAuth } from "../../context/AuthContext";
import "./reportdashboard.css";

/* ============================================================
   HELPERS
   ============================================================ */

const currency = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const isSameDay = (dateStr, ref) => {
  const d = new Date(dateStr);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
};

const dayLabel = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short" });

const IN_PROGRESS_STATUSES = [
  "NEW",
  "CREATED",
  "IN_PRODUCTION",
  "PENDING",
  "PROCESSING",
];

const getAmount = (record) =>
  Number(
    record?.finalAmount ||
      record?.grandTotal ||
      record?.totalAmount ||
      record?.amount ||
      0,
  );

/** Returns start & end of day (local) for a Date */
const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

/** Check if a date string falls inside [from, to] inclusive */
const isInRange = (dateStr, from, to) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= from && d <= to;
};

/* ============================================================
   MAIN
   ============================================================ */

export default function ReportingDashboard() {
  const { auth } = useAuth();

  const role = (auth?.user?.role || auth?.role || auth?.user?.userType || "")
    .toString()
    .toUpperCase();

  /* ---- Global date filter state ---- */
  const [period, setPeriod] = useState("today"); // today | week | month | custom
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().slice(0, 10);
  });
  const [customTo, setCustomTo] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  /* ---- ALL APIs ---- */
  const {
    data: countData,
    isLoading: productCountLoading,
    refetch: refetchProductCount,
  } = useGetProductCountQuery();

  const {
    data: lowStockData,
    isLoading: lowStockLoading,
    refetch: refetchLowStock,
  } = useGetLowStockProductsQuery({
    threshold: 20,
    limit: 20,
  });

  const {
    data: ordersResponse,
    isLoading: ordersLoading,
    isFetching: ordersFetching,
    refetch: refetchOrders,
  } = useGetAllOrdersQuery({ limit: 500, page: 1 }, { pollingInterval: 30000 });

  const {
    data: quotationsResponse,
    isLoading: quotationsLoading,
    isFetching: quotationsFetching,
    refetch: refetchQuotations,
  } = useGetAllQuotationsQuery({ limit: 500, page: 1 });

  const {
    data: customersResponse,
    isLoading: customersLoading,
    refetch: refetchCustomers,
  } = useGetCustomersQuery({ limit: 1000 });

  const loading =
    productCountLoading ||
    lowStockLoading ||
    ordersLoading ||
    quotationsLoading ||
    customersLoading;

  const refreshing = ordersFetching || quotationsFetching;

  /* ---- Raw data ---- */
  const productCount = countData?.totalProducts || 0;
  const lowStockProducts = lowStockData?.products || [];
  const orders = ordersResponse?.data || [];
  const quotations = quotationsResponse?.data || [];
  const customers = customersResponse?.data || [];

  /* ---- Customer map ---- */
  const customerMap = useMemo(() => {
    return customers.reduce((map, customer) => {
      map[customer.customerId] = customer.name;
      return map;
    }, {});
  }, [customers]);

  const getCustomerName = (customerId, fallback) =>
    fallback || customerMap[customerId] || "—";

  const today = new Date();

  /* ---- Compute active date range from period ---- */
  const { rangeFrom, rangeTo, periodLabel } = useMemo(() => {
    const now = new Date();

    if (period === "today") {
      return {
        rangeFrom: startOfDay(now),
        rangeTo: endOfDay(now),
        periodLabel: "Today",
      };
    }

    if (period === "week") {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return {
        rangeFrom: startOfDay(from),
        rangeTo: endOfDay(now),
        periodLabel: "Last 7 days",
      };
    }

    if (period === "month") {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return {
        rangeFrom: startOfDay(from),
        rangeTo: endOfDay(now),
        periodLabel: "Last 30 days",
      };
    }

    // custom
    const from = customFrom
      ? startOfDay(new Date(customFrom))
      : startOfDay(now);
    const to = customTo ? endOfDay(new Date(customTo)) : endOfDay(now);
    return {
      rangeFrom: from,
      rangeTo: to,
      periodLabel: `${from.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })} – ${to.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`,
    };
  }, [period, customFrom, customTo]);

  /* ---- Filtered data for the selected period ---- */
  const filteredOrders = useMemo(
    () => orders.filter((o) => isInRange(o.createdAt, rangeFrom, rangeTo)),
    [orders, rangeFrom, rangeTo],
  );

  const filteredQuotations = useMemo(
    () => quotations.filter((q) => isInRange(q.createdAt, rangeFrom, rangeTo)),
    [quotations, rangeFrom, rangeTo],
  );

  const ordersInProgress = useMemo(
    () =>
      orders.filter((o) =>
        IN_PROGRESS_STATUSES.includes((o.status || "").toUpperCase()),
      ),
    [orders],
  );

  const orderAmountPeriod = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + getAmount(o), 0),
    [filteredOrders],
  );

  const quotationAmountPeriod = useMemo(
    () => filteredQuotations.reduce((sum, q) => sum + getAmount(q), 0),
    [filteredQuotations],
  );

  const criticalStock = useMemo(
    () => lowStockProducts.filter((p) => Number(p.quantity || 0) <= 5).length,
    [lowStockProducts],
  );

  /* ---- Chart: last 7 days relative to the end of the selected range ---- */
  const last7Days = useMemo(() => {
    const days = [];
    const end = new Date(rangeTo);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(end);
      d.setDate(d.getDate() - i);

      const dayOrders = orders.filter((o) => isSameDay(o.createdAt, d));
      const dayQuotes = quotations.filter((q) => isSameDay(q.createdAt, d));

      days.push({
        label: dayLabel(d.toISOString()),
        orderCount: dayOrders.length,
        quotationCount: dayQuotes.length,
      });
    }

    return days;
  }, [orders, quotations, rangeTo]);

  const maxChartValue = Math.max(
    1,
    ...last7Days.map((d) => Math.max(d.orderCount, d.quotationCount)),
  );

  const latestQuotations = useMemo(
    () =>
      [...filteredQuotations]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [filteredQuotations],
  );

  const latestOrders = useMemo(
    () =>
      [...filteredOrders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5),
    [filteredOrders],
  );

  const conversionRate =
    filteredQuotations.length > 0
      ? Math.round((filteredOrders.length / filteredQuotations.length) * 100)
      : 0;

  const handleRefresh = () => {
    refetchOrders();
    refetchQuotations();
    refetchCustomers();
    refetchProductCount();
    refetchLowStock();
  };

  /* ---- Render ---- */
  return (
    <div className="page-wrapper">
      <div className="rd-wrapper">
        <header className="rd-header">
          <div className="rd-header-info">
            <h1 className="rd-title">Sales dashboard</h1>

            <p className="rd-subtitle">
              {today.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="rd-header-actions">
            <div className="rd-filter-presets">
              {[
                { key: "today", label: "Today" },
                { key: "week", label: "Week" },
                { key: "month", label: "Month" },
                { key: "custom", label: "Custom" },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`rd-filter-btn${
                    period === p.key ? " rd-filter-btn-active" : ""
                  }`}
                  onClick={() => setPeriod(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {period === "custom" && (
              <div className="rd-filter-custom">
                <label className="rd-filter-date-label">
                  From
                  <input
                    type="date"
                    className="rd-filter-date"
                    value={customFrom}
                    max={customTo}
                    onChange={(e) => setCustomFrom(e.target.value)}
                  />
                </label>

                <label className="rd-filter-date-label">
                  To
                  <input
                    type="date"
                    className="rd-filter-date"
                    value={customTo}
                    min={customFrom}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                </label>
              </div>
            )}

            <span className="rd-filter-period-label">{periodLabel}</span>

            <button
              type="button"
              className="rd-refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <i
                className={`ti ti-refresh ${
                  refreshing ? "rd-refresh-spinning" : ""
                }`}
                aria-hidden="true"
              />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </header>
        {/* KPI row */}
        <section className="rd-metrics-grid">
          <MetricCard
            label={`Orders (${periodLabel})`}
            value={loading ? "—" : filteredOrders.length}
            delta={period === "today" ? "+8.2%" : periodLabel}
            deltaPositive={period === "today"}
            neutral={period !== "today"}
            icon="ti-shopping-cart"
          />
          <MetricCard
            label="Orders in progress"
            value={loading ? "—" : ordersInProgress.length}
            delta={`${ordersInProgress.length} active`}
            neutral
            icon="ti-progress"
          />
          <MetricCard
            label={`Quotations (${periodLabel})`}
            value={loading ? "—" : filteredQuotations.length}
            delta={period === "today" ? "+4.1%" : periodLabel}
            deltaPositive={period === "today"}
            neutral={period !== "today"}
            icon="ti-file-text"
          />
          <MetricCard
            label={`Order amount (${periodLabel})`}
            value={loading ? "—" : currency(orderAmountPeriod)}
            delta={period === "today" ? "+12.4%" : periodLabel}
            deltaPositive={period === "today"}
            neutral={period !== "today"}
            icon="ti-currency-rupee"
            accent
          />
        </section>

        <section className="rd-main-grid">
          <div className="rd-card rd-chart-card">
            <div className="rd-card-header">
              <div>
                <h2 className="rd-card-title">Orders vs quotations</h2>
                <p className="rd-card-subtitle">
                  Last 7 days ending{" "}
                  {rangeTo.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </div>
              <div className="rd-legend">
                <span className="rd-legend-item">
                  <span className="rd-dot rd-dot-order" /> Orders
                </span>
                <span className="rd-legend-item">
                  <span className="rd-dot rd-dot-quote" /> Quotations
                </span>
              </div>
            </div>

            <div className="rd-bar-chart">
              {last7Days.map((d, i) => (
                <div className="rd-bar-group" key={i}>
                  <div className="rd-bar-pair">
                    <div
                      className="rd-bar rd-bar-order"
                      style={{
                        height: `${(d.orderCount / maxChartValue) * 100}%`,
                      }}
                    >
                      <span className="rd-bar-tooltip">
                        Orders: {d.orderCount}
                      </span>
                    </div>

                    <div
                      className="rd-bar rd-bar-quote"
                      style={{
                        height: `${(d.quotationCount / maxChartValue) * 100}%`,
                      }}
                    >
                      <span className="rd-bar-tooltip">
                        Quotations: {d.quotationCount}
                      </span>
                    </div>
                  </div>

                  <span className="rd-bar-label">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rd-card rd-conversion-card">
            <div className="rd-card-header">
              <div>
                <h2 className="rd-card-title">Order Conversion Rate</h2>
                <p className="rd-card-subtitle">Conversion · {periodLabel}</p>
              </div>
            </div>
            <div className="rd-conversion-ring-wrap">
              <div
                className="rd-conversion-ring"
                style={{
                  background: `conic-gradient(#e31e24 ${
                    conversionRate * 3.6
                  }deg, #f1eeee ${conversionRate * 3.6}deg)`,
                }}
              >
                <div className="rd-conversion-ring-inner">
                  <span className="rd-conversion-value">{conversionRate}%</span>
                  <span className="rd-conversion-caption">converted</span>
                </div>
              </div>
            </div>
            <div className="rd-conversion-stats">
              <div>
                <span className="rd-conversion-stat-label">
                  Total quotations
                </span>

                <span className="rd-conversion-stat-value">
                  {loading ? "—" : filteredQuotations.length}
                </span>
              </div>

              <div>
                <span className="rd-conversion-stat-label">Total orders</span>

                <span className="rd-conversion-stat-value">
                  {loading ? "—" : filteredOrders.length}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="rd-list-grid">
          <div className="rd-card">
            <div className="rd-card-header">
              <h2 className="rd-card-title">
                Latest quotations · {periodLabel}
              </h2>
              <a href="/quotations/list" className="rd-view-all">
                View all <i className="ti ti-arrow-right" aria-hidden="true" />
              </a>
            </div>
            <RecordList
              loading={loading}
              emptyText="No quotations in this period."
              items={latestQuotations.map((q) => ({
                id: q.quotationId,
                title: getCustomerName(
                  q.customerId || q.customer?.customerId,
                  q.customer?.name || q.customerName,
                ),
                subtitle: q.reference_number,
                amount: getAmount(q),
                date: q.createdAt,
                badge: "quotation",
                href: `/quotation/${q.quotationId}`,
              }))}
            />
          </div>

          <div className="rd-card">
            <div className="rd-card-header">
              <h2 className="rd-card-title">Latest orders · {periodLabel}</h2>
              <a href="/orders/list" className="rd-view-all">
                View all <i className="ti ti-arrow-right" aria-hidden="true" />
              </a>
            </div>
            <RecordList
              loading={loading}
              emptyText="No orders in this period."
              items={latestOrders.map((o) => ({
                id: o.id,
                title: getCustomerName(
                  o.customerId || o.customer?.customerId,
                  o.customer?.name,
                ),
                subtitle: o.orderNo,
                amount: getAmount(o),
                date: o.createdAt,
                badge: (o.status || "new").toLowerCase(),
                href: `/order/${o.id}`,
              }))}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ============================================================
   SUB COMPONENTS
   ============================================================ */

function MetricCard({
  label,
  value,
  delta,
  deltaPositive,
  neutral,
  icon,
  accent,
}) {
  return (
    <div className={`rd-metric-card${accent ? " rd-metric-card-accent" : ""}`}>
      <div className="rd-metric-top">
        <span className="rd-metric-icon">
          <i className={`ti ${icon}`} aria-hidden="true" />
        </span>
        {delta && (
          <span
            className={`rd-metric-delta${
              neutral
                ? " rd-metric-delta-neutral"
                : deltaPositive
                  ? " rd-metric-delta-up"
                  : " rd-metric-delta-down"
            }`}
          >
            {delta}
          </span>
        )}
      </div>
      <p className="rd-metric-value">{value}</p>
      <p className="rd-metric-label">{label}</p>
    </div>
  );
}

function RecordList({ items, loading, emptyText }) {
  if (loading) {
    return (
      <div className="rd-list">
        {[1, 2, 3].map((i) => (
          <div className="rd-list-row rd-list-row-skeleton" key={i} />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return <p className="rd-empty">{emptyText}</p>;
  }

  return (
    <div className="rd-list">
      {items.map((item) => (
        <div className="rd-list-row" key={item.id}>
          <div className="rd-list-avatar">
            {(item.title || "?").charAt(0).toUpperCase()}
          </div>
          <div className="rd-list-main">
            {item.href ? (
              <a href={item.href} className="rd-list-title">
                {item.title}
              </a>
            ) : (
              <p className="rd-list-title">{item.title}</p>
            )}
            <p className="rd-list-subtitle">{item.subtitle}</p>
          </div>
          <span className={`rd-status-badge rd-status-${item.badge}`}>
            {item.badge.replace(/_/g, " ")}
          </span>
          <div className="rd-list-amount-wrap">
            <p className="rd-list-amount">{currency(item.amount)}</p>
            <p className="rd-list-date">
              {new Date(item.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
