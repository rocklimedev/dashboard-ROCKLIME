export const rows = (response, key) => {
  const result = response?.[key] || response?.data?.[key] || response?.data || [];
  return Array.isArray(result) ? result : [];
};
export const chatId = chat => String(chat.chat_id || chat.id || "");
export const chatName = chat => chat.name || chat.title || chat.display_name || "Conversation";
export const preview = chat => chat.last_message_info?.text || chat.last_message?.content?.text || chat.description || "Tap to open conversation";
export const unread = chat => Number(chat.unread_count || chat.unread_message_count || 0);
export const initials = name => String(name).split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
