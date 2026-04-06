/** After auth — only farmers may proceed */
module.exports = function requireFarmer(req, res, next) {
  if (req.user?.role !== "farmer") {
    return res.status(403).json({
      message: "Only farmers can use this feature",
    });
  }
  next();
};
