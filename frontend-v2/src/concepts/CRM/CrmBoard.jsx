import './CrmBoard.styles.css';
import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Empty, Input, Segmented, Select, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { toast } from 'sonner';
import {
  PlusOutlined,
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  CloudSyncOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  WarningOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import dayjs from 'dayjs';
import {
  useBiginSyncMutation,
  useGetCrmBoardQuery,
  useGetCrmDealsQuery,
  useGetCrmMetaQuery,
  useMoveDealMutation,
} from '../../api/crmApi';
import useCan from '../../utils/useCan';
import DealDrawer, { BiginBadge, LostReasonModal } from './DealDrawer';
import DealFormModal from './DealFormModal';
import { TAG_COLOR, dueText, isLate, lakh } from './crmUtils';
import './crm.css';

const { Title, Text } = Typography;
const FILTER_KEYS = [
  'q',
  'owner',
  'source',
  'tag',
  'customerType',
  'closing',
  'followUp',
  'bigin',
  'sort',
];

function CardBody({ deal, onOpen, dragging, ...rest }) {
  const next = deal.nextTask;
  return (
    <div
      className={`crm-card ${dragging ? 'is-dragging' : ''} ${deal.stuck ? 'is-stuck' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(deal.id)}
      onKeyDown={(e) => e.key === 'Enter' && onOpen?.(deal.id)}
      {...rest}
    >
      <div className="crm-card__top">
        <span className="crm-card__title">{deal.title}</span>
        {deal.tag && (
          <Tag className="fv2-crmboard-a8eb4b00d7" color={TAG_COLOR[deal.tag]} bordered={false}>
            {deal.tag}
          </Tag>
        )}
      </div>
      {(() => {
        // second line only when it says something the title does not
        const who = [deal.customerName || deal.contactName, deal.city].filter(Boolean).join(' · ');
        const line = who && who !== deal.title ? who : deal.phone;
        return line ? <div className="crm-card__who">{line}</div> : null;
      })()}
      <div className="crm-card__row">
        <span className="crm-card__value">
          {deal.amount ? lakh(deal.amount) : <Text type="secondary">No value</Text>}
        </span>
        <Space size={4}>
          <BiginBadge deal={deal} compact />
          {deal.quotationRef && (
            <Tooltip title={`Quotation ${deal.quotationRef}`}>
              <Tag className="fv2-crmboard-a8eb4b00d7" bordered={false} color="orange">
                Q
              </Tag>
            </Tooltip>
          )}
          {deal.ownerName && (
            <Tooltip title={deal.ownerName}>
              <span className="crm-avatar">{deal.ownerName.slice(0, 1).toUpperCase()}</span>
            </Tooltip>
          )}
        </Space>
      </div>
      <div className="crm-card__meta">
        <span title="Days in this stage">
          <ClockCircleOutlined /> {deal.daysInStage}d
        </span>
        {deal.expectedClose && (
          <span
            className={
              isLate(deal.expectedClose) && !['won', 'lost'].includes(deal.stage) ? 'is-late' : ''
            }
            title="Expected to close"
          >
            <CalendarOutlined /> {dayjs(deal.expectedClose).format('D MMM')}
          </span>
        )}
        {deal.stuck && (
          <span className="is-warn">
            <WarningOutlined /> Stuck
          </span>
        )}
      </div>
      {next && (
        <div className={`crm-card__next ${isLate(next.dueDate) ? 'is-late' : ''}`}>
          {next.dueDate ? `${dueText(next.dueDate)} · ` : ''}
          {next.title}
        </div>
      )}
    </div>
  );
}

function DraggableCard({ deal, onOpen, disabled }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
    disabled,
  });
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{ opacity: isDragging ? 0.35 : 1 }}>
      <CardBody deal={deal} onOpen={onOpen} />
    </div>
  );
}

function Column({ stage, deals, total, onOpen, canEdit, onAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <div
      ref={setNodeRef}
      className={`crm-col ${isOver ? 'is-over' : ''} ${stage.closed ? 'is-closed' : ''}`}
      style={{ '--c': stage.color }}
    >
      <div className="crm-col__head">
        <span className="crm-col__dot" />
        <span className="crm-col__name">{stage.label}</span>
        <span className="crm-col__count">{total?.count || 0}</span>
      </div>
      <div className="crm-col__sum">{total?.amount ? lakh(total.amount) : '—'}</div>
      <div className="crm-col__cards">
        {deals.map((d) => (
          <DraggableCard key={d.id} deal={d} onOpen={onOpen} disabled={!canEdit} />
        ))}
        {!deals.length && <div className="crm-col__empty">Drop a deal here</div>}
      </div>
      {canEdit && !stage.closed && (
        <button className="crm-col__add" onClick={() => onAdd(stage.id)}>
          <PlusOutlined /> Add
        </button>
      )}
    </div>
  );
}

/** CRM → Pipeline: the Bigin-style board (as INOS), on CM ERP data. */
export default function CrmBoard() {
  const can = useCan();
  const canEdit = can('crm', 'edit');
  const [params, setParams] = useSearchParams();
  const view = params.get('view') === 'list' ? 'list' : 'board';
  const filters = useMemo(
    () =>
      Object.fromEntries(
        FILTER_KEYS.map((k) => [k, params.get(k) || undefined]).filter(([, v]) => v),
      ),
    [params],
  );
  const [search, setSearch] = useState(filters.q || '');
  const [page, setPage] = useState(1);

  const { data: meta } = useGetCrmMetaQuery();
  const { data: board, isLoading } = useGetCrmBoardQuery(filters, {
    skip: view !== 'board',
    pollingInterval: 120000,
  });
  const { data: listData, isFetching: listLoading } = useGetCrmDealsQuery(
    { ...filters, page, limit: 50 },
    { skip: view !== 'list' },
  );
  const [moveDeal] = useMoveDealMutation();
  const [sync, { isLoading: syncing }] = useBiginSyncMutation();

  const [openId, setOpenId] = useState(null);
  const [newOpen, setNewOpen] = useState(params.get('new') === '1');
  const [newStage, setNewStage] = useState('capture');
  const [dragDeal, setDragDeal] = useState(null);
  const [lostFor, setLostFor] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const setFilter = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    next.delete('new');
    setParams(next, { replace: true });
    setPage(1);
  };

  const move = async (deal, stage, lostReason) => {
    if (!deal || deal.stage === stage) return;
    if (stage === 'lost' && !lostReason) return setLostFor(deal);
    try {
      await moveDeal({ id: deal.id, stage, lostReason, boardArgs: filters }).unwrap();
      const label = meta?.stages.find((s) => s.id === stage)?.label;
      toast.success(`${deal.title} → ${label}`);
    } catch (e) {
      toast.error(e?.data?.message || 'Could not move the deal');
    }
  };

  const bigin = board?.bigin;
  const s = board?.summary;
  const activeFilters = FILTER_KEYS.filter((k) => k !== 'q' && k !== 'sort' && filters[k]).length;

  const columns = [
    {
      title: 'Deal',
      dataIndex: 'title',
      render: (t, d) => (
        <div>
          <a onClick={() => setOpenId(d.id)}>{t}</a>{' '}
          {d.tag && <Tag color={TAG_COLOR[d.tag]}>{d.tag}</Tag>}
          <div className="fv2-crmboard-6e66c29847">
            {[d.customerName || d.contactName, d.phone, d.city].filter(Boolean).join(' · ')}
          </div>
        </div>
      ),
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      width: 160,
      render: (st) => {
        const x = meta?.stages.find((m) => m.id === st);
        return <Tag color={x?.color}>{x?.label || st}</Tag>;
      },
    },
    {
      title: 'Value',
      dataIndex: 'amount',
      width: 110,
      align: 'right',
      render: (v) => (v ? lakh(v) : '—'),
    },
    { title: 'Owner', dataIndex: 'ownerName', width: 130 },
    { title: 'Source', dataIndex: 'source', width: 130 },
    {
      title: 'Next follow-up',
      dataIndex: 'nextTask',
      width: 220,
      render: (n) =>
        n ? (
          <span style={isLate(n.dueDate) ? { color: '#cf1322' } : undefined}>
            {n.dueDate ? `${dueText(n.dueDate)} · ` : ''}
            {n.title}
          </span>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      width: 110,
      render: (d) => dayjs(d).format('D MMM'),
    },
    {
      title: '',
      width: 70,
      render: (d) => (
        <Space size={2}>
          <BiginBadge deal={d} compact />
          {d.phone && (
            <Button size="small" type="text" icon={<PhoneOutlined />} href={`tel:${d.phone}`} />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-wrapper crm-page">
      <div className="crm-head">
        <div>
          <Title className="fv2-crmboard-e58961b461" level={3}>
            Pipeline
          </Title>
          <Text type="secondary">
            Enquiries to orders. Drag a card to move it; click it to call, note or quote.
          </Text>
        </div>
        <Space wrap>
          {bigin?.connected ? (
            <Tooltip
              title={
                bigin.lastSyncAt
                  ? `Last sync ${dayjs(bigin.lastSyncAt).format('D MMM, h:mm a')}`
                  : 'Not synced yet'
              }
            >
              <Button
                icon={<CloudSyncOutlined />}
                loading={syncing}
                onClick={() =>
                  sync()
                    .unwrap()
                    .then(({ result: r }) =>
                      toast.success(
                        `Bigin: ${r.created} new, ${r.updated} updated, ${r.pushed} sent`,
                      ),
                    )
                    .catch((e) => toast.error(e?.data?.message || 'Sync failed'))
                }
              >
                Sync Bigin
              </Button>
            </Tooltip>
          ) : null}
          {canEdit || can('crm', 'write') ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setNewStage('capture');
                setNewOpen(true);
              }}
            >
              New deal
            </Button>
          ) : null}
        </Space>
      </div>

      {s && view === 'board' && (
        <div className="crm-stats">
          <div className="crm-stat">
            <div className="crm-stat__v">{lakh(s.open.amount)}</div>
            <div className="crm-stat__l">{s.open.count} open deals</div>
          </div>
          <div className="crm-stat is-good">
            <div className="crm-stat__v">{lakh(s.wonThisMonth.amount)}</div>
            <div className="crm-stat__l">{s.wonThisMonth.count} won this month</div>
          </div>
          <button
            className={`crm-stat ${s.followUpsDue ? 'is-warn' : ''}`}
            onClick={() => setFilter('followUp', filters.followUp ? '' : 'due')}
          >
            <div className="crm-stat__v">{s.followUpsDue}</div>
            <div className="crm-stat__l">follow-ups due</div>
          </button>
          <div className="crm-stat">
            <div className="crm-stat__v">{s.newThisMonth}</div>
            <div className="crm-stat__l">new this month</div>
          </div>
          <div className="crm-stat">
            <div className="crm-stat__v">{s.lostThisMonth}</div>
            <div className="crm-stat__l">lost this month</div>
          </div>
        </div>
      )}

      <div className="crm-filters">
        <Input
          className="fv2-crmboard-6a3bc3b7f9"
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Name, mobile, city, company"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!e.target.value) setFilter('q', '');
          }}
          onPressEnter={() => setFilter('q', search.trim())}
        />
        <Segmented
          value={filters.owner === 'me' ? 'me' : 'all'}
          options={[
            { label: 'All deals', value: 'all' },
            { label: 'Mine', value: 'me' },
          ]}
          onChange={(v) => setFilter('owner', v === 'me' ? 'me' : '')}
        />
        <Select
          className="fv2-crmboard-4cddd8e1c8"
          allowClear
          placeholder="Owner"

          value={filters.owner && filters.owner !== 'me' ? filters.owner : undefined}
          onChange={(v) => setFilter('owner', v)}
          showSearch
          optionFilterProp="label"
          options={(meta?.owners || []).map((o) => ({ value: o.id, label: o.name }))}
        />
        <Select
          className="fv2-crmboard-4cddd8e1c8"
          allowClear
          placeholder="Source"

          value={filters.source}
          onChange={(v) => setFilter('source', v)}
          options={(meta?.sources || []).map((x) => ({ value: x, label: x }))}
        />
        <Select
          className="fv2-crmboard-fe5ce2fb80"
          allowClear
          placeholder="Tag"

          value={filters.tag}
          onChange={(v) => setFilter('tag', v)}
          options={(meta?.tags || []).map((x) => ({ value: x, label: x }))}
        />
        <Select
          className="fv2-crmboard-c4cd0b7261"
          allowClear
          placeholder="Type"

          value={filters.customerType}
          onChange={(v) => setFilter('customerType', v)}
          options={(meta?.customerTypes || []).map((x) => ({ value: x, label: x }))}
        />
        <Select
          className="fv2-crmboard-b0fcc76536"
          allowClear
          placeholder="Closing"

          value={filters.closing}
          onChange={(v) => setFilter('closing', v)}
          options={[
            { value: 'month', label: 'Closing this month' },
            { value: 'late', label: 'Past close date' },
          ]}
        />
        {bigin?.connected && (
          <Select
            className="fv2-crmboard-e197aee742"
            allowClear
            placeholder="Bigin"

            value={filters.bigin}
            onChange={(v) => setFilter('bigin', v)}
            options={[
              { value: 'linked', label: 'In Bigin' },
              { value: 'local', label: 'Not in Bigin' },
              { value: 'error', label: 'Bigin errors' },
            ]}
          />
        )}
        <Select
          className="fv2-crmboard-d7c7d5ab2a"
          placeholder="Sort"

          value={filters.sort || 'updated'}
          onChange={(v) => setFilter('sort', v === 'updated' ? '' : v)}
          options={[
            { value: 'updated', label: 'Recently updated' },
            { value: 'newest', label: 'Newest first' },
            { value: 'value-desc', label: 'Value: high to low' },
            { value: 'close', label: 'Closing soonest' },
            { value: 'stuck', label: 'Longest in stage' },
            { value: 'name', label: 'Name A–Z' },
          ]}
        />
        {activeFilters > 0 && (
          <Button
            type="link"
            onClick={() => setParams(view === 'list' ? { view: 'list' } : {}, { replace: true })}
          >
            Clear filters
          </Button>
        )}
        <div className="fv2-crmboard-f839121e90" />
        <Segmented
          value={view}
          onChange={(v) => setFilter('view', v === 'list' ? 'list' : '')}
          options={[
            { value: 'board', icon: <AppstoreOutlined />, label: 'Board' },
            { value: 'list', icon: <UnorderedListOutlined />, label: 'List' },
          ]}
        />
      </div>

      {view === 'board' ? (
        isLoading ? (
          <div className="crm-board">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="crm-col is-loading" />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            onDragStart={(e) => setDragDeal(e.active.data.current?.deal)}
            onDragCancel={() => setDragDeal(null)}
            onDragEnd={(e) => {
              setDragDeal(null);
              if (e.over) move(e.active.data.current?.deal, e.over.id);
            }}
          >
            <div className="crm-board">
              {(board?.stages || []).map((st) => (
                <Column
                  key={st.id}
                  stage={st}
                  deals={board.columns[st.id] || []}
                  total={board.totals[st.id]}
                  onOpen={setOpenId}
                  canEdit={canEdit}
                  onAdd={(id) => {
                    setNewStage(id);
                    setNewOpen(true);
                  }}
                />
              ))}
            </div>
            <DragOverlay>{dragDeal ? <CardBody deal={dragDeal} dragging /> : null}</DragOverlay>
          </DndContext>
        )
      ) : (
        <Table
          rowKey="id"
          size="middle"
          loading={listLoading}
          columns={columns}
          dataSource={listData?.data || []}
          onRow={(d) => ({ onDoubleClick: () => setOpenId(d.id) })}
          pagination={{
            current: page,
            pageSize: 50,
            total: listData?.total || 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
          locale={{ emptyText: <Empty description="No deals match" /> }}
          scroll={{ x: 900 }}
        />
      )}

      <DealDrawer id={openId} open={!!openId} onClose={() => setOpenId(null)} />
      <DealFormModal
        open={newOpen}
        defaults={{ stage: newStage }}
        onClose={() => setNewOpen(false)}
        onSaved={(d) => d?.id && setOpenId(d.id)}
      />
      <LostReasonModal
        open={!!lostFor}
        reasons={meta?.lostReasons}
        onCancel={() => setLostFor(null)}
        onOk={(r) => {
          const d = lostFor;
          setLostFor(null);
          move(d, 'lost', r);
        }}
      />
    </div>
  );
}
