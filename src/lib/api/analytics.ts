const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface AnalyticsOverview {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  totalCost: number;
  totalTokens: number;
  avgDuration: number;
}

export interface UsageTrend {
  date: string;
  agentsExecuted: number;
  workflowsExecuted: number;
  pipelinesExecuted: number;
  apiCalls: number;
  tokensUsed: number;
  cost: number;
}

export interface ResourceBreakdown {
  agents: number;
  workflows: number;
  pipelines: number;
  total: number;
}

export interface ErrorAnalysis {
  errorType: string;
  count: number;
}

export interface ExecutionMetric {
  id: string;
  resourceType: string;
  resourceId: string;
  executionId: string;
  userId: number;
  organizationId: string | null;
  duration: number;
  memoryUsage: number | null;
  cpuUsage: number | null;
  apiCalls: number;
  tokensUsed: number | null;
  cost: number | null;
  status: string;
  errorType: string | null;
  createdAt: string;
}

export interface AnalyticsResponse {
  success: boolean;
  message?: string;
  data?: {
    overview?: AnalyticsOverview;
    trends?: UsageTrend[];
    breakdown?: ResourceBreakdown;
    errors?: ErrorAnalysis[];
    metrics?: ExecutionMetric[];
  };
}

class AnalyticsAPI {
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

    const params = new URLSearchParams();
    if (data) {
      Object.keys(data).forEach((key) => {
        if (data[key] !== undefined && data[key] !== null) {
          params.append(key, data[key].toString());
        }
      });
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/api/analytics${path}${query}`, {
      method,
      headers,
      credentials: 'include',
    });

    const result: T = await response.json();

    if (!response.ok) {
      throw new Error((result as any).message || `API request failed: ${response.statusText}`);
    }

    return result;
  }

  async getOverview(
    organizationId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsResponse> {
    return this.request<AnalyticsResponse>('GET', '/overview', {
      organizationId,
      startDate,
      endDate,
    });
  }

  async getTrends(organizationId?: string, days = 30): Promise<AnalyticsResponse> {
    return this.request<AnalyticsResponse>('GET', '/trends', { organizationId, days });
  }

  async getBreakdown(
    organizationId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsResponse> {
    return this.request<AnalyticsResponse>('GET', '/breakdown', {
      organizationId,
      startDate,
      endDate,
    });
  }

  async getErrors(
    organizationId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<AnalyticsResponse> {
    return this.request<AnalyticsResponse>('GET', '/errors', {
      organizationId,
      startDate,
      endDate,
    });
  }

  async getMetrics(
    organizationId?: string,
    resourceType?: string,
    resourceId?: string,
    startDate?: string,
    endDate?: string,
    limit = 100
  ): Promise<AnalyticsResponse> {
    return this.request<AnalyticsResponse>('GET', '/metrics', {
      organizationId,
      resourceType,
      resourceId,
      startDate,
      endDate,
      limit,
    });
  }
}

export const analyticsAPI = new AnalyticsAPI();

