import {
  BackupClient,
  BackupVaultListMember,
  GetBackupVaultAccessPolicyCommand,
  paginateListBackupVaults,
} from '@aws-sdk/client-backup';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class BackupPolicyCollector extends BasePolicyCollector {
  private client: BackupClient;

  constructor() {
    super({ serviceName: 'backup' });
    this.client = new BackupClient({});
  }

  private async listBackupVaults(): Promise<BackupVaultListMember[]> {
    const paginator = paginateListBackupVaults({ client: this.client }, {});
    const vaults = [];
    for await (const page of paginator) {
      vaults.push(...(page.BackupVaultList || []));
    }
    return vaults;
  }

  private async getVaultAccessPolicy(vaultName: string) {
    return this.client.send(
      new GetBackupVaultAccessPolicyCommand({ BackupVaultName: vaultName }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    const vaults = await this.listBackupVaults();
    for (const v of vaults) {
      const response = await this.getVaultAccessPolicy(v.BackupVaultName!);
      if (!response.Policy) continue;
      result.resources.push({
        type: 'AWS::Backup::BackupVault',
        id: v.BackupVaultName!,
        policy: response.Policy,
      });
    }
    return result;
  }
}
