import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // 일반적으로 `[locale]` 세그먼트에 해당합니다.
  let locale = await requestLocale;

  // 유효한 locale을 사용하도록 설정
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  // 메시지 파일 동적 import
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
