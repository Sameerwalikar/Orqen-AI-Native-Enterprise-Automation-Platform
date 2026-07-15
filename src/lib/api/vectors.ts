const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  userId: number;
  organizationId: string | null;
  dimensions: number;
  distance: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT';
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  vectorCount: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    vectors: number;
  };
}

export interface Vector {
  id: string;
  collectionId: string;
  text: string | null;
  metadata: any;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  text: string | null;
  metadata: any;
  score: number;
  createdAt: string;
}

export interface CreateCollectionData {
  name: string;
  description?: string;
  dimensions?: number;
  distance?: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT';
  organizationId?: string;
}

export interface UpdateCollectionData {
  name?: string;
  description?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
}

export interface AddVectorsData {
  texts: string[];
  metadata?: any[];
}

export interface SearchVectorsData {
  query: string;
  limit?: number;
  minScore?: number;
}

export interface CollectionsResponse {
  success: boolean;
  message?: string;
  data: {
    collections: Collection[];
  };
}

export interface CollectionResponse {
  success: boolean;
  message?: string;
  data: {
    collection: Collection;
  };
}

export interface VectorsResponse {
  success: boolean;
  message?: string;
  data: {
    vectors: Vector[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

export interface SearchResponse {
  success: boolean;
  message?: string;
  data: {
    results: SearchResult[];
    query: string;
    collectionId: string;
  };
}

class VectorsAPI {
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

  // Collections
  async getCollections(params?: {
    status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
    organizationId?: string;
  }): Promise<CollectionsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.organizationId) queryParams.append('organizationId', params.organizationId);

    const queryString = queryParams.toString();
    const endpoint = `/api/vectors/collections${queryString ? `?${queryString}` : ''}`;

    return this.request<CollectionsResponse>(endpoint, {
      method: 'GET',
    });
  }

  async getCollection(id: string): Promise<CollectionResponse> {
    return this.request<CollectionResponse>(`/api/vectors/collections/${id}`, {
      method: 'GET',
    });
  }

  async createCollection(data: CreateCollectionData): Promise<CollectionResponse> {
    return this.request<CollectionResponse>('/api/vectors/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCollection(id: string, data: UpdateCollectionData): Promise<CollectionResponse> {
    return this.request<CollectionResponse>(`/api/vectors/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCollection(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/vectors/collections/${id}`, {
      method: 'DELETE',
    });
  }

  // Vectors
  async addVectors(collectionId: string, data: AddVectorsData): Promise<{
    success: boolean;
    message: string;
    data: { vectors: Vector[] };
  }> {
    return this.request<{
      success: boolean;
      message: string;
      data: { vectors: Vector[] };
    }>(`/api/vectors/collections/${collectionId}/vectors`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async searchVectors(collectionId: string, data: SearchVectorsData): Promise<SearchResponse> {
    return this.request<SearchResponse>(`/api/vectors/collections/${collectionId}/search`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getVectors(
    collectionId: string,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<VectorsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/api/vectors/collections/${collectionId}/vectors${queryString ? `?${queryString}` : ''}`;

    return this.request<VectorsResponse>(endpoint, {
      method: 'GET',
    });
  }
}

export const vectorsAPI = new VectorsAPI();

