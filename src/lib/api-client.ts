type RequestConfig = {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  params?: Record<string, string>;
  headers?: Record<string, string>;
};

type ApiResponse<T> = {
  data: T;
  error?: string;
  status: number;
};

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = "/api/v1") {
    this.baseURL = baseURL;
  }

  private buildURL(endpoint: string, params?: Record<string, string>): string {
    const url = `${this.baseURL}${endpoint}`;
    if (!params) return url;

    const searchParams = new URLSearchParams(params);
    return `${url}?${searchParams.toString()}`;
  }

  async request<T = any>(config: RequestConfig): Promise<T> {
    const { endpoint, method = "GET", body, params, headers = {} } = config;

    const url = this.buildURL(endpoint, params);

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      credentials: "include", // Include cookies for authentication
    };

    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  // Convenience methods
  get<T = any>(endpoint: string, params?: Record<string, string>) {
    return this.request<T>({ endpoint, method: "GET", params });
  }

  post<T = any>(endpoint: string, body?: any) {
    return this.request<T>({ endpoint, method: "POST", body });
  }

  put<T = any>(endpoint: string, body?: any) {
    return this.request<T>({ endpoint, method: "PUT", body });
  }

  patch<T = any>(endpoint: string, body?: any) {
    return this.request<T>({ endpoint, method: "PATCH", body });
  }

  delete<T = any>(endpoint: string) {
    return this.request<T>({ endpoint, method: "DELETE" });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
