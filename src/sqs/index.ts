import {
  SQSClient,
  GetQueueAttributesCommand,
  paginateListQueues,
} from '@aws-sdk/client-sqs';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class SqsPolicyCollector extends BasePolicyCollector {
  private client: SQSClient;

  constructor() {
    super({ serviceName: 'sqs' });
    this.client = new SQSClient({});
  }

  private async listQueues(): Promise<string[]> {
    const paginator = paginateListQueues({ client: this.client }, {});
    const queuesUrls = [];
    for await (const page of paginator) {
      queuesUrls.push(...(page.QueueUrls || []));
    }
    return queuesUrls;
  }

  private async getQueueAttributes(queueUrl: string) {
    return this.client.send(
      new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['Policy'],
      }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    const queueUrls = await this.listQueues();
    for (const queueUrl of queueUrls) {
      const response = await this.getQueueAttributes(queueUrl);
      if (!response.Attributes?.Policy) continue;
      result.resources.push({
        type: 'AWS::SQS::Queue',
        id: queueUrl,
        policy: response.Attributes.Policy,
      });
    }
    return result;
  }
}
