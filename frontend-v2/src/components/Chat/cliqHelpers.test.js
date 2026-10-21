import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rows, chatId, chatName, preview, unread, initials } from './cliqHelpers.js';

test('Cliq drawer reads real API lists and conversation metadata', () => {
  const chat = {
    chat_id: '2230748224630350194',
    name: 'Ryan West',
    pinned: true,
    last_message_info: { text: 'Hello team' },
    unread_count: 2,
  };
  assert.deepEqual(rows({ chats: [chat] }, 'chats'), [chat]);
  assert.deepEqual(rows({ data: [{ id: 'message' }] }, 'messages'), [{ id: 'message' }]);
  assert.deepEqual(rows({ data: { channels: [chat] } }, 'channels'), [chat]);
  assert.equal(chatId(chat), chat.chat_id);
  assert.equal(chatName(chat), 'Ryan West');
  assert.equal(preview(chat), 'Hello team');
  assert.equal(unread(chat), 2);
  assert.equal(initials(chatName(chat)), 'RW');
  assert.deepEqual(rows(undefined, 'chats'), []);
});
