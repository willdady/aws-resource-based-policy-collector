import {
  SecretsManagerClient,
  GetResourcePolicyCommand,
  SecretListEntry,
  paginateListSecrets,
  SecretsManagerClientConfig,
} from '@aws-sdk/client-secrets-manager';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class SecretsManagerPolicyCollector extends BasePolicyCollector {
  private client: SecretsManagerClient;

  constructor(clientConfig?: SecretsManagerClientConfig) {
    super({ serviceName: 'secretsmanager' });
    this.client = new SecretsManagerClient(clientConfig || {});
  }

  private async listSecrets(): Promise<SecretListEntry[]> {
    const paginator = paginateListSecrets({ client: this.client }, {});
    const secrets = [];
    for await (const page of paginator) {
      secrets.push(...(page.SecretList || []));
    }
    return secrets;
  }

  private async getResourcePolicy(secretName: string) {
    return this.client.send(
      new GetResourcePolicyCommand({
        SecretId: secretName,
      }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    const secrets = await this.listSecrets();
    for (const s of secrets) {
      const response = await this.getResourcePolicy(s.Name!);
      if (!response.ResourcePolicy) continue;
      result.resources.push({
        type: 'AWS::SecretsManager::Secret',
        id: s.Name!,
        policy: response.ResourcePolicy,
      });
    }
    return result;
  }
}
