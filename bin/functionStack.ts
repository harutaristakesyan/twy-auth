import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { HttpLambdaRouter, LambdaRouteDefinition } from './cdk';

interface FunctionsStackProps extends StackProps {
  envName: string;
}

export class FunctionsStack extends Stack {
  constructor(scope: Construct, id: string, props: FunctionsStackProps) {
    super(scope, id, props);

    const { envName } = props;

    const userPoolClientId = StringParameter.valueForStringParameter(
      this,
      '/cognito/user-pool-client-id',
    );

    const authDomain = StringParameter.valueForStringParameter(this, '/cognito/auth-domain');

    const authRoutes: LambdaRouteDefinition[] = [
      {
        functionPath: 'signUp',
        routeKey: 'POST /api/signup',
        env: {
          USER_POOL_CLIENT_ID: userPoolClientId,
        },
      },
      {
        functionPath: 'login',
        routeKey: 'POST /api/login',
        env: {
          USER_POOL_CLIENT_ID: userPoolClientId,
        },
      },
      {
        functionPath: 'verify',
        routeKey: 'POST /api/verify',
        env: {
          USER_POOL_CLIENT_ID: userPoolClientId,
        },
      },
      {
        functionPath: 'resendVerificationCode',
        routeKey: 'POST /api/resend-code',
        env: {
          USER_POOL_CLIENT_ID: userPoolClientId,
        },
      },
      {
        functionPath: 'forgotPassword',
        routeKey: 'POST /api/forgot-password',
        env: {
          USER_POOL_CLIENT_ID: userPoolClientId,
        },
      },
      {
        functionPath: 'confirmForgotPassword',
        routeKey: 'POST /api/create-password',
        env: {
          USER_POOL_CLIENT_ID: userPoolClientId,
        },
      },
      {
        functionPath: 'refreshToken',
        routeKey: 'POST /api/refresh-token',
        env: {
          AUTH_DOMAIN: authDomain,
          USER_POOL_CLIENT_ID: userPoolClientId,
        },
      },
      {
        functionPath: 'callback',
        routeKey: 'GET /api/callback',
        env: {
          AUTH_DOMAIN: authDomain,
          USER_POOL_CLIENT_ID: userPoolClientId,
        },
      },
      {
        functionPath: 'logout',
        routeKey: 'GET /api/logout',
        env: {
          AUTH_DOMAIN: authDomain,
          USER_POOL_CLIENT_ID: userPoolClientId,
        },
      },
      {
        functionPath: 'generateAuthUrl',
        routeKey: 'POST /api/generate-url',
        env: {
          AUTH_DOMAIN: authDomain,
          USER_POOL_CLIENT_ID: userPoolClientId,
        },
      },
    ];

    new HttpLambdaRouter(this, 'AuthRouter', { envName, routes: authRoutes });
  }
}
