# dima preview: personal-data flow audit

## Scope and limits

This audit covers the files in this static front-end preview. It has no backend, database, authentication provider, analytics, error-tracking SDK, or payment/email API configured. Form handlers prevent normal submission and show a preview-mode notice. They do not serialize or transmit the entered values.

## Collection map

| Data | Where a visitor can enter it | What happens now | Storage or recipient |
|---|---|---|---|
| Full name | Create Account; Order Details | Remains in the input element in the current page. Form submission is prevented. | No application storage or recipient. Leaving/reloading the view removes it from the page. |
| Email address | Create Account; Log In; Order Details; Checkout receipt email | Remains in the input element. No account, sign-in, order, or receipt request is sent. | No application storage or recipient. |
| Password | Create Account; Log In | Remains in the password input while that view is open. It is not sent to a hashing function because no authentication backend exists. It is not stored, logged, or returned by an API. | No application storage or recipient. A real backend must hash passwords server-side with Argon2id, bcrypt, or scrypt before storage. |
| Country | Create Account | Remains in the select control. No submission occurs. | No application storage or recipient. |
| Date of birth | Create Account; optional | Remains in the date input. No submission occurs. | No application storage or recipient. Keep optional unless there is a documented need. |
| One-time verification code | Verify Email | Remains in the input. No code is sent, checked, or saved in this preview. | No application storage or recipient. |
| Website/business name | Order Details | Remains in the input. The order form is not submitted. | No application storage or recipient. |
| Plan selection and domain preference | Order Details | Remain in the select/text controls. Domain availability is not checked. | No application storage or recipient. |
| Project purpose, requested pages/features, extra requirements | Order Details | Remain in text areas. No order is created or submitted. | No application storage or recipient. |
| Payment provider choice and receipt email | Checkout | Remain in page controls. The checkout button only displays a notice; no provider is opened. | No application storage or payment provider. Card number, CVC, and expiry fields are not present. |
| Phone number or postal address from a customer | No customer field exists | Not collected by the application. | None. The displayed phone number and email address belong to the business and are static contact details. |
| IP address and request/device headers | Not read by application code | A web host necessarily receives network request metadata to serve the page. The exact metadata retained in logs depends on the eventual hosting provider and its configuration. | Hosting provider only; no host has been configured or audited here. |

All current forms use the page DOM as temporary input state. The app has no `localStorage`, `sessionStorage`, IndexedDB, or cookie code. Route changes replace the page markup, and reloads discard the entered values.

## Outbound data and third parties

- No analytics, advertising, error reporting, AI, email-delivery, authentication, database, or payment SDK/API is active.
- Google Fonts was removed from the page. The site now uses system fonts, so page loads no longer request font files from Google.
- Email and phone links contain the business's public contact details. Clicking them opens the visitor's email or calling app. Any message content is composed and sent by the visitor, outside this app.
- The account-deletion link opens an email draft addressed to the business with a generic subject. It contains no automatically inserted user data and sends nothing unless the visitor reviews and sends the draft.

## Logs, responses, cookies, and deletion

- No `console`/logger/print statements were found in the app source.
- There are no API endpoints or API responses to filter. Customer dashboards and admin screens are placeholders and contain no customer records.
- No cookies or browser storage APIs are used by the app.
- The preview does not create or store accounts, so there is no stored account data to delete. A manual email request link is available from Settings → Delete account. It is not an automatic deletion operation. A live system needs an authenticated server-side deletion flow that verifies the requester and deletes or anonymizes profile and project data, while documenting any records retained for legal or payment obligations.

## Changes made during this audit

1. Removed Google Fonts preconnect and stylesheet requests; switched to system font stacks.
2. Added an account-deletion information page and a link from Settings. The page clearly distinguishes a manual request from actual backend deletion.
3. Updated the privacy page to explain current preview behavior, temporary form state, host request metadata, and deletion limits.

## Before connecting a backend

Keep credentials and personal data server-side where possible. Do not persist passwords in plaintext; hash them with Argon2id, bcrypt, or scrypt. Use secure, HTTP-only, same-site cookies for sessions. Avoid storing PII in browser storage. Authenticate and authorize every endpoint, return only the fields required by the current user, and implement verified account deletion across all related records. Review the hosting provider's access logs and retention settings before launch.
