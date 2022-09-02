# AWS resource-based policy collector

This library aims to collect resource-based policies from an AWS account.

It does not currently call all AWS services which support resource-based policies. Refer to [supported services](#supported-services) below.

## Install

```bash
yarn add aws-resource-based-policy-collector
```
or
```bash
npm install aws-resource-based-policy-collector
```

## Usage

Your environment must be configured with valid AWS credentials. See [Setting credentials in Node.js][credentials]. Your credentials must be authorised to perform read-only actions within your account. This can be achieved simply by creating a role in your account with the AWS managed `ReadOnlyAccess` policy. Naturally, your account must also not have read actions restricted by any service control policies in your organisation hierarchy.

```typescript

import { collect } from 'aws-resource-based-policy-collector';

const main = async () => {
  const result = await collect();
  // ... Do something with result
};

main();
```

The AWS region defaults to that of your credentials however you may optionally set this explicitly.

```typescript
const result = await collect({ region: 'us-east-1' });
```

The `collect` function returns an array of objects per-service where each service object contains an array of `resource` objects. The service object may also contain an optional `error` field if there was an issue listing resources. This typically ocurrs if your credentials do not have the required permissions to read the resources (or is blocked by an SCP).

Each resource object contains a `type` and `id` to uniquly identify the resource as well as a JSON encoded `policy`. The resource may also contain an optional `error` field if there was an issue querying the resource or it's policy.

```typescript
[
  {
    serviceName: 's3',
    resources: [
      {
        type: 'AWS::S3::Bucket',
        id: 'my-bucket',
        policy: '', // Policy document
        error: '', // Only present if an error ocurred
      }
    ],
    error: '', // Only present if an error ocurred
  },
  ...
]
```

Only resources with policies or errors are included.

## Supported services

This library currently collects resource-based policies for AWS services listed below. 

This list of services is taken from the tables found at [AWS services that work with IAM][services], specifically those services with a **Yes** or **Partial** in the **Resource-based policies** column.

- [x]  Lambda
- [x]  Serverless Application Repository
- [x]  ECR
- [x]  AWS Backup
- [x]  EFS
- [x]  S3 Glacier
- [x]  S3
- [ ]  S3 on AWS Outposts
- [ ]  Cloud9
- [x]  CodeArtifact
- [x]  CodeBuild
- [x]  IAM
- [x]  SecretsManager
- [x]  ACM Private Certificate Authority
- [x]  KMS
- [ ]  Lex v2
- [x]  CloudWatch Logs
- [ ]  Systems Manager Incident Manager
- [ ]  Systems Manager Incident Manager Contacts
- [x]  API Gateway
- [x]  VPC (endpoints)
- [x]  Elemental MediaStore
- [x]  OpenSearch
- [x]  Glue
- [x]  EventBridge
- [x]  EventBridge Schemas
- [x]  SNS
- [x]  SQS
- [x]  IoT
- [ ]  SES v2

## Troubleshooting

### Access denied on S3 buckets

If you are getting `AccessDenied` errors on S3 bucket resources your bucket likely has a bucket policy preventing access. Remove the bucket policy or modify it to grant read access to your role.

[services]: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_aws-services-that-work-with-iam.html
[credentials]: https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html