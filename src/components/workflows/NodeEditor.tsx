import { useEffect, useState } from 'react';
import { useWorkflowBuilderStore } from '@/stores/workflowBuilderStore';
import { useQuery } from '@tanstack/react-query';
import { agentsAPI } from '@/lib/api/agents';
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

export const NodeEditor = () => {
  const selectedNode = useWorkflowBuilderStore((state) => state.selectedNode);
  const updateNode = useWorkflowBuilderStore((state) => state.updateNode);
  const deleteNode = useWorkflowBuilderStore((state) => state.deleteNode);
  const setSelectedNode = useWorkflowBuilderStore((state) => state.setSelectedNode);

  const [nodeData, setNodeData] = useState<any>({});

  // Fetch agents for agent node
  const { data: agentsData } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsAPI.getAgents(),
    enabled: selectedNode?.type === 'agent',
  });

  useEffect(() => {
    if (selectedNode) {
      setNodeData(selectedNode.data || {});
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <Card className="w-80 h-full">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Node Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a node to edit its properties</p>
        </CardContent>
      </Card>
    );
  }

  const handleUpdate = (field: string, value: any) => {
    const updatedData = { ...nodeData, [field]: value };
    setNodeData(updatedData);
    updateNode(selectedNode.id, updatedData);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this node?')) {
      deleteNode(selectedNode.id);
      setSelectedNode(null);
    }
  };

  return (
    <Card className="w-80 h-full overflow-y-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Node Properties</CardTitle>
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
            value={nodeData.label || ''}
            onChange={(e) => handleUpdate('label', e.target.value)}
          />
        </div>

        {/* Agent Node */}
        {selectedNode.type === 'agent' && (
          <div className="space-y-2">
            <Label htmlFor="agentId">Agent</Label>
            <Select
              value={nodeData.agentId || ''}
              onValueChange={(value) => {
                const agent = agentsData?.data?.agents?.find((a: any) => a.id === value);
                handleUpdate('agentId', value);
                handleUpdate('agentName', agent?.name || '');
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

        {/* Condition Node */}
        {selectedNode.type === 'condition' && (
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Textarea
              id="condition"
              placeholder="e.g., input.status === 'active'"
              value={nodeData.condition || ''}
              onChange={(e) => handleUpdate('condition', e.target.value)}
              rows={3}
            />
          </div>
        )}

        {/* Delay Node */}
        {selectedNode.type === 'delay' && (
          <div className="space-y-2">
            <Label htmlFor="delay">Delay (milliseconds)</Label>
            <Input
              id="delay"
              type="number"
              min="0"
              value={nodeData.delay || 1000}
              onChange={(e) => handleUpdate('delay', parseInt(e.target.value) || 1000)}
            />
          </div>
        )}

        {/* Transform Node */}
        {selectedNode.type === 'transform' && (
          <div className="space-y-2">
            <Label htmlFor="transform">Transform (JSON)</Label>
            <Textarea
              id="transform"
              placeholder='{"newField": "$oldField"}'
              value={JSON.stringify(nodeData.transform || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleUpdate('transform', parsed);
                } catch {
                  // Invalid JSON, keep as string for now
                }
              }}
              rows={6}
            />
          </div>
        )}

        {/* Node Info */}
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

