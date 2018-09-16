import { expect, haveResource, ResourcePart } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/cdk');
import { App, Stack } from '@aws-cdk/cdk';
import { Test } from 'nodeunit';
import apigateway = require('../lib');

// tslint:disable:max-line-length

export = {
    'minimal setup'(test: Test) {
        // GIVEN
        const stack = new cdk.Stack();

        // WHEN
        const api = new apigateway.RestApi(stack, 'my-api');
        api.onMethod('GET'); // must have at least one method

        // THEN
        expect(stack).toMatch({
            Resources: {
              myapi4C7BF186: {
                Type: "AWS::ApiGateway::RestApi",
                Properties: {
                  Name: "my-api"
                }
              },
              myapiGETF990CE3C: {
                Type: "AWS::ApiGateway::Method",
                Properties: {
                  HttpMethod: "GET",
                  ResourceId: {
                    "Fn::GetAtt": [
                      "myapi4C7BF186",
                      "RootResourceId"
                    ]
                  },
                  RestApiId: {
                    Ref: "myapi4C7BF186"
                  },
                  AuthorizationType: "NONE",
                  Integration: {
                    Type: "MOCK"
                  }
                }
              },
              myapiDeployment92F2CB49916eaecf87f818f1e175215b8d086029: {
                Type: "AWS::ApiGateway::Deployment",
                Properties: {
                  RestApiId: {
                    Ref: "myapi4C7BF186"
                  },
                  Description: "Automatically created by the RestApi construct"
                },
                DependsOn: [ "myapiGETF990CE3C" ]
              },
              myapiDeploymentStageprod298F01AF: {
                Type: "AWS::ApiGateway::Stage",
                Properties: {
                  RestApiId: {
                    Ref: "myapi4C7BF186"
                  },
                  DeploymentId: {
                    Ref: "myapiDeployment92F2CB49916eaecf87f818f1e175215b8d086029"
                  },
                  StageName: "prod"
                }
              },
              myapiCloudWatchRole095452E5: {
                Type: "AWS::IAM::Role",
                Properties: {
                  AssumeRolePolicyDocument: {
                    Statement: [
                      {
                        Action: "sts:AssumeRole",
                        Effect: "Allow",
                        Principal: {
                          Service: "apigateway.amazonaws.com"
                        }
                      }
                    ],
                    Version: "2012-10-17"
                  },
                  ManagedPolicyArns: [
                    {
                      "Fn::Join": [
                        "",
                        [
                          "arn",
                          ":",
                          {
                            Ref: "AWS::Partition"
                          },
                          ":",
                          "iam",
                          ":",
                          "",
                          ":",
                          "aws",
                          ":",
                          "policy",
                          "/",
                          "service-role/AmazonAPIGatewayPushToCloudWatchLogs"
                        ]
                      ]
                    }
                  ]
                }
              },
              myapiAccountEC421A0A: {
                Type: "AWS::ApiGateway::Account",
                Properties: {
                  CloudWatchRoleArn: {
                    "Fn::GetAtt": [
                      "myapiCloudWatchRole095452E5",
                      "Arn"
                    ]
                  }
                },
                DependsOn: [
                  "myapi4C7BF186"
                ]
              }
            },
            Outputs: {
              myapiEndpoint3628AFE3: {
                Value: {
                  "Fn::Join": [
                    "",
                    [
                      "https://",
                      {
                        Ref: "myapi4C7BF186"
                      },
                      ".execute-api.",
                      {
                        Ref: "AWS::Region"
                      },
                      ".amazonaws.com/",
                      {
                        Ref: "myapiDeploymentStageprod298F01AF"
                      },
                      "/"
                    ]
                  ]
                },
                Export: {
                  Name: "myapiEndpoint3628AFE3"
                }
              }
            }
        });

        test.done();
    },

    '"name" is defaulted to construct id'(test: Test) {
      // GIVEN
      const stack = new cdk.Stack();

      // WHEN
      const api = new apigateway.RestApi(stack, 'my-first-api', {
          deploy: false,
          cloudWatchRole: false,
      });

      api.onMethod('GET');

      // THEN
      expect(stack).to(haveResource('AWS::ApiGateway::RestApi', {
          Name: "my-first-api"
      }));

      test.done();
  },

  'fails in synthesis if there are no methods'(test: Test) {
      // GIVEN
      const app = new App();
      const stack = new Stack(app, 'my-stack');
      const api = new apigateway.RestApi(stack, 'API');

      // WHEN
      api.addResource('foo');
      api.addResource('bar').addResource('goo');

      // THEN
      test.throws(() => app.synthesizeStack(stack.name), /The REST API doesn't contain any methods/);
      test.done();
    },

    '"addResource" can be used on "IRestApiResource" to form a tree'(test: Test) {
        // GIVEN
        const stack = new cdk.Stack();
        const api = new apigateway.RestApi(stack, 'restapi', {
            deploy: false,
            cloudWatchRole: false,
            restApiName: 'my-rest-api'
        });

        api.onMethod('GET');

        // WHEN
        const foo = api.addResource('foo');
        api.addResource('bar');
        foo.addResource('{hello}');

        // THEN
        expect(stack).to(haveResource('AWS::ApiGateway::Resource', {
            PathPart: "foo",
            ParentId: { "Fn::GetAtt": [ "restapiC5611D27", "RootResourceId"] }
        }));

        expect(stack).to(haveResource('AWS::ApiGateway::Resource', {
            PathPart: "bar",
            ParentId: { "Fn::GetAtt": [ "restapiC5611D27", "RootResourceId"] }
        }));

        expect(stack).to(haveResource('AWS::ApiGateway::Resource', {
            PathPart: "{hello}",
            ParentId: { Ref: "restapifooF697E056" }
        }));

        test.done();
    },

    '"addMethod" can be used to add methods to resources'(test: Test) {
        // GIVEN
        const stack = new cdk.Stack();

        const api = new apigateway.RestApi(stack, 'restapi', { deploy: false, cloudWatchRole: false });
        const r1 = api.addResource('r1');

        // WHEN
        api.onMethod('GET');
        r1.onMethod('POST');

        // THEN
        expect(stack).toMatch({
          Resources: {
            restapiC5611D27: {
              Type: "AWS::ApiGateway::RestApi",
              Properties: {
                Name: "restapi"
              }
            },
            restapir1CF2997EA: {
              Type: "AWS::ApiGateway::Resource",
              Properties: {
                ParentId: {
                  "Fn::GetAtt": [
                    "restapiC5611D27",
                    "RootResourceId"
                  ]
                },
                PathPart: "r1",
                RestApiId: {
                  Ref: "restapiC5611D27"
                }
              }
            },
            restapir1POST766920C4: {
              Type: "AWS::ApiGateway::Method",
              Properties: {
                HttpMethod: "POST",
                ResourceId: {
                  Ref: "restapir1CF2997EA"
                },
                RestApiId: {
                  Ref: "restapiC5611D27"
                },
                AuthorizationType: "NONE",
                Integration: {
                  Type: "MOCK"
                }
              }
            },
            restapiGET6FC1785A: {
              Type: "AWS::ApiGateway::Method",
              Properties: {
                HttpMethod: "GET",
                ResourceId: {
                  "Fn::GetAtt": [
                    "restapiC5611D27",
                    "RootResourceId"
                  ]
                },
                RestApiId: {
                  Ref: "restapiC5611D27"
                },
                AuthorizationType: "NONE",
                Integration: {
                  Type: "MOCK"
                }
              }
            }
          }
        });

        test.done();
    },

    'resourcePath returns the full path of the resource within the API'(test: Test) {
        // GIVEN
        const stack = new cdk.Stack();
        const api = new apigateway.RestApi(stack, 'restapi');

        // WHEN
        const r1 = api.addResource('r1');
        const r11 = r1.addResource('r1_1');
        const r12 = r1.addResource('r1_2');
        const r121 = r12.addResource('r1_2_1');
        const r2 = api.addResource('r2');

        // THEN
        test.deepEqual(api.resourcePath, '/');
        test.deepEqual(r1.resourcePath, '/r1');
        test.deepEqual(r11.resourcePath, '/r1/r1_1');
        test.deepEqual(r12.resourcePath, '/r1/r1_2');
        test.deepEqual(r121.resourcePath, '/r1/r1_2/r1_2_1');
        test.deepEqual(r2.resourcePath, '/r2');
        test.done();
    },

    'resource path part validation'(test: Test) {
        // GIVEN
        const stack = new cdk.Stack();
        const api = new apigateway.RestApi(stack, 'restapi');

        // THEN
        test.throws(() => api.addResource('foo/'));
        api.addResource('boom-bam');
        test.throws(() => api.addResource('illegal()'));
        api.addResource('{foo}');
        test.throws(() => api.addResource('foo{bar}'));
        test.done();
    },

    'fails if "deployOptions" is set with "deploy" disabled'(test: Test) {
        // GIVEN
        const stack = new cdk.Stack();

        // THEN
        test.throws(() => new apigateway.RestApi(stack, 'myapi', {
          deploy: false,
          deployOptions: { cachingEnabled: true }
        }), /Cannot set 'deployOptions' if 'deploy' is disabled/);

        test.done();
    },

    'CloudWatch role is created for API Gateway'(test: Test) {
        // GIVEN
        const stack = new cdk.Stack();
        const api = new apigateway.RestApi(stack, 'myapi');
        api.onMethod('GET');

        // THEN
        expect(stack).to(haveResource('AWS::IAM::Role'));
        expect(stack).to(haveResource('AWS::ApiGateway::Account'));
        test.done();
    },

    'import/export'(test: Test) {
        // GIVEN
        const stack = new cdk.Stack();

        // WHEN
        const imported = apigateway.RestApi.import(stack, 'imported-api', {
            restApiId: new apigateway.RestApiId('api-rxt4498f')
        });
        const exported = imported.export();

        // THEN
        expect(stack).toMatch({
          Outputs: {
            importedapiRestApiIdC00F155A: {
              Value: "api-rxt4498f",
              Export: {
                Name: "importedapiRestApiIdC00F155A"
              }
            }
          }
        });
        test.deepEqual(cdk.resolve(exported), { restApiId: { 'Fn::ImportValue': 'importedapiRestApiIdC00F155A' } });
        test.done();
    },

    '"url" and "urlForPath" return the URL endpoints of the deployed API'(test: Test) {
        // GIVEN
        const stack = new cdk.Stack();
        const api = new apigateway.RestApi(stack, 'api');
        api.onMethod('GET');

        // THEN
        test.deepEqual(cdk.resolve(api.url), { 'Fn::Join':
        [ '',
          [ 'https://',
            { Ref: 'apiC8550315' },
            '.execute-api.',
            { Ref: 'AWS::Region' },
            '.amazonaws.com/',
            { Ref: 'apiDeploymentStageprod896C8101' },
            '/' ] ] });
        test.deepEqual(cdk.resolve(api.urlForPath('/foo/bar')), { 'Fn::Join':
        [ '',
          [ 'https://',
            { Ref: 'apiC8550315' },
            '.execute-api.',
            { Ref: 'AWS::Region' },
            '.amazonaws.com/',
            { Ref: 'apiDeploymentStageprod896C8101' },
            '/foo/bar' ] ] });
        test.done();
    },

    '"urlForPath" would not work if there is no deployment'(test: Test) {
        // GIVEN
        const stack = new cdk.Stack();
        const api = new apigateway.RestApi(stack, 'api', { deploy: false });
        api.onMethod('GET');

        // THEN
        test.throws(() => api.url, /Cannot determine deployment stage for API from "deploymentStage". Use "deploy" or explicitly set "deploymentStage"/);
        test.throws(() => api.urlForPath('/foo'), /Cannot determine deployment stage for API from "deploymentStage". Use "deploy" or explicitly set "deploymentStage"/);
        test.done();
    },

    '"urlForPath" requires that path will begin with "/"'(test: Test) {
        // GIVEN
        const stack = new cdk.Stack();
        const api = new apigateway.RestApi(stack, 'api');
        api.onMethod('GET');

        // THEN
        test.throws(() => api.urlForPath('foo'), /Path must begin with \"\/\": foo/);
        test.done();
    },

    '"executeApiArn" returns the execute-api ARN for a resource/method'(test: Test) {
        // GIVEN
        const stack = new cdk.Stack();
        const api = new apigateway.RestApi(stack, 'api');
        api.onMethod('GET');

        // WHEN
        const arn = api.executeApiArn('method', '/path', 'stage');

        // THEN
        test.deepEqual(cdk.resolve(arn), { 'Fn::Join':
        [ '',
          [ 'arn',
            ':',
            { Ref: 'AWS::Partition' },
            ':',
            'execute-api',
            ':',
            { Ref: 'AWS::Region' },
            ':',
            { Ref: 'AWS::AccountId' },
            ':',
            { Ref: 'apiC8550315' },
            '/',
            'stage/method/path' ] ] });
        test.done();
    },

    '"executeApiArn" path must begin with "/"'(test: Test) {
        // GIVEN
        const stack = new cdk.Stack();
        const api = new apigateway.RestApi(stack, 'api');
        api.onMethod('GET');

        // THEN
        test.throws(() => api.executeApiArn('method', 'hey-path', 'stage'), /"path" must begin with a "\/": 'hey-path'/);
        test.done();
    },

    '"endpointTypes" can be used to specify endpoint configuration for the api'(test: Test) {
        // GIVEN
        const stack = new cdk.Stack();

        // WHEN
        const api = new apigateway.RestApi(stack, 'api', {
            endpointTypes: [ apigateway.EndpointType.Edge, apigateway.EndpointType.Private ]
        });

        api.onMethod('GET');

        // THEN
        expect(stack).to(haveResource('AWS::ApiGateway::RestApi', {
          EndpointConfiguration: {
            Types: [
              "EDGE",
              "PRIVATE"
            ]
          }
        }));
        test.done();
    },

    '"cloneFrom" can be used to clone an existing API'(test: Test) {
        // GIVEN
        const stack = new cdk.Stack();
        const cloneFrom = apigateway.RestApi.import(stack, 'RestApi', {
            restApiId: new apigateway.RestApiId('foobar')
        });

        // WHEN
        const api = new apigateway.RestApi(stack, 'api', {
            cloneFrom
        });

        api.onMethod('GET');

        expect(stack).to(haveResource('AWS::ApiGateway::RestApi', {
            CloneFrom: "foobar",
            Name: "api"
        }));

        test.done();
    },

    'allow taking a dependency on the rest api (includes deployment and stage)'(test: Test) {
      const stack = new cdk.Stack();

      const api = new apigateway.RestApi(stack, 'myapi');

      api.onMethod('GET');

      const resource = new cdk.Resource(stack, 'DependsOnRestApi', { type: 'My::Resource' });

      resource.addDependency(api);

      expect(stack).to(haveResource('My::Resource', {
          DependsOn: [
              'myapi162F20B8', // api
              'myapiDeploymentB7EF8EB75c091a668064a3f3a1f6d68a3fb22cf9', // deployment
              'myapiDeploymentStageprod329F21FF' // stage
          ]
      }, ResourcePart.CompleteDefinition));

      test.done();
  }
};