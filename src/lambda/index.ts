import {
  LambdaClient,
  GetPolicyCommand,
  ResourceNotFoundException,
  paginateListFunctions,
} from '@aws-sdk/client-lambda';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class LambdaPolicyCollector extends BasePolicyCollector {
  private client: LambdaClient;

  constructor() {
    super({ serviceName: 'lambda' });
    this.client = new LambdaClient({});
  }

  private async listFunctions() {
    const paginator = paginateListFunctions({ client: this.client }, {});
    const fns = [];
    for await (const page of paginator) {
      fns.push(...(page.Functions || []));
    }
    return fns;
  }

  private async listAliases() {
    // TODO
  }

  private async listVersions() {
    // TODO
  }

  private async getPolicy(functionName: string, qualifier?: string) {
    return this.client.send(
      new GetPolicyCommand({
        FunctionName: functionName,
        Qualifier: qualifier,
      }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    const functions = await this.listFunctions();
    for (const f of functions) {
      try {
        const response = await this.getPolicy(f.FunctionName!);
        if (!response.Policy) continue;
        result.resources.push({
          type: 'AWS::Lambda::Function',
          id: f.FunctionName!,
          policy: response.Policy,
        });
      } catch (err) {
        if (err instanceof ResourceNotFoundException) {
          continue;
        }
        throw err;
      }
    }
    return result;
  }
}
