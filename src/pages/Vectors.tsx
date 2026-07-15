import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Loader2,
  Database,
  Trash2,
  Upload,
  FileText,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  vectorsAPI,
  type Collection,
  type CreateCollectionData,
  type SearchResult,
} from '@/lib/api/vectors';
import { toast } from '@/hooks/use-toast';

const Vectors = () => {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddVectorsDialogOpen, setIsAddVectorsDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addVectorsText, setAddVectorsText] = useState('');
  const [activeTab, setActiveTab] = useState('collections');

  const [createFormData, setCreateFormData] = useState<CreateCollectionData>({
    name: '',
    description: '',
    distance: 'COSINE',
  });

  // Fetch collections
  const {
    data: collectionsData,
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useQuery({
    queryKey: ['collections'],
    queryFn: () => vectorsAPI.getCollections(),
    enabled: !authLoading && !!user,
  });

  // Create collection mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCollectionData) => vectorsAPI.createCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setIsCreateDialogOpen(false);
      setCreateFormData({
        name: '',
        description: '',
        distance: 'COSINE',
      });
      toast({
        title: 'Success',
        description: 'Collection created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create collection',
        variant: 'destructive',
      });
    },
  });

  // Delete collection mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => vectorsAPI.deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast({
        title: 'Success',
        description: 'Collection deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete collection',
        variant: 'destructive',
      });
    },
  });

  // Add vectors mutation
  const addVectorsMutation = useMutation({
    mutationFn: ({ collectionId, texts }: { collectionId: string; texts: string[] }) =>
      vectorsAPI.addVectors(collectionId, { texts }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setIsAddVectorsDialogOpen(false);
      setAddVectorsText('');
      setSelectedCollection(null);
      toast({
        title: 'Success',
        description: 'Vectors added successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add vectors',
        variant: 'destructive',
      });
    },
  });

  const handleCreateCollection = () => {
    if (!createFormData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Collection name is required',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(createFormData);
  };

  const handleDeleteCollection = (id: string) => {
    if (window.confirm('Are you sure you want to delete this collection? All vectors will be deleted.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSearch = async () => {
    if (!selectedCollection || !searchQuery.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please select a collection and enter a search query',
        variant: 'destructive',
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await vectorsAPI.searchVectors(selectedCollection.id, {
        query: searchQuery,
        limit: 10,
        minScore: 0,
      });
      setSearchResults(response.data.results);
    } catch (error: any) {
      toast({
        title: 'Search Error',
        description: error.message || 'Failed to search vectors',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddVectors = () => {
    if (!selectedCollection || !addVectorsText.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please select a collection and enter text',
        variant: 'destructive',
      });
      return;
    }

    // Split text by newlines (one vector per line)
    const texts = addVectorsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (texts.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter at least one line of text',
        variant: 'destructive',
      });
      return;
    }

    addVectorsMutation.mutate({
      collectionId: selectedCollection.id,
      texts,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const collections = collectionsData?.data?.collections || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Vector Search</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create collections and search your data with AI-powered vector search
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Collection
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="add">Add Vectors</TabsTrigger>
          </TabsList>

          {/* Collections Tab */}
          <TabsContent value="collections" className="space-y-4">
            {collectionsError && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-destructive">Failed to load collections. Please try again.</p>
                </CardContent>
              </Card>
            )}

            {collectionsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!collectionsLoading && !collectionsError && collections.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Database className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No collections yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first collection to start storing and searching vectors
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Collection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {!collectionsLoading && !collectionsError && collections.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection) => (
                  <Card key={collection.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{collection.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {collection.description || 'No description'}
                          </CardDescription>
                        </div>
                        <Badge
                          className={`${
                            collection.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'
                          } text-white border-0`}
                        >
                          {collection.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Vectors</span>
                          <span className="font-medium">{collection.vectorCount || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Dimensions</span>
                          <span className="font-medium">{collection.dimensions}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Distance</span>
                          <span className="font-medium">{collection.distance}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCollection(collection);
                              setActiveTab('search');
                            }}
                          >
                            <Search className="h-4 w-4 mr-1" />
                            Search
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCollection(collection);
                              setIsAddVectorsDialogOpen(true);
                            }}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCollection(collection.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Vectors</CardTitle>
                <CardDescription>Search for similar content in your collections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Collection</Label>
                  <Select
                    value={selectedCollection?.id || undefined}
                    onValueChange={(value) => {
                      const collection = collections.find((c) => c.id === value);
                      setSelectedCollection(collection || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections
                        .filter((c) => c.status === 'ACTIVE')
                        .map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.name} ({collection.vectorCount || 0} vectors)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Search Query</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter your search query..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isSearching || !selectedCollection}>
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <h3 className="font-semibold">Results ({searchResults.length})</h3>
                    <div className="space-y-2">
                      {searchResults.map((result, index) => (
                        <Card key={result.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium mb-1">
                                  #{index + 1} (Score: {(result.score * 100).toFixed(1)}%)
                                </p>
                                <p className="text-sm text-muted-foreground">{result.text}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Vectors Tab */}
          <TabsContent value="add" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Vectors</CardTitle>
                <CardDescription>
                  Add text content to a collection. Each line will be converted to a vector.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Collection</Label>
                  <Select
                    value={selectedCollection?.id || ''}
                    onValueChange={(value) => {
                      const collection = collections.find((c) => c.id === value);
                      setSelectedCollection(collection || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a collection" />
                    </SelectTrigger>
                    <SelectContent>
                      {collections
                        .filter((c) => c.status === 'ACTIVE')
                        .map((collection) => (
                          <SelectItem key={collection.id} value={collection.id}>
                            {collection.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Text Content (one per line)</Label>
                  <Textarea
                    placeholder="Enter text content, one item per line..."
                    value={addVectorsText}
                    onChange={(e) => setAddVectorsText(e.target.value)}
                    rows={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Each line will be converted to a vector embedding
                  </p>
                </div>

                <Button
                  onClick={handleAddVectors}
                  disabled={addVectorsMutation.isPending || !selectedCollection || !addVectorsText.trim()}
                >
                  {addVectorsMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Add Vectors
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Collection Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Collection</DialogTitle>
              <DialogDescription>
                Create a new vector collection for storing and searching embeddings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="My Collection"
                  value={createFormData.name}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What is this collection for?"
                  value={createFormData.description}
                  onChange={(e) =>
                    setCreateFormData({ ...createFormData, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distance">Distance Metric</Label>
                <Select
                  value={createFormData.distance}
                  onValueChange={(value: 'COSINE' | 'EUCLIDEAN' | 'DOT_PRODUCT') =>
                    setCreateFormData({ ...createFormData, distance: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COSINE">Cosine Similarity</SelectItem>
                    <SelectItem value="EUCLIDEAN">Euclidean Distance</SelectItem>
                    <SelectItem value="DOT_PRODUCT">Dot Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCollection} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Collection'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Vectors;

