import {
  CodeartifactClient,
  CodeartifactClientConfig,
  DomainSummary,
  GetDomainPermissionsPolicyCommand,
  paginateListDomains,
} from '@aws-sdk/client-codeartifact';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class CodeArtifactPolicyCollector extends BasePolicyCollector {
  private client: CodeartifactClient;

  constructor(clientConfig?: CodeartifactClientConfig) {
    super({ serviceName: 'codeartifact' });
    this.client = new CodeartifactClient(clientConfig || {});
  }

  private async listDomains(): Promise<DomainSummary[]> {
    const paginator = paginateListDomains({ client: this.client }, {});
    const domains = [];
    for await (const page of paginator) {
      domains.push(...(page.domains || []));
    }
    return domains;
  }

  private getDomainPermissionsPolicy(domain: string) {
    return this.client.send(new GetDomainPermissionsPolicyCommand({ domain }));
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    try {
      const domains = await this.listDomains();
      for (const d of domains) {
        const response = await this.getDomainPermissionsPolicy(d.name!);
        if (!response.policy?.document) continue;
        result.resources.push({
          type: 'AWS::CodeArtifact::Domain',
          id: d.name!,
          policy: response.policy.document,
        });
      }
    } catch (err) {
      result.error = JSON.stringify(err);
    }
    return result;
  }
}
