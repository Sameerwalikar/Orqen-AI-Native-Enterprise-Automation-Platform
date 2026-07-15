const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface Webhook {
  id: string;
  name: string;
  resourceType: 'workflow' | 'pipeline';
  resourceId: string;
  userId: number;
  organizationId: string | null;
  url: string;
  secret: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookData {
  name: string;
  resourceType: 'workflow' | 'pipeline';
  resourceId: string;
  organizationId?: string;
}

export interface UpdateWebhookData {
  name?: string;
  enabled?: boolean;
  regenerateSecret?: boolean;
}

export interface WebhooksResponse {
  success: boolean;
  message?: string;
  data?: {
    webhooks: Webhook[];
    webhook: Webhook;
  };
}

class WebhooksAPI {
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    method: string,
    path: string,
    data?: any
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/webhooks${path}`, {
      method,
      headers,
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    });

    const result: T = await response.json();

    if (!response.ok) {
      throw new Error((result as any).message || `API request failed: ${response.statusText}`);
    }

    return result;
  }

  async getWebhooks(
    resourceType?: 'workflow' | 'pipeline',
    resourceId?: string
  ): Promise<WebhooksResponse> {
    const params = new URLSearchParams();
    if (resourceType) params.append('resourceType', resourceType);
    if (resourceId) params.append('resourceId', resourceId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<WebhooksResponse>('GET', query);
  }

  async getWebhook(id: string): Promise<WebhooksResponse> {
    return this.request<WebhooksResponse>('GET', `/${id}`);
  }

  async createWebhook(data: CreateWebhookData): Promise<WebhooksResponse> {
    return this.request<WebhooksResponse>('POST', '/', data);
  }

  async updateWebhook(id: string, data: UpdateWebhookData): Promise<WebhooksResponse> {
    return this.request<WebhooksResponse>('PUT', `/${id}`, data);
  }

  async deleteWebhook(id: string): Promise<WebhooksResponse> {
    return this.request<WebhooksResponse>('DELETE', `/${id}`);
  }
}

export const webhooksAPI = new WebhooksAPI();

