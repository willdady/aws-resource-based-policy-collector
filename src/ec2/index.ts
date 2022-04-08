import {
  EC2Client,
  paginateDescribeVpcEndpoints,
  VpcEndpoint,
} from '@aws-sdk/client-ec2';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class Ec2PolicyCollector extends BasePolicyCollector {
  private client: EC2Client;

  constructor() {
    super({ serviceName: 'ec2' });
    this.client = new EC2Client({});
  }

  private async describeVpcEndpoints(): Promise<VpcEndpoint[]> {
    const paginator = paginateDescribeVpcEndpoints({ client: this.client }, {});
    const vpcEndpoints = [];
    for await (const page of paginator) {
      vpcEndpoints.push(...(page.VpcEndpoints || []));
    }
    return vpcEndpoints;
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    const vpcEndpoints = await this.describeVpcEndpoints();
    for (const vpce of vpcEndpoints) {
      if (!vpce.PolicyDocument) continue;
      result.resources.push({
        type: 'AWS::EC2::VPCEndpoint',
        id: vpce.VpcEndpointId!,
        policy: vpce.PolicyDocument,
      });
    }
    return result;
  }
}
