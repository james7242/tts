'use client';
import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import './GoogleTranslate.module.css';
import './flags.css'; // Make sure to import your flags.css

export default function CombinedLocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations('LocaleSwitcher');

  const [selected, setSelected] = useState(locale);

  useEffect(() => {
    console.log(`Selected locale: ${selected}`, locale);
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
  }, [locale]);

  const setGoogleTranslateLanguage = (lang) => {
    const langPair = `/en/${lang}`;
    console.log('Setting googtrans cookie:', `googtrans=${langPair}`);
    document.cookie = `googtrans=${langPair};path=/;expires=Fri, 31 Dec 9999 23:59:59 GMT;`;
  };

  const onSelectChange = (nextLocale) => {
    console.log('onSelectChange', nextLocale);
    setGoogleTranslateLanguage(nextLocale);
    window.location.href = `/${nextLocale}`;
  };

  const languages = [
    { code: 'en', name: t('English') },
    { code: 'ja', name: t('Japanese') },
    { code: 'ko', name: t('Korean') },
    // Add more languages as needed
  ];

  console.log(selected)

  return (
    <>
      <div id="google_translate_element" style={{ display: 'none' }} />
      <Listbox
        value={selected}
        onChange={(value) => {
          setSelected(value);
          onSelectChange(value);
        }}
      >
        <Label>
          <p className="sr-only">{t('Change Language')}</p>
          <div className="relative mt-1">
            <ListboxButton className="relative w-full cursor-default rounded-md bg-transparent py-2 pl-3 pr-10 text-left text-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm">
              <span className="flex items-center">
                <span className={`flag ${selected}`} />
                <span className="ml-3 block truncate">
                  {languages.find((lang) => lang.code === selected)?.name}
                </span>
              </span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </span>
            </ListboxButton>
            <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-accent-1 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {languages.map((lang) => (
                <ListboxOption
                  key={lang.code}
                  value={lang.code}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-3 pr-4 ${active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                    }`
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex items-center">
                        <span className={`flag ${lang.code}`} />
                        <span
                          className={`ml-3 block truncate ${selected ? 'font-semibold' : 'font-normal'
                            }`}
                        >
                          {lang.name}
                        </span>
                      </div>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 right-0 flex items-center pr-4 ${active ? 'text-white' : 'text-indigo-600'
                            }`}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </div>
        </Label>
      </Listbox>
    </>
  );
}
