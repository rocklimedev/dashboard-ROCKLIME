import React, { useMemo, useState } from "react";
import { useGetDashboardSummaryQuery } from "../../api/dashboardApi";
import {
  FiShoppingCart,
  FiClock,
  FiFileText,
  FiRefreshCw,
  FiArrowRight,
} from "react-icons/fi";
import { FaRupeeSign } from "react-icons/fa";

// The Tabler icon font is not bundled, so KPI icons use react-icons.
const METRIC_ICONS = {
  "ti-shopping-cart": FiShoppingCart,
  "ti-progress": FiClock,
  "ti-file-text": FiFileText,
  "ti-currency-rupee": FaRupeeSign,
};
import "./reportdashboard.css";

/* ============================================================
   HELPERS
   ============================================================ */

const currency = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const dayLabel = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-IN", { weekday: "short" });

const getAmount = (record) =>
  Number(record?.finalAmount || record?.grandTotal || record?.totalAmount || 0);

/** "+8.2%" style label for a change against the previous period */
const changeLabel = (pct) =>
  pct === null || pct === undefined ? "new" : `${pct > 0 ? "+" : ""}${pct}%`;

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

/* ============================================================
   MAIN
   ============================================================ */

export default function ReportingDashboard() {


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

  /* ---- One server call for every number on this page ---- */
  const {
    data: summary,
    isLoading: loading,
    isFetching: refreshing,
    refetch,
  } = useGetDashboardSummaryQuery(
    { from: rangeFrom.toISOString(), to: rangeTo.toISOString() },
    { pollingInterval: 60000 },
  );

  const ordersCount = summary?.orders?.count ?? 0;
  const quotationsCount = summary?.quotations?.count ?? 0;
  const ordersInProgress = summary?.orders?.inProgress ?? 0;
  const orderAmountPeriod = summary?.orders?.amount ?? 0;
  const conversionRate = summary?.conversionRate ?? 0;

  const last7Days = (summary?.daily || []).map((d) => ({
    label: dayLabel(d.date),
    orderCount: d.orders,
    quotationCount: d.quotations,
  }));

  const maxChartValue = Math.max(
    1,
    ...last7Days.map((d) => Math.max(d.orderCount, d.quotationCount)),
  );

  const latestQuotations = summary?.latestQuotations || [];
  const latestOrders = summary?.latestOrders || [];
  const getCustomerName = (_id, name) => name || "—";

  const handleRefresh = () => refetch();

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
              <FiRefreshCw className={refreshing ? "rd-refresh-spinning" : ""} aria-hidden="true" />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </header>
        {/* What needs doing today */}
        {/* KPI row */}
        <section className="rd-metrics-grid">
          <MetricCard
            label={`Orders (${periodLabel})`}
            value={loading ? "—" : ordersCount}
            delta={`${changeLabel(summary?.orders?.change)} vs previous`}
            deltaPositive={(summary?.orders?.change ?? 0) >= 0}
            neutral={summary?.orders?.change == null}
            icon="ti-shopping-cart"
          />
          <MetricCard
            label="Orders in progress"
            value={loading ? "—" : ordersInProgress}
            delta="not yet dispatched"
            neutral
            icon="ti-progress"
          />
          <MetricCard
            label={`Quotations (${periodLabel})`}
            value={loading ? "—" : quotationsCount}
            delta={`${changeLabel(summary?.quotations?.change)} vs previous`}
            deltaPositive={(summary?.quotations?.change ?? 0) >= 0}
            neutral={summary?.quotations?.change == null}
            icon="ti-file-text"
          />
          <MetricCard
            label={`Order amount (${periodLabel})`}
            value={loading ? "—" : currency(orderAmountPeriod)}
            delta={`${changeLabel(summary?.orders?.amountChange)} vs previous`}
            deltaPositive={(summary?.orders?.amountChange ?? 0) >= 0}
            neutral={summary?.orders?.amountChange == null}
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
                  {loading ? "—" : quotationsCount}
                </span>
              </div>

              <div>
                <span className="rd-conversion-stat-label">Converted to orders</span>

                <span className="rd-conversion-stat-value">
                  {loading ? "—" : summary?.quotations?.converted ?? 0}
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
                View all <FiArrowRight aria-hidden="true" />
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
                View all <FiArrowRight aria-hidden="true" />
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
          {(() => {
            const Icon = METRIC_ICONS[icon];
            return Icon ? <Icon aria-hidden="true" /> : null;
          })()}
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
