const BaseConnector = require('../base/BaseConnector');
const { Client } = require('pg');
const BLOCKED_SQL = /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|call|do|execute)\b/i;
const quoteIdentifier = (value) => `"${String(value).replace(/"/g, '""')}"`;
const connectionError = (error) => {
  const message = String(error.message || '');
  if (/self-signed|certificate|SSL/i.test(message)) return 'SSL certificate validation failed';
  if (/password authentication|authentication failed/i.test(message)) return 'Authentication failed';
  if (/ENOTFOUND|getaddrinfo/i.test(message)) return 'Host not found';
  if (/timeout|ETIMEDOUT/i.test(message)) return 'Database connection timed out';
  if (/does not exist/i.test(message)) return 'Database does not exist';
  if (/ECONNREFUSED|unreachable/i.test(message)) return 'Database unreachable';
  return 'Database connection failed';
};

class RelationalConnector extends BaseConnector {
  connectionOptions() { throw new Error('connectionOptions() must be implemented'); }
  assertReadOnlySql(sql) { const normalized = String(sql || '').trim().replace(/;\s*$/, ''); if (!/^(select|with)\b/i.test(normalized) || BLOCKED_SQL.test(normalized) || /;/.test(normalized)) throw new Error('Only a single read-only SELECT query is allowed'); return normalized; }
  async withClient(operation) { const client = new Client(this.connectionOptions()); try { await client.connect(); return await operation(client); } finally { await client.end().catch(() => undefined); } }
  async test() { try { await this.withClient((client) => client.query('SELECT 1')); return { success: true, message: 'Database connection successful' }; } catch (error) { return { success: false, message: connectionError(error) }; } }
  async schemas() { return this.withClient(async (c) => (await c.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('pg_catalog', 'information_schema') ORDER BY schema_name")).rows.map(x => x.schema_name)); }
  async tables(schema = 'public') { return this.withClient(async (c) => (await c.query("SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name", [schema])).rows); }
  async columns(schema, table) { return this.withClient(async (c) => (await c.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position", [schema, table])).rows); }
  async keys(schema, table) { return this.withClient(async (c) => (await c.query("SELECT tc.constraint_name, tc.constraint_type, kcu.column_name, ccu.table_schema AS foreign_schema, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column FROM information_schema.table_constraints tc LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema LEFT JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name=tc.constraint_name AND ccu.table_schema=tc.table_schema WHERE tc.table_schema=$1 AND tc.table_name=$2 AND tc.constraint_type IN ('PRIMARY KEY','FOREIGN KEY')", [schema, table])).rows); }
  async indexes(schema, table) { return this.withClient(async (c) => (await c.query('SELECT indexname, indexdef FROM pg_indexes WHERE schemaname=$1 AND tablename=$2 ORDER BY indexname', [schema, table])).rows); }
  async read({ schema = 'public', table, limit = 20, offset = 0, sortBy, sortDirection = 'asc', query } = {}) { if (query) return this.query(query); if (!table) throw new Error('A table is required'); const safeLimit=Math.min(Math.max(Number(limit)||20,1),1000), safeOffset=Math.max(Number(offset)||0,0); const qualified=`${quoteIdentifier(schema)}.${quoteIdentifier(table)}`; const order=sortBy ? ` ORDER BY ${quoteIdentifier(sortBy)} ${String(sortDirection).toLowerCase()==='desc'?'DESC':'ASC'}` : ''; const result=await this.withClient((c)=>c.query(`SELECT * FROM ${qualified}${order} LIMIT $1 OFFSET $2`,[safeLimit,safeOffset])); return {rows:result.rows,rowCount:result.rows.length,offset:safeOffset,limit:safeLimit}; }
  async query(sql) { const result=await this.withClient((c)=>c.query(this.assertReadOnlySql(sql))); return {rows:result.rows,rowCount:result.rowCount}; }
}
module.exports = RelationalConnector;
