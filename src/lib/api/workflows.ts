const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowNode {
  id: string;
  type: 'start' | 'end' | 'agent' | 'condition' | 'delay' | 'transform';
  label: string;
  position: { x: number; y: number };
  data?: any;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  userId: number;
  organizationId: string | null;
  definition: WorkflowDefinition;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  version: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    executions: number;
    triggers: number;
  };
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
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

export interface WorkflowTrigger {
  id: string;
  workflowId: string;
  type: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK' | 'EVENT';
  config: any;
  enabled: boolean;
  lastTriggered: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowData {
  name: string;
  description?: string;
  definition?: WorkflowDefinition;
  organizationId?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
}

export interface UpdateWorkflowData {
  name?: string;
  description?: string;
  definition?: WorkflowDefinition;
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
}

export interface CreateTriggerData {
  type: 'MANUAL' | 'SCHEDULE' | 'WEBHOOK' | 'EVENT';
  config?: any;
  enabled?: boolean;
}

export interface WorkflowsResponse {
  success: boolean;
  message?: string;
  data: {
    workflows: Workflow[];
  };
}

export interface WorkflowResponse {
  success: boolean;
  message?: string;
  data: {
    workflow: Workflow;
  };
}

export interface ExecutionsResponse {
  success: boolean;
  message?: string;
  data: {
    executions: WorkflowExecution[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

class WorkflowsAPI {
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

  // Workflows
  async getWorkflows(params?: {
    status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
    organizationId?: string;
  }): Promise<WorkflowsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.organizationId) queryParams.append('organizationId', params.organizationId);

    const queryString = queryParams.toString();
    const endpoint = `/api/workflows${queryString ? `?${queryString}` : ''}`;

    return this.request<WorkflowsResponse>(endpoint, {
      method: 'GET',
    });
  }

  async getWorkflow(id: string): Promise<WorkflowResponse> {
    return this.request<WorkflowResponse>(`/api/workflows/${id}`, {
      method: 'GET',
    });
  }

  async createWorkflow(data: CreateWorkflowData): Promise<WorkflowResponse> {
    return this.request<WorkflowResponse>('/api/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkflow(id: string, data: UpdateWorkflowData): Promise<WorkflowResponse> {
    return this.request<WorkflowResponse>(`/api/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkflow(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async executeWorkflow(id: string, input?: any): Promise<{
    success: boolean;
    message: string;
    data: { execution: WorkflowExecution };
  }> {
    return this.request<{
      success: boolean;
      message: string;
      data: { execution: WorkflowExecution };
    }>(`/api/workflows/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });
  }

  async getWorkflowExecutions(
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
    const endpoint = `/api/workflows/${id}/executions${queryString ? `?${queryString}` : ''}`;

    return this.request<ExecutionsResponse>(endpoint, {
      method: 'GET',
    });
  }

  // Triggers
  async createTrigger(workflowId: string, data: CreateTriggerData): Promise<{
    success: boolean;
    message: string;
    data: { trigger: WorkflowTrigger };
  }> {
    return this.request<{
      success: boolean;
      message: string;
      data: { trigger: WorkflowTrigger };
    }>(`/api/workflows/${workflowId}/triggers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTrigger(triggerId: string, data: { config?: any; enabled?: boolean }): Promise<{
    success: boolean;
    message: string;
    data: { trigger: WorkflowTrigger };
  }> {
    return this.request<{
      success: boolean;
      message: string;
      data: { trigger: WorkflowTrigger };
    }>(`/api/workflows/triggers/${triggerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTrigger(triggerId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/workflows/triggers/${triggerId}`, {
      method: 'DELETE',
    });
  }
}

export const workflowsAPI = new WorkflowsAPI();

