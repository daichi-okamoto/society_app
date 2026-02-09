export function getSession() {
  // TODO: replace with real session state
  return { user: null, role: "guest" };
}

export function requireAuth() {
  const session = getSession();
  return session.user != null;
}

export function requireAdmin() {
  const session = getSession();
  return session.user != null && session.role === "admin";
}
