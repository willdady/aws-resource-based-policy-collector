import {
  CloudFormationClient,
  CloudFormationClientConfig,
  GetStackPolicyCommand,
  paginateListStacks,
} from '@aws-sdk/client-cloudformation';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class CloudformationPolicyCollector extends BasePolicyCollector {
  private client: CloudFormationClient;

  constructor(clientConfig?: CloudFormationClientConfig) {
    super({ serviceName: 'cloudformation' });
    this.client = new CloudFormationClient(clientConfig || {});
  }

  private async listStacks() {
    const paginator = paginateListStacks({ client: this.client }, {});
    const stacks = [];
    for await (const page of paginator) {
      stacks.push(...(page.StackSummaries || []));
    }
    return stacks;
  }

  private async getStackPolicy(stackName: string) {
    const response = await this.client.send(
      new GetStackPolicyCommand({
        StackName: stackName,
      }),
    );
    return response.StackPolicyBody;
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    try {
      const stacks = await this.listStacks();
      for (const s of stacks) {
        // Ignore deleted stacks
        if (s.DeletionTime) continue;
        const stackPolicy = await this.getStackPolicy(s.StackName!);
        if (!stackPolicy) continue;
        result.resources.push({
          type: 'Cloudformation::StackPolicy', // Note there is no-such CF resource type
          id: s.StackName!,
          policy: stackPolicy,
        });
      }
    } catch (err) {
      result.error = JSON.stringify(err);
    }
    return result;
  }
}
