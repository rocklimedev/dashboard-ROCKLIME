function clientUrl(env = process.env) {
  const configured = env.CLIENT_URL || env.APP_URL;
  const fallback =
    env.NODE_ENV === 'production' ? 'https://erp.cmtradingco.com' : 'http://localhost:5173';
  const url = new URL(configured || fallback);
  if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.port === '3000') {
    url.port = '5173';
  }
  return url.toString().replace(/\/$/, '');
}

module.exports = clientUrl;
