import Loader from '../Common/Loader';
import './CliqDrawer.styles.css';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Avatar, Badge, Button, Drawer, Empty, Input, Segmented, Space, Tooltip } from 'antd';
import { toast } from 'sonner';
import {
  ArrowLeftOutlined,
  CloseOutlined,
  CommentOutlined,
  ExpandOutlined,
  PlusOutlined,
  SearchOutlined,
  SendOutlined,
  StarOutlined,
  TeamOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import {
  useGetCliqStatusQuery,
  useGetCliqChatsQuery,
  useGetCliqChannelsQuery,
  useGetCliqPeopleQuery,
  useGetCliqMessagesQuery,
  useSendCliqMessageMutation,
} from '../../api/cliqApi';
import { chatId, chatName, initials, preview, rows, unread } from './cliqHelpers';
import './cliq.css';

const sections = [
  { key: 'pins', label: 'My Pins', icon: <StarOutlined /> },
  { key: 'chats', label: 'Chats', icon: <CommentOutlined /> },
  { key: 'channels', label: 'Channels', icon: <AppstoreOutlined /> },
  { key: 'people', label: 'People', icon: <TeamOutlined /> },
];

function Conversation({ conversation, onBack }) {
  const id = chatId(conversation);
  const { data, isFetching, error, refetch } = useGetCliqMessagesQuery(id, {
    pollingInterval: 15000,
    refetchOnMountOrArgChange: true,
  });
  const [send, { isLoading: sending }] = useSendCliqMessageMutation();
  const [text, setText] = useState('');
  const end = useRef(null);
  const messages = [...rows(data, 'messages')].sort(
    (a, b) =>
      new Date(a.time || a.created_time).getTime() - new Date(b.time || b.created_time).getTime(),
  );
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data]);
  const submit = async () => {
    if (!text.trim() || sending) return;
    try {
      await send({ id, text: text.trim() }).unwrap();
      setText('');
    } catch (error) {
      toast.error(error?.data?.message || 'Message could not be sent');
    }
  };
  return (
    <div className="cliq-conversation">
      <div className="cliq-conversation-head">
        <Button
          type="text"
          aria-label="Back to chats"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
        />
        <strong>{chatName(conversation)}</strong>
        <Button
          type="text"
          aria-label="Refresh messages"
          loading={isFetching}
          icon={<ReloadOutlined />}
          onClick={refetch}
        />
      </div>
      <div className="cliq-messages" aria-live="polite">
        {error ? (
          <Alert type="error" message={error?.data?.message || 'Could not load messages'} />
        ) : !messages.length ? (
          isFetching ? (
            <Loader />
          ) : (
            <Empty description="No messages yet" />
          )
        ) : (
          messages.map((item, index) => (
            <article className="cliq-message" key={item.id || index}>
              <strong>{item.sender?.name || item.sender_name || 'Message'}</strong>
              <p>
                {item.content?.text ||
                  item.text ||
                  `[${item.type || 'Attachment'}] Open in Cliq to view this content.`}
              </p>
              {item.time && (
                <time>
                  {new Date(item.time).toLocaleString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short',
                  })}
                </time>
              )}
            </article>
          ))
        )}
        <div ref={end} />
      </div>
      <div className="cliq-compose">
        <Input.TextArea
          aria-label="Message"
          placeholder="Type a message…"
          autoSize={{ minRows: 1, maxRows: 4 }}
          maxLength={5000}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <Button
          type="primary"
          aria-label="Send message"
          icon={<SendOutlined />}
          disabled={!text.trim() || !!error}
          loading={sending}
          onClick={submit}
        />
      </div>
    </div>
  );
}

export default function CliqDrawer({ open, onClose, userId }) {
  const [section, setSection] = useState('chats'),
    [filter, setFilter] = useState('Recent'),
    [search, setSearch] = useState(''),
    [selected, setSelected] = useState(null),
    [expanded, setExpanded] = useState(false);
  const searchRef = useRef(null);
  const {
    data: status,
    isFetching: checking,
    error: statusError,
    refetch: check,
  } = useGetCliqStatusQuery(undefined, { skip: !open, refetchOnMountOrArgChange: true });
  const active = open && status?.connected;
  const chats = useGetCliqChatsQuery(undefined, {
    skip: !active || !['chats', 'pins'].includes(section),
    pollingInterval: active && ['chats', 'pins'].includes(section) ? 30000 : 0,
  });
  const channels = useGetCliqChannelsQuery(undefined, { skip: !active || section !== 'channels' });
  const people = useGetCliqPeopleQuery(undefined, { skip: !active || section !== 'people' });
  useEffect(() => {
    if (!open) return;
    const focus = (event) => {
      if (event.ctrlKey && event.code === 'Space') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', focus);
    return () => window.removeEventListener('keydown', focus);
  }, [open]);
  const current = section === 'channels' ? channels : section === 'people' ? people : chats;
  const list = rows(
    current.data,
    section === 'channels' ? 'channels' : section === 'people' ? 'users' : 'chats',
  ).filter(
    (item) =>
      (!search ||
        `${chatName(item)} ${preview(item)} ${item.email_id || ''}`
          .toLowerCase()
          .includes(search.toLowerCase())) &&
      (section !== 'pins' || item.pinned) &&
      (section !== 'chats' || filter !== 'Unread' || unread(item) > 0),
  );
  const hasUnreadCounts = rows(chats.data, 'chats').some(
    (item) => item.unread_count != null || item.unread_message_count != null,
  );
  const webUrl = status?.webUrl || 'https://cliq.zoho.in';
  return (
    <Drawer
      className="cliq-drawer"
      title={null}
      closable={false}
      open={open}
      onClose={onClose}
      width={expanded ? 'min(760px, 100vw)' : 'min(380px, 100vw)'}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
      }}
      destroyOnHidden
    >
      <header className="cliq-header">
        <span className="cliq-brand">
          <CommentOutlined />
        </span>
        <div>
          <strong>Cliq Mini</strong>
          <small>
            <i className={status?.connected && !statusError ? 'is-connected' : ''} />
            {statusError
              ? 'Connection unavailable'
              : checking
                ? 'Checking…'
                : status?.connected
                  ? 'Connected'
                  : 'Disconnected'}
          </small>
        </div>
        <Space className="fv2-cliqdrawer-2211ee230e" size={0}>
          <Button
            type="text"
            aria-label="Open full Cliq"
            title="Open full Cliq"
            href={webUrl}
            target="_blank"
            rel="noreferrer"
            icon={<ExportOutlined />}
          />
          <Button
            type="text"
            aria-label={expanded ? 'Minimize chat' : 'Expand chat'}
            icon={<ExpandOutlined />}
            onClick={() => setExpanded(!expanded)}
          />
          <Button type="text" aria-label="Close chat" icon={<CloseOutlined />} onClick={onClose} />
        </Space>
      </header>
      {!status?.connected || statusError ? (
        <div className="cliq-disconnected">
          <CommentOutlined className="fv2-cliqdrawer-0f8d83e552" />
          <h3>Connect Zoho Cliq</h3>
          <p>Connect your account to see your chats, channels and people here.</p>
          {statusError && <Alert type="error" message="Cliq connection could not be checked" />}
          <Space direction="vertical">
            {userId && (
              <Link to={`/u/${userId}/connectors`} onClick={onClose}>
                <Button type="primary">Open Connectors</Button>
              </Link>
            )}
            <Button onClick={check} loading={checking}>
              Check connection
            </Button>
          </Space>
        </div>
      ) : selected ? (
        <Conversation
          key={chatId(selected)}
          conversation={selected}
          onBack={() => setSelected(null)}
        />
      ) : (
        <>
          <div className="cliq-search">
            <Input
              ref={searchRef}
              aria-label="Search Cliq"
              prefix={<SearchOutlined />}
              placeholder="Search (Ctrl + Space)"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              allowClear
              suffix={
                <Tooltip title="Refresh">
                  <Button
                    type="text"
                    size="small"
                    aria-label="Refresh Cliq"
                    icon={<ReloadOutlined />}
                    loading={current.isFetching}
                    onClick={current.refetch}
                  />
                </Tooltip>
              }
            />
          </div>
          <div className="cliq-section-title">
            {sections.find((item) => item.key === section)?.label}
          </div>
          {section === 'chats' && (
            <Segmented
              className="cliq-filters"
              block
              options={['Recent', 'Unread']}
              value={filter}
              onChange={setFilter}
            />
          )}
          <div className="cliq-chat-list">
            {section === 'chats' &&
              filter === 'Unread' &&
              !hasUnreadCounts &&
              !chats.isFetching &&
              !chats.error && (
                <Alert
                  type="info"
                  message="Cliq has not provided unread counts. Open full Cliq to check unread conversations."
                />
              )}
            {current.error ? (
              <Alert type="error" message={current.error?.data?.message || 'Could not load Cliq'} />
            ) : current.isLoading ? (
              <Loader className="fv2-cliqdrawer-be92f20e06" />
            ) : !list.length ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  search
                    ? 'No results'
                    : section === 'pins'
                      ? 'No pinned chats'
                      : filter === 'Unread' && section === 'chats'
                        ? 'No unread chats'
                        : 'Nothing here yet'
                }
              />
            ) : (
              list.map((item) => (
                <button
                  type="button"
                  className="cliq-chat-row"
                  key={chatId(item) || item.user_id}
                  onClick={() => {
                    if (section === 'people' || !chatId(item))
                      window.open(webUrl, '_blank', 'noopener,noreferrer');
                    else setSelected(item);
                  }}
                >
                  <Avatar size={36} className="cliq-avatar">
                    {initials(chatName(item))}
                  </Avatar>
                  <span className="cliq-chat-copy">
                    <strong>{chatName(item)}</strong>
                    <span>
                      {section === 'people'
                        ? item.email_id || item.email || 'Open in Cliq'
                        : preview(item)}
                    </span>
                  </span>
                  <Badge count={unread(item)} size="small" />
                </button>
              ))
            )}
            {list.length >= 100 && (
              <a href={webUrl} target="_blank" rel="noreferrer" className="cliq-more">
                Open Cliq to see all results
              </a>
            )}
          </div>
          <Tooltip title="Start a conversation in Cliq">
            <Button
              className="cliq-new-chat"
              shape="circle"
              icon={<PlusOutlined />}
              aria-label="New Cliq conversation"
              href={webUrl}
              target="_blank"
              rel="noreferrer"
            />
          </Tooltip>
        </>
      )}
      <nav className="cliq-bottom" aria-label="Cliq sections">
        {sections.map((item) => (
          <button
            type="button"
            key={item.key}
            className={section === item.key && !selected ? 'is-active' : ''}
            onClick={() => {
              setSection(item.key);
              setSelected(null);
              setSearch('');
            }}
            aria-pressed={section === item.key && !selected}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </Drawer>
  );
}
