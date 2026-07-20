const RelationalConnector = require('../relational/RelationalConnector');
const prisma = require('../../../lib/prisma');

class SupabaseConnector extends RelationalConnector {
  isApplicationDatabase() { return (this.config.mode || 'default') === 'default'; }

  // Mode 1 must use Prisma, not a second driver. This preserves DATABASE_URL parsing,
  // TLS trust, and the existing application connection pool exactly.
  async withClient(operation) {
    if (!this.isApplicationDatabase()) return super.withClient(operation);
    const client = {
      query: async (sql, values = []) => {
        const result = await prisma.$queryRawUnsafe(sql, ...values);
        const rows = Array.isArray(result) ? result : [result];
        return { rows, rowCount: rows.length };
      },
    };
    return operation(client);
  }

  connectionOptions() {
    const connectionString = this.config.connectionString;
    if (connectionString) return this.externalConnectionOptions({ connectionString });
    const { host, database, port, username, password } = this.config;
    if (!host || !database || !username || !password) throw new Error('Advanced Supabase connections require host, database, username, and password');
    return this.externalConnectionOptions({ host, database, port: Number(port) || 5432, user: username, password });
  }
  externalConnectionOptions(options) {
    const sslMode = this.config.sslMode || 'require';
    const verifyCertificate = this.config.verifyCertificate !== false;
    if (!['require', 'prefer', 'disable'].includes(sslMode)) throw new Error('SSL mode must be require, prefer, or disable');
    // pg does not implement libpq's fallback semantics for prefer. It uses TLS when selected.
    const ssl = sslMode === 'disable' ? false : { rejectUnauthorized: verifyCertificate };
    return { ...options, ssl, connectionTimeoutMillis: (Number(this.config.timeout) || 10) * 1000 };
  }
  async validateConfig() { try { this.connectionOptions(); return { valid: true }; } catch (error) { return { valid: false, errors: [error.message] }; } }
}
module.exports = SupabaseConnector;
