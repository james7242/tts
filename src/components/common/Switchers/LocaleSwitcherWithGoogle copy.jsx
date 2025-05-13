'use client';
import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Field, Label } from '@/components/common/Ui/Catalyst/fieldset';
import { Select } from '@/components/common/Ui/Catalyst/select';
import './GoogleTranslate.module.css';


export default function CombinedLocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations('LocaleSwitcher');

  useEffect(() => {
    const googleTranslateElementInit = () => {
      if (
        typeof window.google === 'object' &&
        typeof window.google.translate === 'object' &&
        !window.googleTranslateElementInitialized
      ) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,ko,ja',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
        window.googleTranslateElementInitialized = true;
      }
    };

    window.googleTranslateElementInit = googleTranslateElementInit;

    if (!window.googleTranslateScriptAdded) {
      const script = document.createElement('script');
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
      window.googleTranslateScriptAdded = true;
    } else if (window.google && window.google.translate) {
      googleTranslateElementInit();
    }
  }, []);

  const setGoogleTranslateLanguage = (lang) => {
    const langPair = `/en/${lang}`;
    document.cookie = `googtrans=${langPair};path=/;expires=Fri, 31 Dec 9999 23:59:59 GMT;`;
  };

  const onSelectChange = (e) => {
    const nextLocale = e.target.value;

    // Google Translate 쿠키 설정
    setGoogleTranslateLanguage(nextLocale);

    // 새 언어로 페이지 이동
    window.location.href = `/${nextLocale}`;
  };

  return (
    <>
      <div id="google_translate_element" style={{ display: 'none' }} />
      <Field>
        <Label>
          <p className="sr-only">{t('Change Language')}</p>
          <Select
            value={locale}
            className="bg-transparent py-2 space-x-4 text-xl"
            onChange={onSelectChange}
          >
            <option value="en">🇺🇸 {t('English')}</option>
            <option value="ko">🇰🇷 {t('Korean')}</option>
            <option value="ja">🇯🇵 {t('Japanese')}</option>
            {/* 필요한 언어 추가 */}
          </Select>
        </Label>
      </Field>
    </>
  );
}