# RFxchange Internationalization Foundation

## Status

Implemented foundation for interface localization.

Supported interface locales:

- `en-US`
- `es`
- `fr`
- `it`
- `de`

English (`en-US`) is the source catalog and the fallback locale.

## Product boundary

The RFxchange localizes only content controlled by the platform:

- navigation, buttons, labels, instructions, and accessibility text;
- platform-generated marketing content;
- platform-generated validation, status, and error text;
- platform-generated notifications and transactional communications when those surfaces are migrated;
- approved RFxchange-owned policies after professional translation and legal review.

Participant-authored content is never translated.

This exclusion includes:

- user-entered RFx requirements;
- proposal and response narratives;
- contractual terms;
- private messages;
- certifications and licenses;
- organization-authored legal representations;
- organization-authored free-text descriptions;
- participant-supplied attachments and other evidentiary material.

Uploaded documents are never translated.

The platform does not create, store, display, or imply the existence of automatically translated participant documents. A localized interface does not mean that an RFx, response, message, certification, license, legal representation, or attachment is available in the selected interface language.

## Resolution order

The request locale is resolved in this order:

1. The explicit `rfx-locale` cookie set by the language selector.
2. The first language in the browser `Accept-Language` header.
3. The English fallback locale.

An explicit selection is stored for one year. Future account-preference persistence may replace or synchronize the browser cookie, but must preserve the same supported locale contract.

## Implementation

- `src/i18n/config.ts` defines supported locales and normalization.
- `src/i18n/messages/*.json` contains controlled platform messages.
- `src/i18n/get-dictionary.ts` returns the resolved catalog.
- `src/i18n/server.ts` resolves request locale on the server.
- `I18nProvider` exposes localized client-component text without translating participant content.
- `LanguageSwitcher` persists the explicit selection and refreshes the server-rendered interface.
- The root layout sets the document language and localized metadata.
- The public marketing header, footer, and home page are the first completed localized surfaces.
- `scripts/validate-internationalization.mjs` enforces catalog parity and boundary invariants.

## Formatting

Dates, times, numbers, percentages, and currency must use the resolved locale through `Intl` APIs. Currency values must retain their actual currency code; changing the interface locale must not convert monetary value.

## Feature completion rule

A new platform-controlled customer-facing string must be added to every supported locale catalog in the same feature slice. A feature is not multilingual-complete when it:

- contains hard-coded customer-facing English;
- omits translated accessibility text;
- translates or mutates participant-authored content;
- creates a translated copy of an uploaded file;
- presents a localized control as evidence that the underlying participant content was translated.

## Release rule

The language selector may remain available while migration continues, but a product surface may be publicly represented as fully localized only after its interface, accessibility text, notifications, applicable policies, and configured-browser acceptance have passed in all five locales.
