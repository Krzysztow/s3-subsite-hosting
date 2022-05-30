import { Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface SubsiteDeploymentProps {
  indexDocument: string
};

export class SubsiteDeployment extends Construct {
  readonly bucket: s3.Bucket

  constructor(scope: Construct, id: string, props: SubsiteDeploymentProps) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'SubsiteDeploymentBucket', {
      websiteIndexDocument: props.indexDocument,
      publicReadAccess: true,
      enforceSSL: true,
    });
  }
}
