import {
  CloudWatchLogsClient,
  CloudWatchLogsClientConfig,
  paginateDescribeDestinations,
} from '@aws-sdk/client-cloudwatch-logs';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class CloudWatchLogsPolicyCollector extends BasePolicyCollector {
  private client: CloudWatchLogsClient;

  constructor(clientConfig?: CloudWatchLogsClientConfig) {
    super({ serviceName: 'logs' });
    this.client = new CloudWatchLogsClient(clientConfig || {});
  }

  private async describeDestinations() {
    const paginator = paginateDescribeDestinations({ client: this.client }, {});
    const destinations = [];
    for await (const page of paginator) {
      destinations.push(...(page.destinations || []));
    }
    return destinations;
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    const destinations = await this.describeDestinations();
    for (const d of destinations) {
      if (!d.accessPolicy) continue;
      result.resources.push({
        type: 'AWS::Logs::Destination',
        id: d.destinationName!,
        policy: d.accessPolicy,
      });
    }
    return result;
  }
}
