import {
  GetRoleCommand,
  IAMClient,
  IAMClientConfig,
  paginateListRoles,
  paginateListPolicies,
  Role,
  GetPolicyVersionCommand,
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

  private async listPolicies() {
    const paginator = paginateListPolicies(
      { client: this.client },
      { Scope: 'Local' },
    );
    const policies = [];
    for await (const page of paginator) {
      policies.push(...(page.Policies || []));
    }
    return policies;
  }

  private async getPolicyVersion(policyArn: string, versionId: string) {
    const response = await this.client.send(
      new GetPolicyVersionCommand({
        PolicyArn: policyArn,
        VersionId: versionId,
      }),
    );
    return response.PolicyVersion?.Document;
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    try {
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
    } catch (err) {
      result.error = JSON.stringify(err);
    }

    try {
      const policies = await this.listPolicies();
      for (const p of policies) {
        if (!p.Arn || !p.DefaultVersionId) continue;
        const policyDocument = await this.getPolicyVersion(
          p.Arn,
          p.DefaultVersionId,
        );
        if (!policyDocument) continue;
        result.resources.push({
          type: 'AWS::IAM::Policy',
          id: p.PolicyName!,
          policy: policyDocument,
        });
      }
    } catch (err) {
      result.error = JSON.stringify(err);
    }

    return result;
  }
}
