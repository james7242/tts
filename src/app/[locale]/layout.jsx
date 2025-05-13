
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import ThemeWrapper from '@/components/utils/ThemeWrapper';
import "../../../assets/main.css";
import ThemeToggle from "@/components/common/Switchers/ThemeToggle";
// import LocaleSwitcher from "@/components/common/Switchers/LocaleSwitcherWithGoogle";
// import GoogleTranslate from "@/components/common/GoogleTranslate/GoogleTranslate";

export default async function LocaleLayout(props) {
  const { children } = props;

  // Await the `params` object before accessing its properties
  const params = await props.params;
  const { locale } = params;

  // Check if the locale is valid
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  // Fetch messages for the given locale
  const messages = await getMessages(locale);

  return (
    <html lang={locale}>
      <body>
        <ThemeWrapper>
          <NextIntlClientProvider messages={messages}>
            <div className="flex flex-row justify-end items-center pr-4 text-accent-9">
              <div className="mr-3 notranslate">
                {/* <LocaleSwitcher /> */}
                {/* < GoogleTranslate /> */}
              </div>
              <div className="">
                <ThemeToggle />
              </div>
            </div>
            {children}
          </NextIntlClientProvider>
        </ThemeWrapper>
      </body>
    </html>
  );
}
