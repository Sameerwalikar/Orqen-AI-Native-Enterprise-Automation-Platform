const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  createdAt: string;
  updatedAt: string;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt?: string;
}

export interface OrganizationMember {
  id: string;
  userId: number;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: string;
  user: {
    id: number;
    firstName: string;
    gmail: string;
    avatarUrl: string | null;
  };
}

export interface OrganizationResources {
  agents: number;
  workflows: number;
  pipelines: number;
  connectors: number;
}

export interface CreateOrganizationData {
  name: string;
  slug?: string;
}

export interface UpdateOrganizationData {
  name?: string;
  plan?: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
}

export interface AddMemberData {
  userEmail: string;
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export interface OrganizationsResponse {
  success: boolean;
  message?: string;
  data?: {
    organizations?: Organization[];
    organization?: Organization;
    role?: string;
    members?: OrganizationMember[];
    member?: OrganizationMember;
    resources?: OrganizationResources;
  };
}

class OrganizationsAPI {
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

    const response = await fetch(`${API_BASE_URL}/api/organizations${path}`, {
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

  async getOrganizations(): Promise<OrganizationsResponse> {
    return this.request<OrganizationsResponse>('GET', '/');
  }

  async getOrganization(id: string): Promise<OrganizationsResponse> {
    return this.request<OrganizationsResponse>('GET', `/${id}`);
  }

  async createOrganization(data: CreateOrganizationData): Promise<OrganizationsResponse> {
    return this.request<OrganizationsResponse>('POST', '/', data);
  }

  async updateOrganization(id: string, data: UpdateOrganizationData): Promise<OrganizationsResponse> {
    return this.request<OrganizationsResponse>('PUT', `/${id}`, data);
  }

  async deleteOrganization(id: string): Promise<OrganizationsResponse> {
    return this.request<OrganizationsResponse>('DELETE', `/${id}`);
  }

  async getMembers(id: string): Promise<OrganizationsResponse> {
    return this.request<OrganizationsResponse>('GET', `/${id}/members`);
  }

  async addMember(id: string, data: AddMemberData): Promise<OrganizationsResponse> {
    return this.request<OrganizationsResponse>('POST', `/${id}/members`, data);
  }

  async updateMemberRole(id: string, userId: number, role: string): Promise<OrganizationsResponse> {
    return this.request<OrganizationsResponse>('PUT', `/${id}/members/${userId}`, { role });
  }

  async removeMember(id: string, userId: number): Promise<OrganizationsResponse> {
    return this.request<OrganizationsResponse>('DELETE', `/${id}/members/${userId}`);
  }

  async getResources(id: string): Promise<OrganizationsResponse> {
    return this.request<OrganizationsResponse>('GET', `/${id}/resources`);
  }
}

export const organizationsAPI = new OrganizationsAPI();

