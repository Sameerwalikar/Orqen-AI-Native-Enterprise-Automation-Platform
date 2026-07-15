const BaseConnector = require('../base/BaseConnector');
const AWS = require('aws-sdk');

/**
 * S3 Connector
 * Connects to AWS S3 or S3-compatible storage (MinIO)
 */
class S3Connector extends BaseConnector {
  constructor(config = {}) {
    super(config);
    this.s3 = null;
    this.initializeS3();
  }

  initializeS3() {
    const { accessKeyId, secretAccessKey, region, endpoint } = this.config;

    const s3Config = {
      accessKeyId,
      secretAccessKey,
      region: region || 'us-east-1',
    };

    // Support for MinIO or other S3-compatible services
    if (endpoint) {
      s3Config.endpoint = endpoint;
      s3Config.s3ForcePathStyle = true;
      s3Config.signatureVersion = 'v4';
    }

    this.s3 = new AWS.S3(s3Config);
  }

  async validateConfig() {
    const errors = [];
    if (!this.config.accessKeyId) errors.push('accessKeyId is required');
    if (!this.config.secretAccessKey) errors.push('secretAccessKey is required');
    if (!this.config.bucket) errors.push('bucket is required');

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async test() {
    try {
      await this.validateConfig();
      await this.s3.headBucket({ Bucket: this.config.bucket }).promise();
      return { success: true, message: 'S3 connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async read(options = {}) {
    const { key, bucket } = options;
    const targetBucket = bucket || this.config.bucket;
    const targetKey = key || options.path || '';

    if (!targetKey) {
      // List objects in bucket
      return await this.listObjects(targetBucket, options.prefix);
    }

    try {
      const result = await this.s3
        .getObject({
          Bucket: targetBucket,
          Key: targetKey,
        })
        .promise();

      // Try to parse as JSON, otherwise return as string
      try {
        return JSON.parse(result.Body.toString());
      } catch {
        return result.Body.toString();
      }
    } catch (error) {
      throw new Error(`Failed to read from S3: ${error.message}`);
    }
  }

  async write(data, options = {}) {
    const { key, bucket, contentType } = options;
    const targetBucket = bucket || this.config.bucket;
    const targetKey = key || options.path || `data-${Date.now()}.json`;

    let body = data;
    if (typeof data === 'object') {
      body = JSON.stringify(data, null, 2);
    }

    try {
      await this.s3
        .putObject({
          Bucket: targetBucket,
          Key: targetKey,
          Body: body,
          ContentType: contentType || 'application/json',
        })
        .promise();

      return {
        success: true,
        message: `File uploaded successfully: ${targetKey}`,
        key: targetKey,
      };
    } catch (error) {
      throw new Error(`Failed to write to S3: ${error.message}`);
    }
  }

  async listObjects(bucket, prefix = '') {
    try {
      const result = await this.s3
        .listObjectsV2({
          Bucket: bucket || this.config.bucket,
          Prefix: prefix,
        })
        .promise();

      return result.Contents.map((obj) => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
      }));
    } catch (error) {
      throw new Error(`Failed to list S3 objects: ${error.message}`);
    }
  }

  getMetadata() {
    return {
      name: 'S3',
      type: 's3',
      description: 'AWS S3 or S3-compatible storage (MinIO)',
      config: {
        accessKeyId: { type: 'string', description: 'AWS Access Key ID', required: true },
        secretAccessKey: { type: 'string', description: 'AWS Secret Access Key', required: true },
        region: { type: 'string', description: 'AWS Region', default: 'us-east-1' },
        bucket: { type: 'string', description: 'S3 Bucket Name', required: true },
        endpoint: { type: 'string', description: 'Custom endpoint (for MinIO)', required: false },
      },
    };
  }
}

module.exports = S3Connector;

