import { middyfy } from '@libs/lambda';
import * as zod from 'zod';

interface LogoutResponse {
  logoutUrl: string;
}

const EventSchema = zod.object({
  queryStringParameters: zod.object({
    redirectUri: zod.url('Redirect URL must be a valid URL'),
  }),
});

type EventSchema = zod.infer<typeof EventSchema>;

const authDomain = process.env.AUTH_DOMAIN!;
const userPoolClientId = process.env.USER_POOL_CLIENT_ID!;

const logoutHandler = async (event: EventSchema): Promise<LogoutResponse> => {
  const logoutUrl = `https://${authDomain}/logout?client_id=${userPoolClientId}&logout_uri=${encodeURIComponent(event.queryStringParameters.redirectUri)}`;

  return { logoutUrl };
};

export const handler = middyfy<EventSchema, LogoutResponse>(logoutHandler);
