import {
  DescribeDomainCommand,
  ListDomainNamesCommand,
  OpenSearchClient,
} from '@aws-sdk/client-opensearch';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class OpenSearchClientPolicyCollector extends BasePolicyCollector {
  private client: OpenSearchClient;

  constructor() {
    super({ serviceName: 'opensearch' });
    this.client = new OpenSearchClient({});
  }

  private async listDomainNames() {
    return this.client.send(new ListDomainNamesCommand({}));
  }

  private async describeDomain(domainName: string) {
    return this.client.send(
      new DescribeDomainCommand({ DomainName: domainName }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    const domainNames = await this.listDomainNames();
    for (const d of domainNames.DomainNames || []) {
      const response = await this.describeDomain(d.DomainName!);
      if (!response.DomainStatus?.AccessPolicies) continue;
      result.resources.push({
        type: 'AWS::OpenSearchService::Domain',
        id: d.DomainName!,
        policy: response.DomainStatus.AccessPolicies,
      });
    }
    return result;
  }
}
