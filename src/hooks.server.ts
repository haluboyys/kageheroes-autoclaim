import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Clear access session on full page navigation or browser reload
  if (event.request.method === 'GET' && !event.isDataRequest) {
    event.cookies.delete('access_session', { path: '/' });
  }

  const sessionToken = event.cookies.get('access_session');
  const expectedCode = event.platform?.env?.ACCESS_CODE || 'btnseven12';
  
  event.locals.authenticated = Boolean(sessionToken && sessionToken === expectedCode);

  const response = await resolve(event);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
};
