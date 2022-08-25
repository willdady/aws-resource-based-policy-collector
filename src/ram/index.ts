import {
  RAMClient,
  RAMClientConfig,
  paginateGetResourceShareAssociations,
} from '@aws-sdk/client-ram';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class RamPolicyCollector extends BasePolicyCollector {
  private client: RAMClient;

  constructor(clientConfig?: RAMClientConfig) {
    super({ serviceName: 'ram' });
    this.client = new RAMClient(clientConfig || {});
  }

  private async getResouceShareAssociations() {
    const resourceShareAssociations = [];
    const paginator = paginateGetResourceShareAssociations(
      { client: this.client },
      {
        associationType: 'PRINCIPAL',
      },
    );
    for await (const page of paginator) {
      resourceShareAssociations.push(...(page.resourceShareAssociations || []));
    }
    return resourceShareAssociations;
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    try {
      const resourceShareAssociations =
        await this.getResouceShareAssociations();
      for (const r of resourceShareAssociations) {
        if (!r.associatedEntity) continue;
        result.resources.push({
          type: 'RAM::ResourceShareAssociation', // Note there is no-such CF resource type
          id: r.resourceShareName!,
          policy: r.associatedEntity, // Note this is an arn, NOT a JSON policy
        });
      }
    } catch (err) {
      result.error = JSON.stringify(err);
    }
    return result;
  }
}
