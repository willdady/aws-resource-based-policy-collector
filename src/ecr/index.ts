import {
  ECRClient,
  ECRClientConfig,
  GetRepositoryPolicyCommand,
  paginateDescribeRepositories,
  Repository,
  RepositoryPolicyNotFoundException,
} from '@aws-sdk/client-ecr';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class EcrPolicyCollector extends BasePolicyCollector {
  private client: ECRClient;

  constructor(clientConfig?: ECRClientConfig) {
    super({ serviceName: 'ecr' });
    this.client = new ECRClient(clientConfig || {});
  }

  private async describeRepositories(): Promise<Repository[]> {
    const paginator = paginateDescribeRepositories({ client: this.client }, {});
    const repositories = [];
    for await (const page of paginator) {
      repositories.push(...(page.repositories || []));
    }
    return repositories;
  }

  private async getRepositoryPolicy(repositoryName: string) {
    return this.client.send(
      new GetRepositoryPolicyCommand({
        repositoryName,
      }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    try {
      const repositories = await this.describeRepositories();
      for (const r of repositories) {
        try {
          const response = await this.getRepositoryPolicy(r.repositoryName!);
          if (!response.policyText) continue;
          result.resources.push({
            type: 'AWS::ECR::Repository',
            id: r.repositoryName!,
            policy: response.policyText,
          });
        } catch (err) {
          if (err instanceof RepositoryPolicyNotFoundException) {
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
