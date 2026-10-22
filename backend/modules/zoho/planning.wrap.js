module.exports = (fn) => async (req, res) => {
  try {
    res.json(await fn(req));
  } catch (error) {
    res
      .status(error.status || 502)
      .json({ message: error.status ? error.message : 'Could not reach Zoho.' });
  }
};
