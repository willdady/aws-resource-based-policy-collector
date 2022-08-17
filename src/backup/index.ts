import {
  BackupClient,
  BackupClientConfig,
  BackupVaultListMember,
  GetBackupVaultAccessPolicyCommand,
  paginateListBackupVaults,
  ResourceNotFoundException,
} from '@aws-sdk/client-backup';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class BackupPolicyCollector extends BasePolicyCollector {
  private client: BackupClient;

  constructor(clientConfig?: BackupClientConfig) {
    super({ serviceName: 'backup' });
    this.client = new BackupClient(clientConfig || {});
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
      let response;
      try {
        response = await this.getVaultAccessPolicy(v.BackupVaultName!);
      } catch (err) {
        if (err instanceof ResourceNotFoundException) {
          continue;
        }
        throw err;
      }
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
