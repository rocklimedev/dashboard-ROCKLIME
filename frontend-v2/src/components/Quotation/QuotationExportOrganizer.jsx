import { useState } from 'react';
import { Button, Checkbox, Empty, Input, Space, Typography } from 'antd';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HolderOutlined } from '@ant-design/icons';
import ModalShell from '../Common/ModalShell';
import { groupExportPages, flattenExportGroups } from './quotationExportGroups';
import './QuotationExportOrganizer.css';

function SortableRow({ id, label, pageIds, selected, onToggle, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const count = pageIds.filter(id => selected.includes(id)).length;
  return <div ref={setNodeRef} className="quotation-organizer-group" style={{ transform: CSS.Transform.toString(transform), transition }}>
    <div className="quotation-organizer-row">
      <Button {...attributes} {...listeners} icon={<HolderOutlined />} aria-label={`Drag ${label}`} style={{ touchAction: 'none' }} />
      <Checkbox checked={count === pageIds.length} indeterminate={count > 0 && count < pageIds.length}
        disabled={count === pageIds.length && selected.length === count} onChange={() => onToggle(pageIds, count !== pageIds.length)}>{label}</Checkbox>
      <Typography.Text type="secondary">{pageIds.length} {pageIds.length === 1 ? 'page' : 'pages'}</Typography.Text>
    </div>
    {children}
  </div>;
}
export default function QuotationExportOrganizer({ open, onClose, pages, floors = [], pageOrder, setPageOrder, onSave, saving, downloading, onDownload }) {
  const [search, setSearch] = useState('');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const selected = pageOrder ?? pages.map(p => p.id);
  const groups = groupExportPages(pages, pageOrder, floors);
  const commit = (next, included = selected) => setPageOrder(flattenExportGroups(next, included));
  const toggle = (ids, include) => commit(groups, include ? [...new Set([...selected, ...ids])] : selected.filter(id => !ids.includes(id)));
  const query = search.toLowerCase();
  const visible = groups.filter(group => group.label.toLowerCase().includes(query) || group.rooms.some(room => room.label.toLowerCase().includes(query)));
  return <ModalShell open={open} onCancel={onClose} title="Organize quotation export" width="min(1100px, 96vw)" footer={<Space wrap>
    <Button onClick={() => setPageOrder(null)}>Reset page order</Button>
    <Button loading={saving} disabled={!pages.length} onClick={onSave}>Save export settings</Button>
    <Button type="primary" loading={downloading} disabled={!pages.length || !selected.length} onClick={onDownload}>Download PDF</Button>
  </Space>}>
    <Typography.Paragraph type="secondary">Drag a floor to move all its rooms together, or reorder rooms within a floor. Selecting a room includes all its continuation pages in their original order. Totals cover the complete quotation. Keyboard: focus a drag handle, press Space, then use arrow keys.</Typography.Paragraph>
    <Input.Search placeholder="Find a floor or room" value={search} onChange={e => setSearch(e.target.value)} allowClear />
    <Typography.Paragraph>{selected.length} of {pages.length} pages selected</Typography.Paragraph>
    <div className="quotation-organizer-list">
      {!pages.length ? <Empty description="Pages will appear when the PDF preview loads" /> : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) commit(arrayMove(groups, groups.findIndex(g => g.id === active.id), groups.findIndex(g => g.id === over.id)));
      }}><SortableContext items={groups.map(g => g.id)} strategy={verticalListSortingStrategy}>
        {visible.map(group => <SortableRow key={group.id} id={group.id} label={group.label} pageIds={group.rooms.flatMap(r => r.pages)} selected={selected} onToggle={toggle}>
          {group.isFloor && <div className="quotation-organizer-rooms"><DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
            if (!over || active.id === over.id) return;
            commit(groups.map(g => g.id !== group.id ? g : { ...g, rooms: arrayMove(g.rooms, g.rooms.findIndex(r => r.id === active.id), g.rooms.findIndex(r => r.id === over.id)) }));
          }}><SortableContext items={group.rooms.map(r => r.id)} strategy={verticalListSortingStrategy}>
            {group.rooms.filter(room => group.label.toLowerCase().includes(query) || room.label.toLowerCase().includes(query)).map(room => <SortableRow key={room.id} id={room.id} label={room.label} pageIds={room.pages} selected={selected} onToggle={toggle} />)}
          </SortableContext></DndContext></div>}
        </SortableRow>)}
      </SortableContext></DndContext>}
    </div>
  </ModalShell>;
}
