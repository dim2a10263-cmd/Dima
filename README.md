# dima website preview

This is a responsive, multi-page front-end preview for the dima website. Open `index.html` in a modern browser. Navigation uses hash routes, and each view updates its page title.

## Included

- Home, pricing, sign-in, account creation, email verification, project brief, checkout, customer dashboard, project details, owner studio, contact, privacy, and terms views.
- Responsive white-and-black visual design, custom smile/plus logo, CSS 3D website preview, six template concepts, scroll-triggered reveals, hover interactions, and reduced-motion support.
- The owner studio includes a plain-language outline of the intended customer, plan, order, payment, content, and update data groups.
- Forms explain when real authentication, email delivery, backend order storage, and payment integrations must be configured.
- The current preview uses local system fonts and makes no third-party API calls.
- See [DATA_FLOW.md](DATA_FLOW.md) for the personal-data collection, storage, and outbound-flow map.
- See [DEPLOYMENT_AUDIT.md](DEPLOYMENT_AUDIT.md) for the pre-deployment security check results.
- See [CRITICAL_PATH_AUDIT.md](CRITICAL_PATH_AUDIT.md) for the authentication, authorization, payment, and input-handling review.

## Before accepting real customers

This is a front-end preview. Account creation, OTP delivery, login, private customer records, order submission, and payments are not connected to live services. Add a secure backend and database; configure a verified email provider and a payment provider (Stripe, Razorpay, or PayPal); and protect the owner role server-side. Keep payment and email secrets in server-side environment settings.

The `_headers` file sets security response headers for static hosts that support this format, including Cloudflare Pages and Netlify. Deploy over HTTPS so the one-year HSTS header takes effect, and confirm the selected host applies these rules. If you later add server functions or APIs, configure headers, error handling, rate limits, and CORS on those server responses too.

Confirm whether the USD prices are one-time fees, and define domain registration, renewal, ownership, refund, revision, delivery, and cancellation terms. Add the international country code to the WhatsApp number before enabling a `wa.me` link. Review the draft privacy and terms pages before publication.

## Secret safety

The current source scan found no API keys, passwords, tokens, database connection strings, or private-key values in the project files. This static preview does not currently read environment variables or connect to Supabase, Stripe, Razorpay, PayPal, or an email provider. The safe `.env.example` template is stored at [the workspace level](../.env.example), outside this static site's publish folder; the current preview requires no environment variables.

**Rotate any credentials that were previously hardcoded or committed immediately.** Removing a credential from the current source does not remove it from Git history. No Git repository metadata is present in this workspace, so commit history could not be inspected. The supplied contact email and phone number are intentionally displayed as public business contact details, not treated as credentials.
