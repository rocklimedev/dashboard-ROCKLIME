import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Calendar,
  Checkbox,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Space,
  message,
} from 'antd';
import {
  CalendarOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import usePlanning from '../planning/usePlanning';
import AgendaLayout from '../planning/AgendaLayout';
import { itemsOnDay, layoutDayEvents, monthDays, weekStart } from '../planning/calendarHelpers';

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 24 }, (_, hour) => hour);
export default function CalendarPage() {
  const {
    tasks,
    events,
    ready,
    error,
    save: saveRecord,
    remove: removeRecord,
    saving,
  } = usePlanning();
  const [selected, setSelected] = useState(dayjs().startOf('day'));
  const [view, setView] = useState('Month');
  const [showEvents, setShowEvents] = useState(true);
  const [showTasks, setShowTasks] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const timeline = useRef(null);
  const visibleEvents = showEvents ? events : [];
  const visibleTasks = showTasks ? tasks : [];
  const onDay = (date) => itemsOnDay(date, visibleEvents, visibleTasks);
  const days =
    view === 'Day'
      ? [selected]
      : Array.from({ length: 7 }, (_, index) => weekStart(selected).add(index, 'day'));
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  useEffect(() => {
    if (timeline.current) timeline.current.scrollTop = 7 * 48;
  }, [view]);
  const open = (event = {}, date = selected, hour = 9) => {
    form.resetFields();
    form.setFieldsValue({
      ...event,
      range: event.id
        ? [dayjs(event.startAt), dayjs(event.endAt)]
        : [date.hour(hour).minute(0).second(0), date.hour(hour).minute(0).second(0).add(1, 'hour')],
    });
    setEditing(event);
  };
  const save = async () => {
    try {
      const { range, ...values } = await form.validateFields();
      await saveRecord(
        'events',
        {
          ...values,
          title: values.title.trim(),
          startAt: range[0].toISOString(),
          endAt: range[1].toISOString(),
          timeZone: timezone,
        },
        editing?.id ? editing : null,
      );
      setEditing(null);
      message.success('Event saved');
    } catch (err) {
      if (!err.errorFields) message.error(err.message);
    }
  };
  const remove = async () => {
    try {
      await removeRecord('events', editing);
      setEditing(null);
      message.success('Event deleted');
    } catch (err) {
      message.error(err.message);
    }
  };
  const periodLabel =
    view === 'Month'
      ? selected.format('MMMM YYYY')
      : view === 'Day'
        ? selected.format('D MMMM YYYY')
        : `${days[0].format('D MMM')} – ${days[6].format('D MMM YYYY')}`;
  const navigate = (direction) =>
    setSelected(
      selected.add(direction, view === 'Month' ? 'month' : view === 'Week' ? 'week' : 'day'),
    );
  const today = dayjs();
  const eventButton = (item, compact = false) =>
    item.kind === 'task' ? (
      <Link
        key={`task-${item.id}`}
        to="/agenda/tasks"
        className={`agenda-calendar-item is-task ${item.status === 'Completed' ? 'is-complete' : ''}`}
        title={`${item.title} · ${item.status}`}
      >
        <CheckSquareOutlined />
        <span>{item.title}</span>
      </Link>
    ) : (
      <button
        type="button"
        key={`event-${item.id}`}
        className="agenda-calendar-item is-event"
        title={item.title}
        disabled={!ready}
        onClick={() => open(item)}
      >
        <span className="agenda-event-dot" />
        <span>
          {!compact && `${dayjs(item.startAt).format('HH:mm')} `}
          {item.title}
        </span>
      </button>
    );
  return (
    <AgendaLayout error={error}>
      <div className="agenda-view-heading">
        <div>
          <span className="agenda-eyebrow">A PLACE FOR EVERY PLAN</span>
          <h2>Your calendar</h2>
          <p>See the big picture. Make time for the details.</p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          disabled={!ready}
          onClick={() => open()}
        >
          New event
        </Button>
      </div>
      {!ready && !error && !saving && (
        <Alert type="info" showIcon message="Loading your workspace…" className="agenda-error" />
      )}
      <div className="agenda-calendar-layout">
        <aside className="agenda-calendar-aside">
          <div className="agenda-mini-calendar">
            <Calendar
              fullscreen={false}
              value={selected}
              onSelect={(date) => setSelected(date.startOf('day'))}
            />
          </div>
          <div className="agenda-calendar-filters">
            <h3>On your calendar</h3>
            <Checkbox
              checked={showEvents}
              onChange={(event) => setShowEvents(event.target.checked)}
            >
              <span className="agenda-legend-dot event-dot" />
              Events
            </Checkbox>
            <Checkbox checked={showTasks} onChange={(event) => setShowTasks(event.target.checked)}>
              <span className="agenda-legend-dot task-dot" />
              Task deadlines
            </Checkbox>
            <p>
              <ClockCircleOutlined /> {timezone.replaceAll('_', ' ')}
            </p>
          </div>
          <div className="agenda-day-preview">
            <span className="agenda-eyebrow">
              {selected.isSame(today, 'day') ? 'TODAY' : selected.format('dddd').toUpperCase()}
            </span>
            <h3>{selected.format('D MMMM')}</h3>
            <p className="agenda-subtle">{onDay(selected).length} scheduled items</p>
            {!onDay(selected).length ? (
              <div className="agenda-day-empty">
                <CalendarOutlined />
                <p>A little breathing room.</p>
                <Button type="link" disabled={!ready} onClick={() => open()}>
                  Plan something
                </Button>
              </div>
            ) : (
              onDay(selected).map((item) => (
                <div
                  className={`agenda-day-item ${item.kind === 'task' ? 'is-task' : ''}`}
                  key={`${item.kind}-${item.id}`}
                >
                  <small>
                    {item.kind === 'task'
                      ? 'TASK DEADLINE'
                      : `${dayjs(item.startAt).format('HH:mm')} – ${dayjs(item.endAt).format('HH:mm')}`}
                  </small>
                  {item.kind === 'task' ? (
                    <Link to="/agenda/tasks">{item.title}</Link>
                  ) : (
                    <button type="button" disabled={!ready} onClick={() => open(item)}>
                      {item.title}
                    </button>
                  )}
                  {item.location && (
                    <span>
                      <EnvironmentOutlined /> {item.location}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
        <section className="agenda-calendar-main" aria-label={`${view} calendar`}>
          <div className="agenda-calendar-toolbar">
            <div className="agenda-date-controls">
              <Button onClick={() => setSelected(today.startOf('day'))}>Today</Button>
              <Button
                type="text"
                icon={<LeftOutlined />}
                aria-label={`Previous ${view.toLowerCase()}`}
                onClick={() => navigate(-1)}
              />
              <Button
                type="text"
                icon={<RightOutlined />}
                aria-label={`Next ${view.toLowerCase()}`}
                onClick={() => navigate(1)}
              />
              <h3 aria-live="polite">{periodLabel}</h3>
            </div>
            <Segmented
              aria-label="Calendar view"
              options={['Month', 'Week', 'Day']}
              value={view}
              onChange={setView}
            />
          </div>
          {view === 'Month' ? (
            <div className="agenda-month-scroll">
              <div className="agenda-month">
                <div className="agenda-weekdays">
                  {weekdays.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="agenda-month-grid">
                  {monthDays(selected).map((date) => {
                    const items = onDay(date);
                    return (
                      <div
                        key={date.format('YYYY-MM-DD')}
                        className={`agenda-month-day ${!date.isSame(selected, 'month') ? 'is-outside' : ''} ${date.isSame(selected, 'day') ? 'is-selected' : ''}`}
                      >
                        <div className="agenda-date-top">
                          <button
                            type="button"
                            className={date.isSame(today, 'day') ? 'is-today' : ''}
                            aria-label={`Select ${date.format('D MMMM YYYY')}`}
                            aria-pressed={date.isSame(selected, 'day')}
                            onClick={() => setSelected(date)}
                          >
                            {date.date()}
                          </button>
                          <button
                            type="button"
                            className="agenda-date-add"
                            disabled={!ready}
                            aria-label={`Add event on ${date.format('D MMMM YYYY')}`}
                            onClick={() => {
                              setSelected(date);
                              open({}, date);
                            }}
                          >
                            <PlusOutlined />
                          </button>
                        </div>
                        <div className="agenda-date-items">
                          {items.slice(0, 3).map((item) => eventButton(item))}
                          {items.length > 3 && (
                            <button
                              type="button"
                              className="agenda-more-items"
                              onClick={() => {
                                setSelected(date);
                                setView('Day');
                              }}
                            >
                              +{items.length - 3} more
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="agenda-time-scroll" ref={timeline}>
              <div
                className="agenda-time-grid"
                style={{ '--day-count': days.length, minWidth: view === 'Week' ? 700 : 280 }}
              >
                <div className="agenda-time-day-header">
                  <div className="agenda-time-gutter">GMT{today.format('Z')}</div>
                  {days.map((date) => (
                    <button
                      type="button"
                      key={date.format('YYYY-MM-DD')}
                      className={date.isSame(today, 'day') ? 'is-today' : ''}
                      onClick={() => {
                        setSelected(date);
                        setView('Day');
                      }}
                    >
                      <span>{date.format('ddd')}</span>
                      <strong>{date.format('D')}</strong>
                    </button>
                  ))}
                </div>
                <div className="agenda-deadline-row">
                  <span className="agenda-time-gutter">Deadlines</span>
                  {days.map((date) => (
                    <div key={date.format('YYYY-MM-DD')}>
                      {itemsOnDay(date, [], visibleTasks).map((item) => eventButton(item, true))}
                    </div>
                  ))}
                </div>
                <div className="agenda-time-body">
                  <div className="agenda-hours">
                    {hours.map((hour) => (
                      <span key={hour} style={{ top: hour * 48 }}>
                        {String(hour).padStart(2, '0')}:00
                      </span>
                    ))}
                  </div>
                  {days.map((date) => (
                    <div className="agenda-time-day" key={date.format('YYYY-MM-DD')}>
                      {hours.map((hour) => (
                        <button
                          type="button"
                          className="agenda-hour-slot"
                          key={hour}
                          style={{ top: hour * 48 }}
                          disabled={!ready}
                          aria-label={`Create event ${date.format('D MMMM')} at ${hour}:00`}
                          onClick={() => {
                            setSelected(date);
                            open({}, date, hour);
                          }}
                        />
                      ))}
                      {layoutDayEvents(date, visibleEvents).map((event) => (
                        <button
                          type="button"
                          key={event.id}
                          className="agenda-timed-event"
                          disabled={!ready}
                          title={`${event.title} · ${dayjs(event.startAt).format('HH:mm')} – ${dayjs(event.endAt).format('HH:mm')}`}
                          onClick={() => open(event)}
                          style={{
                            top: (event.startMinute / 60) * 48,
                            height:
                              (Math.min(
                                1440 - event.startMinute,
                                Math.max(30, event.endMinute - event.startMinute),
                              ) /
                                60) *
                              48,
                            left: `calc(${(event.lane / event.lanes) * 100}% + 2px)`,
                            width: `calc(${100 / event.lanes}% - 4px)`,
                          }}
                        >
                          <strong>{event.title}</strong>
                          <span>
                            {dayjs(event.startAt).format('HH:mm')} –{' '}
                            {dayjs(event.endAt).format('HH:mm')}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="agenda-calendar-bottom">
            <span>
              <span className="agenda-legend-dot event-dot" />
              Events
            </span>
            <span>
              <span className="agenda-legend-dot task-dot" />
              Task deadlines
            </span>
            <span className="agenda-subtle">
              Select a date or an empty time slot to plan your day
            </span>
          </div>
          {!showEvents && !showTasks && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Choose events or task deadlines to show on the calendar"
            />
          )}
        </section>
      </div>
      <Modal
        title={editing?.id ? 'Edit event' : 'New event'}
        open={editing !== null}
        onCancel={() => setEditing(null)}
        onOk={save}
        confirmLoading={saving}
        okButtonProps={{ disabled: !ready }}
        destroyOnHidden
        footer={(_, { OkBtn, CancelBtn }) => (
          <div className="agenda-event-modal-footer">
            {editing?.id && (
              <Popconfirm title="Delete this event?" onConfirm={remove}>
                <Button danger disabled={!ready}>
                  Delete event
                </Button>
              </Popconfirm>
            )}
            <Space>
              <CancelBtn />
              <OkBtn />
            </Space>
          </div>
        )}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Event"
            rules={[{ required: true, whitespace: true, max: 200 }]}
          >
            <Input maxLength={200} placeholder="Give your event a name" />
          </Form.Item>
          <Form.Item
            name="range"
            label="Start and end"
            extra={`Times shown in ${timezone}`}
            rules={[
              { required: true },
              {
                validator: (_, value) =>
                  !value || (value[0] && value[1] && value[1].isAfter(value[0]))
                    ? Promise.resolve()
                    : Promise.reject(new Error('End must be after start.')),
              },
            ]}
          >
            <DatePicker.RangePicker showTime format="DD MMM YYYY HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="Location">
            <Input prefix={<EnvironmentOutlined />} maxLength={500} placeholder="Add a location" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={3}
              maxLength={10000}
              placeholder="Notes, details, or a little context"
            />
          </Form.Item>
        </Form>
      </Modal>
    </AgendaLayout>
  );
}
