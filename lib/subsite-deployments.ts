import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

const INDEX_DOC = "index.html";
interface SubsiteDeploymentsProps {
  sources: [s3deploy.ISource];
  prefix: string;
}

export class SubsiteDeployments extends Construct {
  readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: SubsiteDeploymentsProps) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, "SubsiteDeploymentBucket", {
      websiteIndexDocument: INDEX_DOC,
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY, //TODO: depending on the environment
      autoDeleteObjects: true, //TODO: depending on the environment
      lifecycleRules: [ //TODO: depending on environment - we don't want that for a production
        {
          prefix: `!${INDEX_DOC}`, //TODO: verify if that even works - this is prefix, I used file name instead
          expiration: Duration.days(1),
        }
      ],
    });

    const deployment = new s3deploy.BucketDeployment(
      this,
      "SubsiteDeployment",
      {
        sources: props.sources,
        destinationBucket: this.bucket,
        destinationKeyPrefix: props.prefix, // optional prefix in destination bucket
      }
    );
  }
}
