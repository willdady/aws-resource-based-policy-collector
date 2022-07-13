# AWS resource-based policy collector

This library aims to collect resource-based policies from an AWS account.

**NOTE**: This library does not cover all AWS services which support resource-based policies and has *not* been rigurously tested! Refer to [supported services](#supported-services) below.

## Install

```bash
yarn add aws-resource-based-policy-collector
```
or
```bash
npm install aws-resource-based-policy-collector
```

## Usage

Your environment must be configured with valid AWS credentials. See [Setting credentials in Node.js][credentials]. Your credentials must be authorised to perform read-only actions within your account.

```typescript

import { collect } from 'aws-resource-based-policy-collector';

const main = async () => {
  const result = await collect();
  // ... Do something with result
};

main();
```

The `collect` function returns an array of objects per-service where each service object contains an array of `resource` objects. Each resource object contains a `type` and `id` to uniquly identify the resource.

Each resource contains a JSON encoded `policy`. Only resources with policies are included.

```typescript
[
  {
    serviceName: 's3',
    resources: [
      {
        type: 'AWS::S3::Bucket',
        id: 'my-bucket',
        policy: '', // JSON encoded string
      }
    ]
  },
  ...
]
```

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
- [ ]  ACM Private Certificate Authority
- [x]  KMS
- [ ]  Lex v2
- [x]  CloudWatch Logs
- [ ]  Systems Manager Incident Manager
- [ ]  Systems Manager Incident Manager Contacts
- [x]  API Gateway
- [x]  VPC (endpoints)
- [x]  Elemental MediaStore
- [x]  OpenSearch
- [ ]  Glue
- [x]  EventBridge
- [x]  EventBridge Schemas
- [x]  SNS
- [x]  SQS
- [ ]  IoT
- [ ]  SES v2

[services]: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_aws-services-that-work-with-iam.html
[credentials]: https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html