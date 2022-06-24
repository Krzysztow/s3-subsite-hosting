import {
  CfnOutput,
  Duration,
  Expiration,
  lambda_layer_awscli,
  RemovalPolicy,
  Stack,
  StackProps,
  Tag,
  Tags,
} from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "path";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export const INDEX_DOC = "index.html";
export const SUBSITE_PREFIX = "subsites";
export const SUBSITE_DELIMITER = "/";
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
      lifecycleRules: [
        {
          expiration: Duration.days(1), //TODO: we don't want to expire in production
          prefix: SUBSITE_PREFIX,
        },
      ],
    });

    const deployment = new s3deploy.BucketDeployment(
      this,
      "SubsiteDeployment",
      {
        sources: props.sources,
        destinationBucket: this.bucket,
        destinationKeyPrefix: `${SUBSITE_PREFIX}${SUBSITE_DELIMITER}${props.prefix}`,
      }
    );

    const updateIndexLambda = new lambdaNode.NodejsFunction(
      this,
      "CreateIndexFileLambda",
      {
        runtime: lambda.Runtime.NODEJS_16_X,
        handler: "handler",
        entry: path.join(__dirname, "../lib/lambda/create-index.ts"),
        description:
          "Scans bucket prefixes and creates root index.html with links to all index.html pages within prefixes",
        logRetention: RetentionDays.ONE_DAY,
        environment: {
          BUCKET_NAME: this.bucket.bucketName,
          BUCKET_BASE_URL: this.bucket.urlForObject(),
        },
        bundling: {
          nodeModules: ["@aws-sdk/client-s3"],
        },
      }
    );

    this.bucket.grantReadWrite(updateIndexLambda);

    new CfnOutput(this, "bucket-name", { value: this.bucket.bucketName });
    new CfnOutput(this, "bucket-url", { value: this.bucket.urlForObject() });
  }
}
