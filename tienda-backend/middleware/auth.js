exports.requireAuth = (req, res, next) => {
  if (req.session && req.session.usuario) {
    return next();
  }
  res.status(401).json({ error: 'No autenticado' });
};
