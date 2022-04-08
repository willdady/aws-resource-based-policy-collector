import {
  GetResourcePolicyCommand,
  paginateListRegistries,
  RegistrySummary,
  SchemasClient,
} from '@aws-sdk/client-schemas';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class EventBridgeSchemasPolicyCollector extends BasePolicyCollector {
  private client: SchemasClient;

  constructor() {
    super({ serviceName: 'schemas' });
    this.client = new SchemasClient({});
  }

  private async listRegistries(): Promise<RegistrySummary[]> {
    const paginator = paginateListRegistries({ client: this.client }, {});
    const registries = [];
    for await (const page of paginator) {
      registries.push(...(page.Registries || []));
    }
    return registries;
  }

  private async getResourcePolicy(registryName: string) {
    return this.client.send(
      new GetResourcePolicyCommand({ RegistryName: registryName }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    const registries = await this.listRegistries();
    for (const r of registries) {
      // NOTE: Can not read policies of AWS managed registries
      if (r.RegistryName!.startsWith('aws.')) continue;
      const response = await this.getResourcePolicy(r.RegistryName!);
      if (!response.Policy) continue;
      result.resources.push({
        type: 'AWS::EventSchemas::Registry',
        id: r.RegistryName!,
        policy: response.Policy as string,
      });
    }
    return result;
  }
}