import {
  DescribeDomainCommand,
  ListDomainNamesCommand,
  OpenSearchClient,
  OpenSearchClientConfig,
} from '@aws-sdk/client-opensearch';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class OpenSearchClientPolicyCollector extends BasePolicyCollector {
  private client: OpenSearchClient;

  constructor(clientConfig?: OpenSearchClientConfig) {
    super({ serviceName: 'opensearch' });
    this.client = new OpenSearchClient(clientConfig || {});
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
    try {
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
    } catch (err) {
      result.error = JSON.stringify(err);
    }
    return result;
  }
}
