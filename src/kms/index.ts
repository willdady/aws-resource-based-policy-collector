import {
  GetKeyPolicyCommand,
  KeyListEntry,
  KMSClient,
  KMSClientConfig,
  paginateListKeys,
} from '@aws-sdk/client-kms';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class KmsPolicyCollector extends BasePolicyCollector {
  private client: KMSClient;

  constructor(clientConfig?: KMSClientConfig) {
    super({ serviceName: 'kms' });
    this.client = new KMSClient(clientConfig || {});
  }

  private async listKeys(): Promise<KeyListEntry[]> {
    const paginator = paginateListKeys({ client: this.client }, {});
    const keys = [];
    for await (const page of paginator) {
      keys.push(...(page.Keys || []));
    }
    return keys;
  }

  private async getKeyPolicy(keyId: string) {
    return await this.client.send(
      new GetKeyPolicyCommand({ KeyId: keyId, PolicyName: 'default' }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    try {
      const keys = await this.listKeys();
      for (const k of keys) {
        const response = await this.getKeyPolicy(k.KeyId!);
        if (!response.Policy) continue;
        result.resources.push({
          type: 'AWS::KMS::Key',
          id: k.KeyId!,
          policy: response.Policy,
        });
      }
    } catch (err) {
      result.error = JSON.stringify(err);
    }
    return result;
  }
}
