import {
  APIGatewayClient,
  APIGatewayClientConfig,
  paginateGetRestApis,
  RestApi,
} from '@aws-sdk/client-api-gateway';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class ApiGatewayPolicyCollector extends BasePolicyCollector {
  private client: APIGatewayClient;

  constructor(clientConfig?: APIGatewayClientConfig) {
    super({ serviceName: 'apigateway' });
    this.client = new APIGatewayClient(clientConfig || {});
  }

  private async getRestApis(): Promise<RestApi[]> {
    const paginator = paginateGetRestApis({ client: this.client }, {});
    const restApis = [];
    for await (const page of paginator) {
      restApis.push(...(page.items || []));
    }
    return restApis;
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    try {
      const restApis = await this.getRestApis();
      for (const r of restApis) {
        if (!r.policy) continue;
        result.resources.push({
          type: 'AWS::ApiGateway::RestApi',
          id: r.id!,
          policy: r.policy,
        });
      }
    } catch (err) {
      result.error = JSON.stringify(err);
    }
    return result;
  }
}
