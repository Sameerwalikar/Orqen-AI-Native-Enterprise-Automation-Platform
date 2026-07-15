const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface AgentConfig {
  type?: 'llm' | 'custom';
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  collectionId?: string; // RAG: Vector collection ID
  ragLimit?: number; // Number of results to include (default: 5)
  ragMinScore?: number; // Minimum similarity score (default: 0.5)
  [key: string]: any;
}

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  version: string;
  userId: number;
  organizationId: string | null;
  config: AgentConfig;
  code: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    executions: number;
  };
}

export interface AgentExecution {
  id: string;
  agentId: string;
  userId: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  input: any;
  output: any;
  error: string | null;
  logs: string | null;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
}

export interface CreateAgentData {
  name: string;
  description?: string;
  config?: AgentConfig;
  code?: string;
  organizationId?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}

export interface UpdateAgentData {
  name?: string;
  description?: string;
  config?: AgentConfig;
  code?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}

export interface ExecuteAgentData {
  input?: any;
}

export interface AgentsResponse {
  success: boolean;
  message?: string;
  data: {
    agents: Agent[];
  };
}

export interface AgentResponse {
  success: boolean;
  message?: string;
  data: {
    agent: Agent;
  };
}

export interface ExecutionsResponse {
  success: boolean;
  message?: string;
  data: {
    executions: AgentExecution[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

class AgentsAPI {
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Request failed');
    }

    return result;
  }

  async getAgents(params?: {
    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    organizationId?: string;
  }): Promise<AgentsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.organizationId) queryParams.append('organizationId', params.organizationId);

    const queryString = queryParams.toString();
    const endpoint = `/api/agents${queryString ? `?${queryString}` : ''}`;

    return this.request<AgentsResponse>(endpoint, {
      method: 'GET',
    });
  }

  async getAgent(id: string): Promise<AgentResponse> {
    return this.request<AgentResponse>(`/api/agents/${id}`, {
      method: 'GET',
    });
  }

  async createAgent(data: CreateAgentData): Promise<AgentResponse> {
    return this.request<AgentResponse>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAgent(id: string, data: UpdateAgentData): Promise<AgentResponse> {
    return this.request<AgentResponse>(`/api/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAgent(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/agents/${id}`, {
      method: 'DELETE',
    });
  }

  async executeAgent(id: string, data: ExecuteAgentData = {}): Promise<{
    success: boolean;
    message: string;
    data: { execution: AgentExecution };
  }> {
    return this.request<{
      success: boolean;
      message: string;
      data: { execution: AgentExecution };
    }>(`/api/agents/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAgentExecutions(
    id: string,
    params?: {
      limit?: number;
      offset?: number;
      status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    }
  ): Promise<ExecutionsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/api/agents/${id}/executions${queryString ? `?${queryString}` : ''}`;

    return this.request<ExecutionsResponse>(endpoint, {
      method: 'GET',
    });
  }
}

export const agentsAPI = new AgentsAPI();

