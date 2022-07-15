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

export const collect = async () => {
  const collectors = [
    new ApiGatewayPolicyCollector(),
    new BackupPolicyCollector(),
    new CloudWatchLogsPolicyCollector(),
    new CodeArtifactPolicyCollector(),
    new CodeBuildPolicyCollector(),
    new Ec2PolicyCollector(),
    new EcrPolicyCollector(),
    new EfsPolicyCollector(),
    new EventBridgePolicyCollector(),
    new EventBridgeSchemasPolicyCollector(),
    new GlacierPolicyCollector(),
    new IamPolicyCollector(),
    new KmsPolicyCollector(),
    new LambdaPolicyCollector(),
    new MediaStorePolicyCollector(),
    new OpenSearchClientPolicyCollector(),
    new S3PolicyCollector(),
    new SecretsManagerPolicyCollector(),
    new ServerlessApplicationRepositoryPolicyCollector(),
    new SnsPolicyCollector(),
    new SqsPolicyCollector(),
  ];
  return await Promise.all(collectors.map((collector) => collector.run()));
};
