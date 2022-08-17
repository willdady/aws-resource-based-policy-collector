import {
  S3Client,
  ListBucketsCommand,
  GetBucketPolicyCommand,
  GetBucketLocationCommand,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class S3PolicyCollector extends BasePolicyCollector {
  private client: S3Client;

  constructor(clientConfig?: S3ClientConfig) {
    super({ serviceName: 's3' });
    this.client = new S3Client(clientConfig || {});
  }

  private async listBuckets() {
    return this.client.send(new ListBucketsCommand({}));
  }

  private async getBucketLocation(bucketName: string) {
    return this.client.send(
      new GetBucketLocationCommand({
        Bucket: bucketName,
      }),
    );
  }

  private async getBucketPolicy(bucketName: string, region: string) {
    // Region-specific client
    const client = new S3Client({ region });
    return client.send(
      new GetBucketPolicyCommand({
        Bucket: bucketName,
      }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    const buckets = await this.listBuckets();
    for (const b of buckets.Buckets || []) {
      const bucketLocationResponse = await this.getBucketLocation(b.Name!);
      let getBucketPolicyResponse;
      try {
        getBucketPolicyResponse = await this.getBucketPolicy(
          b.Name!,
          bucketLocationResponse.LocationConstraint || 'us-east-1',
        );
      } catch (err) {
        if ((err as Error).name === 'NoSuchBucketPolicy') continue;
        throw err;
      }
      if (!getBucketPolicyResponse.Policy) continue;
      result.resources.push({
        type: 'AWS::S3::Bucket',
        id: b.Name!,
        policy: getBucketPolicyResponse.Policy,
      });
    }
    return result;
  }
}
