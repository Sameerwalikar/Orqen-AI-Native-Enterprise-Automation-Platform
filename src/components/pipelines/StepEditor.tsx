import { useEffect, useState } from 'react';
import { usePipelineBuilderStore } from '@/stores/pipelineBuilderStore';
import { useQuery } from '@tanstack/react-query';
import { agentsAPI } from '@/lib/api/agents';
import { vectorsAPI } from '@/lib/api/vectors';
import { pipelinesAPI } from '@/lib/api/pipelines';
import { connectorsAPI } from '@/lib/api/connectors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export const StepEditor = () => {
  const selectedNode = usePipelineBuilderStore((state) => state.selectedNode);
  const updateNode = usePipelineBuilderStore((state) => state.updateNode);
  const deleteNode = usePipelineBuilderStore((state) => state.deleteNode);
  const setSelectedNode = usePipelineBuilderStore((state) => state.setSelectedNode);

  const [stepData, setStepData] = useState<any>({});
  const [configText, setConfigText] = useState('{}');

  // Fetch agents for agent step
  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsAPI.getAgents(),
    enabled: selectedNode?.type === 'agent',
  });

  // Fetch collections for vector step
  const { data: collectionsData } = useQuery({
    queryKey: ['collections'],
    queryFn: () => vectorsAPI.getCollections(),
    enabled: selectedNode?.type === 'vector',
  });

  // Fetch available connectors
  const { data: connectorsData } = useQuery({
    queryKey: ['connectors'],
    queryFn: () => pipelinesAPI.getAvailableConnectors(),
    enabled: selectedNode?.type === 'connector',
  });
  const activeConnector = connectorsData?.data?.connectors?.find((connector: any) => connector.id === stepData.connector);
  const { data: tablesData } = useQuery({
    queryKey: ['connectorTables', stepData.connector],
    queryFn: () => connectorsAPI.getTables(stepData.connector),
    enabled: selectedNode?.type === 'connector' && activeConnector?.type === 'supabase' && !!stepData.connector,
  });

  useEffect(() => {
    if (selectedNode) {
      setStepData(selectedNode.data || {});
      setConfigText(JSON.stringify(selectedNode.data?.config || {}, null, 2));
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <Card className="w-80 h-full">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Step Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a step to edit its properties</p>
        </CardContent>
      </Card>
    );
  }

  const handleUpdate = (fieldOrData: string | Record<string, any>, value?: any) => {
    let updatedData;
    if (typeof fieldOrData === 'string') {
      updatedData = { ...stepData, [fieldOrData]: value };
    } else {
      updatedData = { ...stepData, ...fieldOrData };
    }
    setStepData(updatedData);
    updateNode(selectedNode.id, updatedData);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this step?')) {
      deleteNode(selectedNode.id);
      setSelectedNode(null);
    }
  };

  return (
    <Card className="w-80 h-full overflow-y-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Step Properties</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Label */}
        <div className="space-y-2">
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            value={stepData.label || ''}
            onChange={(e) => handleUpdate('label', e.target.value)}
          />
        </div>

        {/* Connector Step */}
        {selectedNode.type === 'connector' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="connector">Connector</Label>
              <Select
                value={stepData.connector || ''}
                onValueChange={(value) => handleUpdate('connector', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a connector" />
                </SelectTrigger>
                <SelectContent>
                  {connectorsData?.data?.connectors?.map((conn: any) => (
                    <SelectItem key={conn.id} value={conn.id}>
                      {conn.name} ({conn.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeConnector?.type === 'supabase' && <>
              <div className="space-y-2"><Label>Table</Label><Select value={stepData.config?.table || ''} onValueChange={(table) => handleUpdate('config', { ...(stepData.config || {}), table })}><SelectTrigger><SelectValue placeholder="Select a table" /></SelectTrigger><SelectContent>{tablesData?.data?.tables?.map((table: any) => <SelectItem key={table.table_name} value={table.table_name}>{table.table_name}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Sort column</Label><Input value={stepData.config?.sortBy || ''} onChange={(e) => handleUpdate('config', { ...(stepData.config || {}), sortBy: e.target.value })} /></div><div className="space-y-2"><Label>Limit</Label><Input type="number" value={stepData.config?.limit || 20} onChange={(e) => handleUpdate('config', { ...(stepData.config || {}), limit: Number(e.target.value) })} /></div></div>
            </>}
            <div className="space-y-2">
              <Label htmlFor="operation">Operation</Label>
              <Select
                value={stepData.operation || 'read'}
                onValueChange={(value) => handleUpdate('operation', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="write">Write</SelectItem>
                  <SelectItem value="query">Query</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="config">Config (JSON)</Label>
              <Textarea
                id="config"
                placeholder='{"key": "value"}'
                value={configText}
                onChange={(e) => {
                  setConfigText(e.target.value);
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleUpdate('config', parsed);
                  } catch (err) {
                    // Keep draft text editable; save validation handles invalid JSON.
                  }
                }}
                rows={4}
              />
            </div>
          </>
        )}

        {/* Transform Step */}
        {selectedNode.type === 'transform' && (
          <div className="space-y-2">
            <Label htmlFor="transform">Transform (JSON)</Label>
            <Textarea
              id="transform"
              placeholder='{"newField": "$oldField"}'
              value={JSON.stringify(stepData.transform || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleUpdate('transform', parsed);
                } catch (err) {
                  // Don't update if invalid JSON while typing
                }
              }}
              rows={6}
            />
          </div>
        )}

        {/* Filter Step */}
        {selectedNode.type === 'filter' && (
          <div className="space-y-2">
            <Label htmlFor="filter">Filter Expression (JSON)</Label>
            <Textarea
              id="filter"
              placeholder='{"field": "status", "operator": "equals", "value": "active"}'
              value={JSON.stringify(stepData.filter || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleUpdate('filter', parsed);
                } catch (err) {
                  // Don't update if invalid JSON while typing
                }
              }}
              rows={6}
            />
          </div>
        )}

        {/* Aggregate Step */}
        {selectedNode.type === 'aggregate' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="operation">Operation</Label>
              <Select
                value={stepData.aggregate?.operation || 'count'}
                onValueChange={(value) =>
                  handleUpdate('aggregate', { ...stepData.aggregate, operation: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="min">Min</SelectItem>
                  <SelectItem value="max">Max</SelectItem>
                  <SelectItem value="groupBy">Group By</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {stepData.aggregate?.operation !== 'count' && (
              <div className="space-y-2">
                <Label htmlFor="field">Field</Label>
                <Input
                  id="field"
                  value={stepData.aggregate?.field || ''}
                  onChange={(e) =>
                    handleUpdate('aggregate', { ...stepData.aggregate, field: e.target.value })
                  }
                />
              </div>
            )}
          </>
        )}

        {/* Agent Step */}
        {selectedNode.type === 'agent' && (
          <div className="space-y-2">
            <Label htmlFor="agentId">Agent</Label>
            <Select
              value={stepData.agentId || ''}
              onValueChange={(value) => {
                const agent = agentsData?.data?.agents?.find((a: any) => a.id === value);
                handleUpdate({
                  agentId: value,
                  agentName: agent?.name || '',
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agentsData?.data?.agents?.map((agent: any) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Vector Step */}
        {selectedNode.type === 'vector' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="operation">Operation</Label>
              <Select
                value={stepData.operation || 'add'}
                onValueChange={(value) => handleUpdate('operation', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="search">Search</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="collectionId">Collection</Label>
              <Select
                value={stepData.collectionId || ''}
                onValueChange={(value) => handleUpdate('collectionId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a collection" />
                </SelectTrigger>
                <SelectContent>
                  {collectionsData?.data?.collections?.map((collection: any) => (
                    <SelectItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Step Info */}
        <div className="pt-4 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Type: {selectedNode.type}</div>
            <div>ID: {selectedNode.id}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

