import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Database, Loader2 } from 'lucide-react';
import { connectorsAPI } from '@/lib/api/connectors';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function DatabaseExplorer({ connectorId }: { connectorId: string }) {
  const [schema, setSchema] = useState('public');
  const [table, setTable] = useState('');
  const [offset, setOffset] = useState(0);
  const schemas = useQuery({ queryKey: ['schemas', connectorId], queryFn: () => connectorsAPI.getSchemas(connectorId) });
  const tables = useQuery({ queryKey: ['tables', connectorId, schema], queryFn: () => connectorsAPI.getTables(connectorId, schema) });
  const preview = useQuery({ queryKey: ['preview', connectorId, schema, table, offset], queryFn: () => connectorsAPI.previewTable(connectorId, table, { schema, limit: 20, offset }), enabled: Boolean(table) });
  const rows = preview.data?.data?.rows || [];
  const columns = rows[0] ? Object.keys(rows[0]) : [];
  return <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Select value={schema} onValueChange={(value) => { setSchema(value); setTable(''); setOffset(0); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(schemas.data?.data?.schemas || ['public']).map((value: string) => <SelectItem value={value} key={value}>{value}</SelectItem>)}</SelectContent></Select><Select value={table} onValueChange={(value) => { setTable(value); setOffset(0); }}><SelectTrigger><SelectValue placeholder="Select a table" /></SelectTrigger><SelectContent>{(tables.data?.data?.tables || []).map((item: any) => <SelectItem value={item.table_name} key={item.table_name}>{item.table_name} ({item.table_type === 'VIEW' ? 'view' : 'table'})</SelectItem>)}</SelectContent></Select></div>{preview.isLoading && <div className="py-8 flex justify-center"><Loader2 className="animate-spin" /></div>}{table && !preview.isLoading && <><div className="rounded-md border overflow-auto max-h-80"><Table><TableHeader><TableRow>{columns.map((column) => <TableHead key={column}>{column}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.length ? rows.map((row: Record<string, unknown>, index: number) => <TableRow key={index}>{columns.map((column) => <TableCell key={column} className="max-w-48 truncate">{String(row[column] ?? '')}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={1} className="text-muted-foreground">No rows found.</TableCell></TableRow>}</TableBody></Table></div><div className="flex justify-between"><Button size="sm" variant="outline" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 20))}>Previous</Button><span className="text-sm text-muted-foreground">Rows {offset + 1}–{offset + rows.length}</span><Button size="sm" variant="outline" disabled={rows.length < 20} onClick={() => setOffset(offset + 20)}>Next</Button></div></>}</div>;
}
