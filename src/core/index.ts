interface BasePolicyCollectorProps {
  serviceName: string;
}

export interface ServiceResource {
  id: string;
  type: string;
  policy: string;
}

export interface ServicePoliciesResult {
  serviceName: string;
  resources: ServiceResource[];
  error?: string;
}

export abstract class BasePolicyCollector {
  serviceName: string;

  constructor({ serviceName }: BasePolicyCollectorProps) {
    this.serviceName = serviceName;
  }

  public abstract run(): Promise<ServicePoliciesResult>;
}
