import { ApiGatewayPolicyCollector } from './apigateway';
import { BackupPolicyCollector } from './backup';
import { CloudWatchLogsPolicyCollector } from './logs';
import { CodeArtifactPolicyCollector } from './codeartifact';
import { CodeBuildPolicyCollector } from './codebuild';
import { Ec2PolicyCollector } from './ec2';
import { EcrPolicyCollector } from './ecr';
import { EfsPolicyCollector } from './efs';
import { EventBridgePolicyCollector } from './events';
import { EventBridgeSchemasPolicyCollector } from './schemas';
import { GlacierPolicyCollector } from './glacier';
import { IamPolicyCollector } from './iam';
import { KmsPolicyCollector } from './kms';
import { LambdaPolicyCollector } from './lambda';
import { MediaStorePolicyCollector } from './mediastore';
import { OpenSearchClientPolicyCollector } from './opensearch';
import { S3PolicyCollector } from './s3';
import { SecretsManagerPolicyCollector } from './secretsmanager';
import { ServerlessApplicationRepositoryPolicyCollector } from './serverless';
import { SnsPolicyCollector } from './sns';
import { SqsPolicyCollector } from './sqs';

export { ServicePoliciesResult, ServiceResource } from './core';

export const collect = async (config?: { region?: string }) => {
  const collectors = [
    new ApiGatewayPolicyCollector(config),
    new BackupPolicyCollector(config),
    new CloudWatchLogsPolicyCollector(config),
    new CodeArtifactPolicyCollector(config),
    new CodeBuildPolicyCollector(config),
    new Ec2PolicyCollector(config),
    new EcrPolicyCollector(config),
    new EfsPolicyCollector(config),
    new EventBridgePolicyCollector(config),
    new EventBridgeSchemasPolicyCollector(config),
    new GlacierPolicyCollector(config),
    new IamPolicyCollector(config),
    new KmsPolicyCollector(config),
    new LambdaPolicyCollector(config),
    new MediaStorePolicyCollector(config),
    new OpenSearchClientPolicyCollector(config),
    new S3PolicyCollector(config),
    new SecretsManagerPolicyCollector(config),
    new ServerlessApplicationRepositoryPolicyCollector(config),
    new SnsPolicyCollector(config),
    new SqsPolicyCollector(config),
  ];
  return await Promise.all(collectors.map((collector) => collector.run()));
};
