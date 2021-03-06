import {
  DescribeFileSystemPolicyCommand,
  EFSClient,
  FileSystemDescription,
  paginateDescribeFileSystems,
} from '@aws-sdk/client-efs';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class EfsPolicyCollector extends BasePolicyCollector {
  private client: EFSClient;

  constructor() {
    super({ serviceName: 'efs' });
    this.client = new EFSClient({});
  }

  private async describeFileSystems(): Promise<FileSystemDescription[]> {
    const paginator = paginateDescribeFileSystems({ client: this.client }, {});
    const fileSystems = [];
    for await (const page of paginator) {
      fileSystems.push(...(page.FileSystems || []));
    }
    return fileSystems;
  }

  private async describeFileSystemPolicy(fileSystemId: string) {
    return this.client.send(
      new DescribeFileSystemPolicyCommand({ FileSystemId: fileSystemId }),
    );
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    const fileSysterms = await this.describeFileSystems();
    for (const fs of fileSysterms) {
      const response = await this.describeFileSystemPolicy(fs.FileSystemId!);
      if (!response.Policy) continue;
      result.resources.push({
        type: 'AWS::EFS::FileSystem',
        id: fs.FileSystemId!,
        policy: response.Policy,
      });
    }
    return result;
  }
}
