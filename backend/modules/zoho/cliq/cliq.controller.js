const cliq = require('./cliq.service');

const wrap = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

exports.getStatus = wrap((req) => cliq.status(req.user.userId));

exports.getChats = wrap((req) =>
  cliq.request(req.user.userId, '/chats', {
    params: { limit: 100, ...(req.query.before ? { modified_before: req.query.before } : {}) },
  }),
);

exports.getChannels = wrap((req) =>
  cliq.request(req.user.userId, '/channels', {
    params: { joined: true, limit: 100, ...(req.query.next ? { next_token: req.query.next } : {}) },
  }),
);

exports.getPeople = wrap((req) =>
  cliq.request(req.user.userId, '/users', {
    params: { limit: 100, ...(req.query.next ? { next_token: req.query.next } : {}) },
  }),
);

exports.getMessages = wrap((req) =>
  cliq.request(req.user.userId, `/chats/${encodeURIComponent(req.params.id)}/messages`, {
    params: { limit: 50, ...(req.query.before ? { before: req.query.before } : {}) },
  }),
);

exports.sendMessage = wrap((req) => {
  const text = String(req.body?.text || '').trim();
  if (!text || text.length > 5000) {
    throw Object.assign(new Error('Enter a message of 1–5000 characters.'), { status: 400 });
  }
  return cliq.request(req.user.userId, `/chats/${encodeURIComponent(req.params.id)}/message`, {
    method: 'POST',
    data: { text },
  });
});
