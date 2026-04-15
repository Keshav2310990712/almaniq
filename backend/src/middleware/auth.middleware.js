export function attachDefaultUser(req, _res, next) {
  // No login flow so i am always attaching a default admin user context.
  req.user = { id: "demo-user-id" };
  next();
}
