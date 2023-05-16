import { NestedStack, NestedStackProps, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { DashboardRenderingPreference, DefaultDashboardFactory, MonitoringFacade } from 'cdk-monitoring-constructs';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class SampleCdkMonitoringAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'SampleCdkMonitoringAppTable', {
      tableName: 'SampleTable2',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    table.addGlobalSecondaryIndex({
      indexName: 'SampleTable2-GSI',
      partitionKey: { name: 'name', type: dynamodb.AttributeType.STRING }
    });

    const queue = new sqs.Queue(this, 'DeadLetterQueue');

    new NestedMonitoringStack(this, 'NestedSampleCdkMonitoring', {
      table,
    });
  }
}

interface NestedMonitoringStackProps extends NestedStackProps {
  readonly table: dynamodb.Table;
}

class NestedMonitoringStack extends NestedStack {
  constructor(parent: Construct, id: string, props: NestedMonitoringStackProps) {
    super(parent, id, props);

    const monitoring = new MonitoringFacade(this, 'Monitoring', {
      alarmFactoryDefaults: {
        alarmNamePrefix: 'Test',
        actionsEnabled: false,
      },
      metricFactoryDefaults: {},
      dashboardFactory: new DefaultDashboardFactory(this, 'MonitoringDashboards', {
        dashboardNamePrefix: 'TestDashboard',
        createDashboard: true,
        createSummaryDashboard: true,
        createAlarmDashboard: true,
        renderingPreference: DashboardRenderingPreference.INTERACTIVE_ONLY,
      }),
    });

    monitoring.monitorScope(parent);

    monitoring.monitorDynamoTable({
      table: props.table,
      addSystemErrorCountAlarm: {
        Warning: { maxErrorCount: 0 },
        Critical: { maxErrorCount: 5 },
      }
    });
    monitoring.monitorDynamoTableGlobalSecondaryIndex({
      table: props.table,
      globalSecondaryIndexName: 'SampleTable2-GSI',
    });
  }
}
