module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    gasUrl: process.env.GAS_WEBAPP_URL || ''
  });
};
