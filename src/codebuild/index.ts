import {
  CodeBuildClient,
  GetResourcePolicyCommand,
  paginateListSharedProjects,
} from '@aws-sdk/client-codebuild';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class CodeBuildPolicyCollector extends BasePolicyCollector {
  private client: CodeBuildClient;

  constructor() {
    super({ serviceName: 'codebuild' });
    this.client = new CodeBuildClient({});
  }

  private async listSharedProjects(): Promise<string[]> {
    const paginator = paginateListSharedProjects({ client: this.client }, {});
    const domains = [];
    for await (const page of paginator) {
      domains.push(...(page.projects || []));
    }
    return domains;
  }

  private getResourcePolicy(projectArn: string) {
    return this.client.send(
      new GetResourcePolicyCommand({ resourceArn: projectArn }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    const projects = await this.listSharedProjects();
    for (const arn of projects) {
      const response = await this.getResourcePolicy(arn);
      if (!response.policy) continue;
      result.resources.push({
        type: 'AWS::CodeBuild::Project',
        id: arn,
        policy: response.policy,
      });
    }
    return result;
  }
}
