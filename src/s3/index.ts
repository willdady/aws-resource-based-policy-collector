import {
  S3Client,
  ListBucketsCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class S3PolicyCollector extends BasePolicyCollector {
  private client: S3Client;

  constructor() {
    super({ serviceName: 's3' });
    this.client = new S3Client({});
  }

  private async listBuckets() {
    return this.client.send(new ListBucketsCommand({}));
  }

  private async getBucketPolicy(bucketName: string) {
    return this.client.send(
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
      let response;
      try {
        response = await this.getBucketPolicy(b.Name!);
      } catch (err) {
        if ((err as Error).name === 'NoSuchBucketPolicy') continue;
        throw err;
      }
      if (!response.Policy) continue;
      result.resources.push({
        type: 'AWS::S3::Bucket',
        id: b.Name!,
        policy: response.Policy,
      });
    }
    return result;
  }
}
