interface BasePolicyCollectorProps {
  serviceName: string;
}

export interface ServiceResource {
  id: string;
  type: string;
  policy: string;
  error?: string;
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

  protected sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public abstract run(): Promise<ServicePoliciesResult>;
}
