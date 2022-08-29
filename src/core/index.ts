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

  protected log(message?: any) {
    console.log(this.serviceName, ': ', message);
  }

  public abstract run(): Promise<ServicePoliciesResult>;
}
