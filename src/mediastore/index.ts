import {
  GetContainerPolicyCommand,
  MediaStoreClient,
  MediaStoreClientConfig,
  paginateListContainers,
  PolicyNotFoundException,
} from '@aws-sdk/client-mediastore';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class MediaStorePolicyCollector extends BasePolicyCollector {
  private client: MediaStoreClient;

  constructor(clientConfig?: MediaStoreClientConfig) {
    super({ serviceName: 'mediastore' });
    this.client = new MediaStoreClient(clientConfig || {});
  }

  private async listContainers() {
    const paginator = paginateListContainers({ client: this.client }, {});
    const containers = [];
    for await (const page of paginator) {
      containers.push(...(page.Containers || []));
    }
    return containers;
  }

  private async getContainerPolicy(containerName: string) {
    return this.client.send(
      new GetContainerPolicyCommand({ ContainerName: containerName }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    try {
      const containers = await this.listContainers();
      for (const c of containers) {
        try {
          const response = await this.getContainerPolicy(c.Name!);
          if (!response.Policy) continue;
          result.resources.push({
            type: 'AWS::MediaStore::Container',
            id: c.Name!,
            policy: response.Policy,
          });
        } catch (err) {
          if (err instanceof PolicyNotFoundException) {
            continue;
          }
          throw err;
        }
      }
    } catch (err) {
      result.error = JSON.stringify(err);
    }
    return result;
  }
}
