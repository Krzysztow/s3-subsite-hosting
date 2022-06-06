import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface SubsiteDeploymentsProps {
  indexDocument: string,
  sources: [s3deploy.ISource],
  prefix: string
};

export class SubsiteDeployments extends Construct {
  readonly bucket: s3.Bucket

  constructor(scope: Construct, id: string, props: SubsiteDeploymentsProps) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'SubsiteDeploymentBucket', {
      websiteIndexDocument: props.indexDocument,
      publicReadAccess: true,
      // removalPolicy: RemovalPolicy.DESTROY,
      // autoDeleteObjects: true
    });

    const deployment = new s3deploy.BucketDeployment(this, 'SubsiteDeployment', {
      sources: props.sources,
      destinationBucket: this.bucket,
      // destinationKeyPrefix: props.prefix, // optional prefix in destination bucket
    });

  }
}
