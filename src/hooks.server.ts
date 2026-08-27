import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get('access_session');
  const expectedCode = event.platform?.env?.ACCESS_CODE || 'btnseven12';
  
  event.locals.authenticated = sessionToken === expectedCode;

  const response = await resolve(event);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
};
