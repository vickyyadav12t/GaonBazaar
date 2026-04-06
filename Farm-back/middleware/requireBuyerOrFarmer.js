/** After auth — buyers and farmers may proceed (not admin-only flows). */
module.exports = function requireBuyerOrFarmer(req, res, next) {
  const r = req.user?.role;
  if (r !== "farmer" && r !== "buyer") {
    return res.status(403).json({
      message: "Only buyers and farmers can use this feature.",
    });
  }
  next();
};
