const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function request(path, { method = "GET", body, headers } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {})
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined
    });
  } catch (cause) {
    const err = new Error("API network error");
    err.code = "network_error";
    err.cause = cause;
    throw err;
  }

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!res.ok) {
    const err = new Error("API error");
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  del: (path) => request(path, { method: "DELETE" })
};
