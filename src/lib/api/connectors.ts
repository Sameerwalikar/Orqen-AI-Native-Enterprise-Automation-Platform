const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface ConnectorType {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiresAuth: boolean;
  requiresOAuth?: boolean;
  oauthProvider?: string;
  config: Record<string, any>;
}

export interface Connector {
  id: string;
  name: string;
  type: string;
  userId: number;
  organizationId: string | null;
  config: any;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  lastTested: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConnectorData {
  name: string;
  type: string;
  config: any;
  organizationId?: string;
}

export interface UpdateConnectorData {
  name?: string;
  config?: any;
  status?: 'ACTIVE' | 'INACTIVE' | 'ERROR';
}

export interface ConnectorsResponse {
  success: boolean;
  message?: string;
  data?: {
    connectors: Connector[];
    connector: Connector;
    types: ConnectorType[];
  };
}

export interface TestConnectorResponse {
  success: boolean;
  data?: {
    success: boolean;
    message?: string;
  };
}

class ConnectorsAPI {
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

    const response = await fetch(`${API_BASE_URL}/api/connectors${path}`, {
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

  async getConnectorTypes(): Promise<ConnectorsResponse> {
    return this.request<ConnectorsResponse>('GET', '/types');
  }

  async getConnectors(): Promise<ConnectorsResponse> {
    return this.request<ConnectorsResponse>('GET', '/');
  }

  async getConnector(id: string): Promise<ConnectorsResponse> {
    return this.request<ConnectorsResponse>('GET', `/${id}`);
  }

  async createConnector(data: CreateConnectorData): Promise<ConnectorsResponse> {
    return this.request<ConnectorsResponse>('POST', '/', data);
  }

  async updateConnector(id: string, data: UpdateConnectorData): Promise<ConnectorsResponse> {
    return this.request<ConnectorsResponse>('PUT', `/${id}`, data);
  }

  async deleteConnector(id: string): Promise<ConnectorsResponse> {
    return this.request<ConnectorsResponse>('DELETE', `/${id}`);
  }

  async testConnector(id: string): Promise<TestConnectorResponse> {
    return this.request<TestConnectorResponse>('POST', `/${id}/test`);
  }

  async getTables(id: string, schema = 'public'): Promise<any> {
    return this.request<any>('GET', `/${id}/explorer/tables?schema=${encodeURIComponent(schema)}`);
  }

  async getSchemas(id: string): Promise<any> {
    return this.request<any>('GET', `/${id}/explorer/schemas`);
  }

  async getTableMetadata(id: string, table: string, schema = 'public'): Promise<any> {
    return this.request<any>('GET', `/${id}/explorer/tables/${encodeURIComponent(table)}/metadata?schema=${encodeURIComponent(schema)}`);
  }

  async previewTable(id: string, table: string, options: Record<string, string | number> = {}): Promise<any> {
    const query = new URLSearchParams({ schema: String(options.schema || 'public'), limit: String(options.limit || 20), ...(options.sortBy ? { sortBy: String(options.sortBy) } : {}), ...(options.sortDirection ? { sortDirection: String(options.sortDirection) } : {}) });
    return this.request<any>('GET', `/${id}/explorer/tables/${encodeURIComponent(table)}/preview?${query}`);
  }
}

export const connectorsAPI = new ConnectorsAPI();

