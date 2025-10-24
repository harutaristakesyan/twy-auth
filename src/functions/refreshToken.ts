import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { toError } from '@libs/errors';
import { middyfy } from '@libs/lambda';
import axios from 'axios';
import * as zod from 'zod';
import errors from 'http-errors';

const EventSchema = zod.object({
  body: zod.object({
    refreshToken: zod.string().min(6, 'Code must be at least 3 character long'),
  }),
});

type EventSchema = zod.infer<typeof EventSchema>;

interface RefreshTokenResponse {
  accessToken: string;
  idToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

const authDomain = process.env.AUTH_DOMAIN!;
const userPoolClientId = process.env.USER_POOL_CLIENT_ID!;
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

const refreshTokenHandler = async (event: EventSchema): Promise<RefreshTokenResponse> => {
  const { refreshToken } = event.body;

  // 1. Try Cognito native flow
  try {
    const result = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: userPoolClientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      }),
    );

    return {
      accessToken: result.AuthenticationResult?.AccessToken || '',
      idToken: result.AuthenticationResult?.IdToken,
      expiresIn: result.AuthenticationResult?.ExpiresIn,
      tokenType: result.AuthenticationResult?.TokenType,
    };
  } catch (error) {
    console.warn('Fallback to Hosted UI refresh:', error);

    // 2. Try Hosted UI flow (OAuth2 refresh)
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: userPoolClientId,
        refresh_token: refreshToken,
      });

      const response = await axios.post(`https://${authDomain}/oauth2/token`, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { access_token, id_token, expires_in, token_type } = response.data;

      return {
        accessToken: access_token,
        idToken: id_token,
        expiresIn: expires_in,
        tokenType: token_type,
      };
    } catch (oauthError) {
      throw new errors.BadRequest(toError(oauthError).message);
    }
  }
};

export const handler = middyfy<EventSchema, RefreshTokenResponse>(refreshTokenHandler);
