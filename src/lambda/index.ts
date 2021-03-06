import {
  LambdaClient,
  GetPolicyCommand,
  ResourceNotFoundException,
  paginateListFunctions,
  paginateListAliases,
  paginateListVersionsByFunction,
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

  private async listAliases(functionName: string) {
    const paginator = paginateListAliases(
      { client: this.client },
      { FunctionName: functionName },
    );
    const aliases = [];
    for await (const page of paginator) {
      aliases.push(...(page.Aliases || []));
    }
    return aliases;
  }

  private async listVersions(functionName: string) {
    const paginator = paginateListVersionsByFunction(
      { client: this.client },
      { FunctionName: functionName },
    );
    const versions = [];
    for await (const page of paginator) {
      versions.push(...(page.Versions || []));
    }
    return versions;
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
      const aliases = await this.listAliases(f.FunctionName!);
      for (const a of aliases) {
        try {
          const response = await this.getPolicy(f.FunctionName!, a.Name!);
          if (!response.Policy) continue;
          result.resources.push({
            type: 'AWS::Lambda::Alias',
            id: [f.FunctionArn, ':', a.Name].join(''),
            policy: response.Policy,
          });
        } catch (err) {
          if (err instanceof ResourceNotFoundException) {
            continue;
          }
          throw err;
        }
      }

      const versions = await this.listVersions(f.FunctionName!);
      for (const v of versions) {
        try {
          const response = await this.getPolicy(f.FunctionName!, v.Version!);
          if (!response.Policy) continue;
          result.resources.push({
            type: 'AWS::Lambda::Version',
            id: [f.FunctionArn, ':', v.Version].join(''),
            policy: response.Policy,
          });
        } catch (err) {
          if (err instanceof ResourceNotFoundException) {
            continue;
          }
          throw err;
        }
      }

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
