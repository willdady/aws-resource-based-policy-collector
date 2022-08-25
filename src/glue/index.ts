import {
  GlueClient,
  GlueClientConfig,
  paginateGetResourcePolicies,
} from '@aws-sdk/client-glue';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class GluePolicyCollector extends BasePolicyCollector {
  private client: GlueClient;

  constructor(clientConfig?: GlueClientConfig) {
    super({ serviceName: 'glue' });
    this.client = new GlueClient(clientConfig || {});
  }

  private async getResourcePolicies() {
    const paginator = paginateGetResourcePolicies({ client: this.client }, {});
    const policies = [];
    for await (const page of paginator) {
      policies.push(...(page.GetResourcePoliciesResponseList || []));
    }
    return policies;
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    try {
      const policies = await this.getResourcePolicies();
      for (const p of policies) {
        if (!p.PolicyHash)
          throw new Error(
            `Unable to identify glue policy. Missing 'PolicyHash' attribute.`,
          );
        if (!p.PolicyInJson)
          throw new Error(
            `Unexpected glue policy result. Policy with PolicyHash '${p.PolicyHash}' is missing 'PolicyInJson' attribute.`,
          );
        result.resources.push({
          type: 'Glue::Policy', // Note there is no-such CF resource type
          id: p.PolicyHash,
          policy: p.PolicyInJson,
        });
      }
    } catch (err) {
      result.error = JSON.stringify(err);
    }
    return result;
  }
}
