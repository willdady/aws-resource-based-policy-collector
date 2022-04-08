import {
  EventBridgeClient,
  ListEventBusesCommand,
  EventBus,
} from '@aws-sdk/client-eventbridge';
import { BasePolicyCollector, ServicePoliciesResult } from '../core';

export class EventBridgePolicyCollector extends BasePolicyCollector {
  private client: EventBridgeClient;

  constructor() {
    super({ serviceName: 'events' });
    this.client = new EventBridgeClient({});
  }

  private async listEventBuses(): Promise<EventBus[]> {
    const f = async (
      eventBuses: EventBus[] = [],
      nextToken?: string,
    ): Promise<EventBus[]> => {
      const response = await this.client.send(
        new ListEventBusesCommand({ NextToken: nextToken }),
      );
      if (response.NextToken) {
        return await f(
          [...eventBuses, ...(response.EventBuses || [])],
          response.NextToken,
        );
      }
      return [...eventBuses, ...(response.EventBuses || [])];
    };
    return f();
  }

  public async run(): Promise<ServicePoliciesResult> {
    const result: ServicePoliciesResult = {
      serviceName: this.serviceName,
      resources: [],
    };
    const eventBuses = await this.listEventBuses();
    for (const b of eventBuses) {
      if (!b.Policy) continue;
      result.resources.push({
        type: 'AWS::Events::EventBus',
        id: b.Name!,
        policy: b.Policy,
      });
    }
    return result;
  }
}
