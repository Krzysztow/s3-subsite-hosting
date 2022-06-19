# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## Running of the stack

Atm it requires following contextual parameters:
* `subsite-prefix`      - name of the prefix the static subpage should be put to (cannot be empty!)
* `subsite-dir-source`  - directory of the subpage to be deployed under the `subsite-prefix`

Example:

```sh
cdk deploy -c subsite-prefix=test-a -c subsite-dir-source=./test-1
cdk deploy -c subsite-prefix=test-b -c subsite-dir-source=./test-2
```

## Running lambda:
* synthesize new stack changes `cdk synth --no-staging -c subsite-prefix=test-a -c subsite-dir-source=./test`
* invoke lambda locally (all env variables are configured thanks to the above synth) `sam local invoke CreateIndexFileLambda -t ./cdk.out/SubsiteDeploymentsStack.template.json`
