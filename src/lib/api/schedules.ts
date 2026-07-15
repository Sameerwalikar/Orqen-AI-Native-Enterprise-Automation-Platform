const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface Schedule {
  id: string;
  name: string;
  resourceType: 'workflow' | 'pipeline';
  resourceId: string;
  userId: number;
  organizationId: string | null;
  cronExpression: string;
  timezone: string;
  enabled: boolean;
  lastRun: string | null;
  nextRun: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleData {
  name: string;
  resourceType: 'workflow' | 'pipeline';
  resourceId: string;
  cronExpression: string;
  timezone?: string;
  enabled?: boolean;
  organizationId?: string;
}

export interface UpdateScheduleData {
  name?: string;
  cronExpression?: string;
  timezone?: string;
  enabled?: boolean;
}

export interface SchedulesResponse {
  success: boolean;
  message?: string;
  data?: {
    schedules: Schedule[];
    schedule: Schedule;
  };
}

class SchedulesAPI {
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

    const response = await fetch(`${API_BASE_URL}/api/schedules${path}`, {
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

  async getSchedules(
    resourceType?: 'workflow' | 'pipeline',
    resourceId?: string
  ): Promise<SchedulesResponse> {
    const params = new URLSearchParams();
    if (resourceType) params.append('resourceType', resourceType);
    if (resourceId) params.append('resourceId', resourceId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<SchedulesResponse>('GET', query);
  }

  async getSchedule(id: string): Promise<SchedulesResponse> {
    return this.request<SchedulesResponse>('GET', `/${id}`);
  }

  async createSchedule(data: CreateScheduleData): Promise<SchedulesResponse> {
    return this.request<SchedulesResponse>('POST', '/', data);
  }

  async updateSchedule(id: string, data: UpdateScheduleData): Promise<SchedulesResponse> {
    return this.request<SchedulesResponse>('PUT', `/${id}`, data);
  }

  async deleteSchedule(id: string): Promise<SchedulesResponse> {
    return this.request<SchedulesResponse>('DELETE', `/${id}`);
  }
}

export const schedulesAPI = new SchedulesAPI();

