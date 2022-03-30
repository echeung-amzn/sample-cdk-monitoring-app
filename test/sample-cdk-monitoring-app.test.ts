import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as SampleCdkMonitoringApp from '../lib/sample-cdk-monitoring-app-stack';

test('DynamoDB table created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new SampleCdkMonitoringApp.SampleCdkMonitoringAppStack(app, 'MyTestStack');
  // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'SampleTable',
  });
});
