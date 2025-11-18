const adminMiddleWare = (req, res, next) => {
  try {
    if (req.user && req.user.role === "ADMIN") {
      return next();
    } else {
      return res.status(403).json({ message: "Access Forbidden: Admins only" });
    }
  } catch (e) {
    res.status(500).json({ message: "Something went wrong", error: e.message });
  }
};

const adminOrStudent = (req, res, next) => {
  try {
    if (req.user.role === "ADMIN" || req.user.role === "STUDENT") {
      return next();
    } else {
      return res.status(403).json({ message: "Access Forbidden" });
    }
  } catch {
    res.status(500).json({ message: "Something went wrong", error: e.message });
  }
};

module.exports = { adminMiddleWare, adminOrStudent };
