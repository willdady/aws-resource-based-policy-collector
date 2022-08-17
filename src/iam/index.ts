import {
  GetRoleCommand,
  IAMClient,
  IAMClientConfig,
  paginateListRoles,
  Role,
} from '@aws-sdk/client-iam';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class IamPolicyCollector extends BasePolicyCollector {
  private client: IAMClient;

  constructor(clientConfig?: IAMClientConfig) {
    super({ serviceName: 'iam' });
    this.client = new IAMClient(clientConfig || {});
  }

  private async listRoles(): Promise<Role[]> {
    const paginator = paginateListRoles({ client: this.client }, {});
    const roles = [];
    for await (const page of paginator) {
      roles.push(...(page.Roles || []));
    }
    return roles;
  }

  private async getRole(roleName: string) {
    return this.client.send(new GetRoleCommand({ RoleName: roleName }));
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    const roles = await this.listRoles();
    for (const r of roles) {
      const response = await this.getRole(r.RoleName!);
      if (!response.Role?.AssumeRolePolicyDocument) continue;
      result.resources.push({
        type: 'AWS::IAM::Role',
        id: r.RoleName!,
        policy: decodeURIComponent(response.Role.AssumeRolePolicyDocument),
      });
    }
    return result;
  }
}
