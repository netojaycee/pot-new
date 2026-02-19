export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface EndpointConfig {
  path: string;
  method: HttpMethod;
  cache?: boolean; // Whether to use TanStack Query caching
}

export const endpoints = {
  // Products
  products: {
    list: { path: "/products", method: "GET", cache: true } as EndpointConfig,
    byId: (id: string) => ({ path: `/products/${id}`, method: "GET", cache: true } as EndpointConfig),
    bySlug: (slug: string) => ({ path: `/products/slug/${slug}`, method: "GET", cache: true } as EndpointConfig),
    create: { path: "/products", method: "POST", cache: false } as EndpointConfig,
    update: (id: string) => ({ path: `/products/${id}`, method: "PATCH", cache: false } as EndpointConfig),
    delete: (id: string) => ({ path: `/products/${id}`, method: "DELETE", cache: false } as EndpointConfig),
  },

  // Categories
  categories: {
    list: { path: "/categories", method: "GET", cache: true } as EndpointConfig,
    byId: (id: string) => ({ path: `/categories/${id}`, method: "GET", cache: true } as EndpointConfig),
    bySlug: (slug: string) => ({ path: `/categories/slug/${slug}`, method: "GET", cache: true } as EndpointConfig),
    create: { path: "/categories", method: "POST", cache: false } as EndpointConfig,
    update: (id: string) => ({ path: `/categories/${id}`, method: "PATCH", cache: false } as EndpointConfig),
    delete: (id: string) => ({ path: `/categories/${id}`, method: "DELETE", cache: false } as EndpointConfig),
  },

  // Cart
  cart: {
    get: { path: "/cart", method: "GET", cache: true } as EndpointConfig,
    add: { path: "/cart", method: "POST", cache: false } as EndpointConfig,
    updateItem: (itemId: string) => ({ path: `/cart/${itemId}`, method: "PATCH", cache: false } as EndpointConfig),
    removeItem: (itemId: string) => ({ path: `/cart/${itemId}`, method: "DELETE", cache: false } as EndpointConfig),
    clear: { path: "/cart/clear", method: "DELETE", cache: false } as EndpointConfig,
  },

  // Orders
  orders: {
    list: { path: "/orders", method: "GET", cache: true } as EndpointConfig,
    byId: (orderId: string) => ({ path: `/orders/${orderId}`, method: "GET", cache: true } as EndpointConfig),
    create: { path: "/orders", method: "POST", cache: false } as EndpointConfig,
  },

  // Auth
  auth: {
    login: { path: "/auth/login", method: "POST", cache: false } as EndpointConfig,
    register: { path: "/auth/register", method: "POST", cache: false } as EndpointConfig,
    logout: { path: "/auth/logout", method: "POST", cache: false } as EndpointConfig,
    whoami: { path: "/auth/whoami", method: "GET", cache: true } as EndpointConfig,
  },
} as const;

// Query keys factory for TanStack Query
export const queryKeys = {
  products: {
    all: ["products"] as const,
    lists: () => [...queryKeys.products.all, "list"] as const,
    list: (filters?: any) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    bySlug: (slug: string) => [...queryKeys.products.all, "slug", slug] as const,
  },
  categories: {
    all: ["categories"] as const,
    lists: () => [...queryKeys.categories.all, "list"] as const,
    list: (filters?: any) => [...queryKeys.categories.lists(), filters] as const,
    details: () => [...queryKeys.categories.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
    bySlug: (slug: string) => [...queryKeys.categories.all, "slug", slug] as const,
  },
  cart: {
    all: ["cart"] as const,
    current: () => [...queryKeys.cart.all, "current"] as const,
  },
  orders: {
    all: ["orders"] as const,
    lists: () => [...queryKeys.orders.all, "list"] as const,
    details: () => [...queryKeys.orders.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },
  auth: {
    user: ["auth", "user"] as const,
  },
} as const;
