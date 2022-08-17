import {
  ApplicationSummary,
  GetApplicationPolicyCommand,
  paginateListApplications,
  ServerlessApplicationRepositoryClient,
  ServerlessApplicationRepositoryClientConfig,
} from '@aws-sdk/client-serverlessapplicationrepository';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class ServerlessApplicationRepositoryPolicyCollector extends BasePolicyCollector {
  private client: ServerlessApplicationRepositoryClient;

  constructor(clientConfig?: ServerlessApplicationRepositoryClientConfig) {
    super({ serviceName: 'serverless' });
    this.client = new ServerlessApplicationRepositoryClient(clientConfig || {});
  }

  private async listApplications(): Promise<ApplicationSummary[]> {
    const paginator = paginateListApplications({ client: this.client }, {});
    const applications = [];
    for await (const page of paginator) {
      applications.push(...(page.Applications || []));
    }
    return applications;
  }

  private async getApplicationPolicy(applicationId: string) {
    return this.client.send(
      new GetApplicationPolicyCommand({
        ApplicationId: applicationId,
      }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    const applications = await this.listApplications();
    for (const a of applications) {
      const response = await this.getApplicationPolicy(a.ApplicationId!);
      if (!response.Statements) continue;
      result.resources.push({
        type: 'AWS::Serverless::Application',
        id: a.ApplicationId!,
        policy: JSON.stringify(response.Statements),
      });
    }
    return result;
  }
}
