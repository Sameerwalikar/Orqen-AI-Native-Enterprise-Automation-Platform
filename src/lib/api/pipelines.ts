const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface PipelineStep {
  id: string;
  type: 'connector' | 'transform' | 'filter' | 'aggregate' | 'agent' | 'vector';
  label: string;
  connector?: string;
  config?: any;
  data?: any;
  outputVariable?: string;
}

export interface PipelineDefinition {
  steps: PipelineStep[];
}

export interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  userId: number;
  organizationId: string | null;
  definition: PipelineDefinition;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  schedule: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    runs: number;
  };
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  userId: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  input: any;
  output: any;
  error: string | null;
  logs: string | null;
  recordsProcessed: number | null;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
}

export interface Connector {
  id: string;
  name: string;
  description: string;
  config: Record<string, { type: string; description: string; default?: any }>;
}

export interface CreatePipelineData {
  name: string;
  description?: string;
  definition?: PipelineDefinition;
  organizationId?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  schedule?: string;
}

export interface UpdatePipelineData {
  name?: string;
  description?: string;
  definition?: PipelineDefinition;
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  schedule?: string;
}

export interface PipelinesResponse {
  success: boolean;
  message?: string;
  data: {
    pipelines: Pipeline[];
  };
}

export interface PipelineResponse {
  success: boolean;
  message?: string;
  data: {
    pipeline: Pipeline;
  };
}

export interface RunsResponse {
  success: boolean;
  message?: string;
  data: {
    runs: PipelineRun[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

export interface ConnectorsResponse {
  success: boolean;
  message?: string;
  data: {
    connectors: Connector[];
  };
}

class PipelinesAPI {
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

  // Pipelines
  async getPipelines(params?: {
    status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
    organizationId?: string;
  }): Promise<PipelinesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.organizationId) queryParams.append('organizationId', params.organizationId);

    const queryString = queryParams.toString();
    const endpoint = `/api/pipelines${queryString ? `?${queryString}` : ''}`;

    return this.request<PipelinesResponse>(endpoint, {
      method: 'GET',
    });
  }

  async getPipeline(id: string): Promise<PipelineResponse> {
    return this.request<PipelineResponse>(`/api/pipelines/${id}`, {
      method: 'GET',
    });
  }

  async createPipeline(data: CreatePipelineData): Promise<PipelineResponse> {
    return this.request<PipelineResponse>('/api/pipelines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePipeline(id: string, data: UpdatePipelineData): Promise<PipelineResponse> {
    return this.request<PipelineResponse>(`/api/pipelines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePipeline(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/pipelines/${id}`, {
      method: 'DELETE',
    });
  }

  async executePipeline(id: string, input?: any): Promise<{
    success: boolean;
    message: string;
    data: { execution: PipelineRun };
  }> {
    return this.request<{
      success: boolean;
      message: string;
      data: { execution: PipelineRun };
    }>(`/api/pipelines/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });
  }

  async getPipelineRuns(
    id: string,
    params?: {
      limit?: number;
      offset?: number;
      status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    }
  ): Promise<RunsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const endpoint = `/api/pipelines/${id}/runs${queryString ? `?${queryString}` : ''}`;

    return this.request<RunsResponse>(endpoint, {
      method: 'GET',
    });
  }

  // Connectors
  async getAvailableConnectors(): Promise<ConnectorsResponse> {
    return this.request<ConnectorsResponse>('/api/pipelines/connectors/available', {
      method: 'GET',
    });
  }
}

export const pipelinesAPI = new PipelinesAPI();

