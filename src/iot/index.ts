import {
  GetPolicyCommand,
  IoTClient,
  IoTClientConfig,
  paginateListPolicies,
} from '@aws-sdk/client-iot';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class IotPolicyCollector extends BasePolicyCollector {
  private client: IoTClient;

  constructor(clientConfig?: IoTClientConfig) {
    super({ serviceName: 'iot' });
    this.client = new IoTClient(clientConfig || {});
  }

  private async getPolicy(policyName: string) {
    return this.client.send(new GetPolicyCommand({ policyName }));
  }

  private async listPolicies() {
    const paginator = paginateListPolicies({ client: this.client }, {});
    const policies = [];
    for await (const page of paginator) {
      policies.push(...(page.policies || []));
    }
    return policies;
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    try {
      const policies = await this.listPolicies();
      for (const p of policies) {
        const policy = await this.getPolicy(p.policyName!);
        result.resources.push({
          type: 'AWS::IoT::Policy',
          id: p.policyName!,
          policy: policy.policyDocument!,
        });
      }
    } catch (err) {
      result.error = JSON.stringify(err);
    }

    return result;
  }
}
