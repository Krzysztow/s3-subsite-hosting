#!/usr/bin/env node
import { strict as assert } from "assert";
import "source-map-support/register";
import { App, Stack } from "aws-cdk-lib";
import { Source } from "aws-cdk-lib/aws-s3-deployment";
import { SubsiteDeployments } from "../lib/subsite-deployments";

const INDEX_DOC = "index.html";

const app = new App();

const subsiteDeploymentStack = new Stack(app, "SubsiteDeploymentsStack");

const prefixInput = subsiteDeploymentStack.node.tryGetContext("subsite-prefix");
const sourceDir =
  subsiteDeploymentStack.node.tryGetContext("subsite-dir-source");

assert(
  prefixInput?.length > 0,
  "The prefix needs to be specified: 'subsite-prefix'"
);
assert(
  sourceDir?.length > 0,
  "The source directory needs to be specified: 'subsite-dir-source'"
);

new SubsiteDeployments(subsiteDeploymentStack, "SubsitesDeployments", {
  indexDocument: INDEX_DOC,
  // Prefix to the subsite within the bucket
  prefix: prefixInput,
  // Subsite directory source to be uploaded
  sources: [Source.asset(sourceDir)],
});
