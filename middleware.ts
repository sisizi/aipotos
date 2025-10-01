import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware({
  ...routing,
  localeDetection: false
});

export const config = {
  matcher: [
    '/',
    '/(zh|en|ko|ja)/:path*',
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};