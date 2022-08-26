import {
  ACMPCAClient,
  ACMPCAClientConfig,
  GetPolicyCommand,
  ResourceNotFoundException,
  paginateListCertificateAuthorities,
} from '@aws-sdk/client-acm-pca';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class AcmPcaPolicyCollector extends BasePolicyCollector {
  private client: ACMPCAClient;

  constructor(clientConfig?: ACMPCAClientConfig) {
    super({ serviceName: 'acm-pca' });
    this.client = new ACMPCAClient(clientConfig || {});
  }

  private async listCertificateAuthorities() {
    const paginator = paginateListCertificateAuthorities(
      { client: this.client },
      {},
    );
    const certificateAuthorities = [];
    for await (const page of paginator) {
      certificateAuthorities.push(...(page.CertificateAuthorities || []));
    }
    return certificateAuthorities;
  }

  private async getPolicy(resourceArn: string) {
    return this.client.send(
      new GetPolicyCommand({
        ResourceArn: resourceArn,
      }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    try {
      const certificateAuthorities = await this.listCertificateAuthorities();
      for (const ca of certificateAuthorities) {
        let policy;
        try {
          policy = await this.getPolicy(ca.Arn!);
        } catch (err) {
          if (err instanceof ResourceNotFoundException) continue;
          throw err;
        }
        result.resources.push({
          type: 'AWS::ACMPCA::CertificateAuthority',
          id: ca.Arn!,
          policy: policy.Policy!,
        });
      }
    } catch (err) {
      result.error = JSON.stringify(err);
    }
    return result;
  }
}
