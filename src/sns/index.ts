import {
  GetTopicAttributesCommand,
  paginateListTopics,
  SNSClient,
  SNSClientConfig,
  Topic,
} from '@aws-sdk/client-sns';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class SnsPolicyCollector extends BasePolicyCollector {
  private client: SNSClient;

  constructor(clientConfig?: SNSClientConfig) {
    super({ serviceName: 'sns' });
    this.client = new SNSClient(clientConfig || {});
  }

  private async listTopics(): Promise<Topic[]> {
    const paginator = paginateListTopics({ client: this.client }, {});
    const topics = [];
    for await (const page of paginator) {
      topics.push(...(page.Topics || []));
    }
    return topics;
  }

  private async getTopicAttributes(topicArn: string) {
    return this.client.send(
      new GetTopicAttributesCommand({
        TopicArn: topicArn,
      }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    try {
      const topics = await this.listTopics();
      for (const topic of topics) {
        const response = await this.getTopicAttributes(topic.TopicArn!);
        if (!response.Attributes?.Policy) continue;
        result.resources.push({
          type: 'AWS::SNS::Topic',
          id: topic.TopicArn!,
          policy: response.Attributes.Policy,
        });
      }
    } catch (err) {
      result.error = JSON.stringify(err);
    }
    return result;
  }
}
