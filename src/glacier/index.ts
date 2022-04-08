import {
  DescribeVaultOutput,
  GetVaultAccessPolicyCommand,
  GlacierClient,
  paginateListVaults,
} from '@aws-sdk/client-glacier';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class GlacierPolicyCollector extends BasePolicyCollector {
  private client: GlacierClient;

  constructor() {
    super({ serviceName: 'glacier' });
    this.client = new GlacierClient({});
  }

  private async listVaults(): Promise<DescribeVaultOutput[]> {
    const paginator = paginateListVaults(
      { client: this.client },
      { accountId: '-' },
    );
    const vaults = [];
    for await (const page of paginator) {
      vaults.push(...(page.VaultList || []));
    }
    return vaults;
  }

  private async getVaultAccessPolicy(vaultName: string) {
    return this.client.send(
      new GetVaultAccessPolicyCommand({ accountId: '-', vaultName }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    const vaults = await this.listVaults();
    for (const v of vaults) {
      const response = await this.getVaultAccessPolicy(v.VaultName!);
      if (!response.policy?.Policy) continue;
      result.resources.push({
        type: 'AWS::Glacier::Vault',
        id: v.VaultName!,
        policy: response.policy.Policy,
      });
    }
    return result;
  }
}
