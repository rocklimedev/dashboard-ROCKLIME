import { useState } from 'react';
import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Select,
  Space,
  Tag,
  message,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  HolderOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import dayjs from 'dayjs';
import usePlanning from '../planning/usePlanning';
import AgendaLayout from '../planning/AgendaLayout';

const columns = [
  { status: 'Open', label: 'To do', color: '#64748b', description: 'Ready when you are' },
  {
    status: 'In progress',
    label: 'In progress',
    color: '#6366f1',
    description: 'Where the focus is',
  },
  {
    status: 'Completed',
    label: 'Done',
    color: '#16a085',
    description: 'A little progress, every day',
  },
];
const priorities = ['Low', 'Normal', 'High'];

function TaskCard({ task, ready, onEdit, onMove, onDelete }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    disabled: !ready,
  });
  const overdue =
    task.dueDate && task.dueDate < dayjs().format('YYYY-MM-DD') && task.status !== 'Completed';
  return (
    <article ref={setNodeRef} className={`agenda-task-card ${isDragging ? 'is-dragging' : ''}`}>
      <div className="agenda-task-top">
        <Tag className={`agenda-priority priority-${task.priority.toLowerCase()}`}>
          {task.priority} priority
        </Tag>
        <button
          type="button"
          className="agenda-drag-handle"
          disabled={!ready}
          aria-label={`Drag ${task.title}. Use the status menu to move with a keyboard.`}
          {...attributes}
          {...listeners}
        >
          <HolderOutlined />
        </button>
      </div>
      <button
        type="button"
        className="agenda-task-title"
        disabled={!ready}
        onClick={() => onEdit(task)}
      >
        {task.title}
      </button>
      {task.description && <p className="agenda-task-description">{task.description}</p>}
      <div className="agenda-task-project">{task.project || 'Personal task'}</div>
      <div className="agenda-task-footer">
        <span className={overdue ? 'agenda-overdue' : ''}>
          <CalendarOutlined /> {task.dueDate ? dayjs(task.dueDate).format('D MMM') : 'No due date'}
          {overdue && ' · Overdue'}
        </span>
        <Popconfirm title="Delete this task?" onConfirm={() => onDelete(task)}>
          <Button
            type="text"
            size="small"
            danger
            disabled={!ready}
            icon={<DeleteOutlined />}
            aria-label={`Delete ${task.title}`}
          />
        </Popconfirm>
      </div>
      <Select
        aria-label={`Status for ${task.title}`}
        className="agenda-card-status"
        size="small"
        value={task.status}
        disabled={!ready}
        onChange={(status) => onMove(task, status)}
        options={columns.map((column) => ({ value: column.status, label: column.label }))}
      />
    </article>
  );
}
function TaskColumn({ column, tasks, ready, onAdd, onEdit, onMove, onDelete, filtered }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.status, disabled: !ready });
  return (
    <section
      ref={setNodeRef}
      className={`agenda-board-column ${isOver ? 'is-over' : ''}`}
      aria-label={column.label}
      style={{ '--column-color': column.color }}
    >
      <div className="agenda-column-heading">
        <h3>
          <span className="agenda-status-dot" />
          {column.label}
          <span className="agenda-count">{tasks.length}</span>
        </h3>
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined />}
          aria-label={`Add task to ${column.label}`}
          disabled={!ready}
          onClick={() => onAdd({ status: column.status })}
        />
      </div>
      <p className="agenda-column-description">{column.description}</p>
      <div className="agenda-column-cards">
        {tasks.map((task) => (
          <TaskCard key={task.id} {...{ task, ready, onEdit, onMove, onDelete }} />
        ))}
        {!tasks.length && (
          <div className="agenda-column-empty">
            <CheckCircleOutlined />
            <p>
              {filtered
                ? 'No matching tasks'
                : column.status === 'Completed'
                  ? 'Good work belongs here.'
                  : 'A clear space for your next task.'}
            </p>
          </div>
        )}
      </div>
      <Button
        className="agenda-add-task"
        type="text"
        block
        icon={<PlusOutlined />}
        disabled={!ready}
        onClick={() => onAdd({ status: column.status })}
      >
        Add task
      </Button>
    </section>
  );
}
export default function TasksPage() {
  const { tasks, save: saveRecord, remove: removeRecord, ready, error, saving } = usePlanning();
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('All');
  const [editing, setEditing] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [form] = Form.useForm();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const filtered = tasks.filter(
    (task) =>
      (priority === 'All' || task.priority === priority) &&
      `${task.title} ${task.project || ''}`.toLowerCase().includes(query.toLowerCase()),
  );
  const completed = tasks.filter((task) => task.status === 'Completed').length;
  const overdue = tasks.filter(
    (task) =>
      task.status !== 'Completed' && task.dueDate && task.dueDate < dayjs().format('YYYY-MM-DD'),
  ).length;
  const open = (task = {}) => {
    form.resetFields();
    form.setFieldsValue({
      status: 'Open',
      priority: 'Normal',
      ...task,
      dueDate: task.dueDate ? dayjs(task.dueDate) : null,
    });
    setEditing(task);
  };
  const save = async () => {
    try {
      const values = await form.validateFields();
      await saveRecord(
        'tasks',
        {
          ...values,
          title: values.title.trim(),
          dueDate: values.dueDate?.format('YYYY-MM-DD') || null,
        },
        editing?.id ? editing : null,
      );
      setEditing(null);
      message.success('Task saved');
    } catch (err) {
      if (!err.errorFields) message.error(err.message);
    }
  };
  const move = async (task, status) => {
    if (!ready || !task || task.status === status) return;
    try {
      await saveRecord('tasks', { status }, task);
      message.success(`Moved to ${columns.find((column) => column.status === status).label}`);
    } catch (err) {
      message.error(err.message);
    }
  };
  const remove = async (task) => {
    try {
      await removeRecord('tasks', task);
    } catch (err) {
      message.error(err.message);
    }
  };
  return (
    <AgendaLayout error={error}>
      <div className="agenda-view-heading">
        <div>
          <span className="agenda-eyebrow">MAKE ROOM FOR WHAT MATTERS</span>
          <h2>Your task board</h2>
          <p>From the first idea to the final checkmark.</p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          disabled={!ready}
          onClick={() => open()}
        >
          New task
        </Button>
      </div>
      <div className="agenda-board-summary">
        <div>
          <strong>{tasks.length - completed}</strong>
          <span>active tasks</span>
        </div>
        <div>
          <strong>{completed}</strong>
          <span>completed</span>
        </div>
        <div className={overdue ? 'agenda-overdue' : ''}>
          <strong>{overdue}</strong>
          <span>overdue</span>
        </div>
        <div className="agenda-completion">
          <span>{tasks.length ? Math.round((completed / tasks.length) * 100) : 0}% complete</span>
          <Progress
            percent={tasks.length ? Math.round((completed / tasks.length) * 100) : 0}
            showInfo={false}
            strokeColor="#6366f1"
            size="small"
          />
        </div>
      </div>
      <div className="agenda-board-toolbar">
        <Space wrap>
          <Input
            prefix={<SearchOutlined />}
            aria-label="Search tasks"
            placeholder="Search tasks or projects…"
            allowClear
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select
            aria-label="Filter by priority"
            value={priority}
            onChange={setPriority}
            options={[
              { value: 'All', label: 'All priorities' },
              ...priorities.map((value) => ({ value, label: `${value} priority` })),
            ]}
          />
        </Space>
        <span className="agenda-subtle">Drag cards to move them, or use the status menu</span>
      </div>
      {!ready && !error && !saving && (
        <Alert type="info" showIcon message="Loading your workspace…" className="agenda-error" />
      )}
      {tasks.length > 0 && !filtered.length && (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No tasks match your filters" />
      )}
      <DndContext
        sensors={sensors}
        onDragStart={({ active }) => setDraggedId(active.id)}
        onDragCancel={() => setDraggedId(null)}
        onDragEnd={({ active, over }) => {
          setDraggedId(null);
          if (over && columns.some((column) => column.status === over.id))
            move(
              tasks.find((task) => task.id === active.id),
              over.id,
            );
        }}
      >
        <div className="agenda-kanban">
          {columns.map((column) => (
            <TaskColumn
              key={column.status}
              column={column}
              tasks={filtered.filter((task) => task.status === column.status)}
              ready={ready}
              onAdd={open}
              onEdit={open}
              onMove={move}
              onDelete={remove}
              filtered={Boolean(query || priority !== 'All')}
            />
          ))}
        </div>
        <DragOverlay>
          {draggedId && (
            <div className="agenda-drag-preview">
              {tasks.find((task) => task.id === draggedId)?.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>
      <Modal
        title={editing?.id ? 'Edit task' : 'New task'}
        open={editing !== null}
        onCancel={() => setEditing(null)}
        onOk={save}
        confirmLoading={saving}
        okButtonProps={{ disabled: !ready }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Task"
            rules={[{ required: true, whitespace: true, max: 200 }]}
          >
            <Input maxLength={200} placeholder="What needs to get done?" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} maxLength={10000} />
          </Form.Item>
          <Form.Item name="project" label="Project">
            <Input placeholder="Project name" maxLength={200} />
          </Form.Item>
          <div className="agenda-form-pair">
            <Form.Item name="status" label="Status">
              <Select
                options={columns.map((column) => ({ value: column.status, label: column.label }))}
              />
            </Form.Item>
            <Form.Item name="priority" label="Priority">
              <Select options={priorities.map((value) => ({ value }))} />
            </Form.Item>
          </div>
          <Form.Item name="dueDate" label="Due date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </AgendaLayout>
  );
}
