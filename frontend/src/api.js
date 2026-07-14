// Intercepta fetch para:
//  1) añadir el token JWT (Authorization) a las llamadas a /api
//  2) cerrar sesión automáticamente si el token es inválido/expiró (401)
const originalFetch = window.fetch.bind(window);

window.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input?.url || "";
  const isApi = typeof url === "string" && url.startsWith("/api");

  if (isApi) {
    const token = localStorage.getItem("eventflow_token");
    if (token) {
      init = {
        ...init,
        headers: {
          ...(init.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      };
    }
  }

  const res = await originalFetch(input, init);

  if (isApi && res.status === 401) {
    localStorage.removeItem("eventflow_token");
    localStorage.removeItem("eventflow_user");
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }

  return res;
};
