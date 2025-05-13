'use client';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Field, Label } from '@/components/common/Ui/Catalyst/fieldset'
import { Select } from '@/components/common/Ui/Catalyst/select'

export default function LocaleSwitcher() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const localActive = useLocale();

  const t = useTranslations("LocaleSwitcher");

  const onSelectChange = (e) => {
    const nextLocale = e.target.value;
    startTransition(() => {
      router.replace(`/${nextLocale}`);
    });
  };
  return (
    <Field>
      <Label>
        <p className='sr-only'>{t("Change Language")}</p>
        <Select
          defaultValue={localActive}
          className='bg-transparent py-2 space-x-4 text-xl' // 전체 폰트 크기 조정
          onChange={onSelectChange}
          disabled={isPending}
        >
          <option value='en'> 🇺🇸 {t("English")}</option>
          <option value='ko'>🇰🇷 {t("Korean")}</option>
        </Select>
      </Label>
    </Field>
  );
}