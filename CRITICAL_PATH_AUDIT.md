# Critical-path security audit

## Scope and decision

Reviewed the static front end in `index.html`, `app.js`, `styles.css`, and the existing deployment/data-flow notes. This project currently has no application server, API routes, database driver, authentication provider, payment SDK, webhook handler, or file-upload path. The login, signup, OTP, order, checkout, dashboard, and owner screens are previews.

**Result:** I found no currently exploitable server-side authentication, IDOR, payment, SQL injection, or upload vulnerability because those backend paths do not exist. This is **not ready to accept real accounts, customer orders, or payments**. A static client cannot securely enforce identity, ownership, prices, or paid access.

## Findings

### 1. Authentication and passwords are preview-only

- **Location:** `app.js:21-23` defines the login, signup, and OTP views; `app.js:39` intercepts preview form submissions.
- **Current behavior:** Submissions are prevented and display a preview notice. The page does not send or persist entered values. No password hash, session, JWT, reset token, or authentication endpoint exists.
- **Exploitability now:** There is no login endpoint or account store to attack. A visitor can type into the fields, so these screens must not be represented as working authentication; the warnings already say not to enter real credentials.
- **Exact fix before activation:** Connect a real server-side or managed-auth service. Hash passwords with Argon2id (or bcrypt/scrypt) on the server; never return hashes. Generate reset tokens with a cryptographically secure random source, store only a hash, bind each token to one account, enforce one-time use and an expiry of 15 minutes or less. Use secure, HttpOnly, SameSite cookies for sessions, enforce authorization on every server request, and revoke the session on logout. Rate-limit login, signup, OTP, and reset endpoints.

### 2. The owner route is public, but only contains mock data

- **Location:** `app.js:3-5` allowlists client-side hash routes; `app.js:30` renders the owner-studio preview; `app.js:7` includes its navigation link.
- **Current behavior:** Anyone can open `#/admin` and see static labels, data-group descriptions, and the public business email. The page explicitly says it is a public preview, contains no customer records, and has no live admin actions.
- **Exploitability now:** Direct navigation reveals only the mock interface and its intended data model. There is no client-supplied user ID accepted by a server, so no current IDOR path exists.
- **Exact fix before adding real admin data/actions:** Remove the public owner-studio route/link from the customer build or put the admin UI behind a real server session. For every admin API request, verify the authenticated account's server-side role; do not trust a route guard, hidden button, client-supplied email, or user ID. For customer/project reads and writes, scope the database query to the authenticated account and return only fields that account may access.

### 3. Password reset, JWT lifecycle, and protected API routes are absent

- **Location:** No reset API, token issuance code, JWT library/configuration, session middleware, logout revocation, or protected API route was found. The “Need help?” link in `app.js:21` opens the contact page; it is not a reset flow.
- **Current behavior / exploitability:** No tokens or protected endpoints exist to forge, replay, or use for IDOR. The dashboard and project views (`app.js:26-27`) contain only placeholders.
- **Exact fix before activation:** Implement reset and session flows server-side as described above. If JWTs are chosen, keep the signing key server-only and strong, set a short expiry and strict issuer/audience checks, rotate refresh tokens, and revoke sessions on logout (for example, server-side session records or a token-version/revocation mechanism). Check ownership in every endpoint that addresses a project/order; never authorize by a request-body `userId` alone.

### 4. Checkout has no payment processing or server-verified price

- **Location:** `app.js:10` renders the three displayed plan amounts; `app.js:25` is a static checkout page; its button only shows a preview notice.
- **Current behavior:** No payment SDK, payment API request, webhook endpoint, order total calculation, or paid-feature activation exists. Plan prices are display text only and are not an authority for charging.
- **Exploitability now:** Editing the page or its displayed amount cannot obtain a paid service because no charge or paid access is granted. There is no webhook to forge.
- **Exact fix before accepting payments:** The server must accept a plan identifier and look up the amount/currency from trusted server configuration or the database. Ignore client-submitted totals, discounts, taxes, and payment status. Create the provider checkout/payment intent on the server. Verify Stripe/Razorpay/PayPal webhook signatures against the raw request body, validate event type and amount/currency/order reference, handle events idempotently, and grant access only after the server records a verified successful payment. Keep secret provider keys server-side; never store card numbers.

### 5. Inputs, SQL/XSS, and uploads

- **Location:** Form fields are in `app.js:21-25`; route allowlisting is `app.js:5`; template rendering is `app.js:37`.
- **Current behavior:** Form values are not read into page markup or sent to a service. `currentRoute()` returns only one of the known route names. `render()` inserts the app's fixed page templates. No SQL/query code, database call, file input, upload endpoint, or third-party API request exists.
- **Exploitability now:** I found no SQL injection or reflected/stored XSS path through the current form fields, and no upload surface. The HTML renderer would become dangerous if future code interpolates customer-controlled text into its templates without context-aware escaping.
- **Exact fix before adding dynamic content or uploads:** Validate all fields on the server and use parameterized database statements. Render user text with DOM `textContent` or a context-appropriate escaping/template mechanism; sanitize any intentionally supported rich HTML with a maintained allowlist sanitizer. For uploads, validate content using server-side file inspection (not filename/MIME alone), set strict size/count limits, generate server-side names, scan as appropriate, and store outside the executable/public app origin with controlled download authorization.

### 6. External data transfer and storage

- **Location:** Source files `app.js` and `index.html`.
- **Current behavior:** No `fetch`, XHR, WebSocket, browser storage, cookie access, analytics, email SDK, or payment SDK was found. There are no application logs or API responses to leak submitted form data.
- **Exploitability now:** The application itself does not transmit form entries. As with any hosted static site, the selected host may process ordinary request metadata such as IP address and browser headers; confirm the host's logging and retention policy.
- **Exact fix before adding integrations:** Document each data field and destination, send only the minimum necessary fields, keep secrets and privileged API calls on the server, redact personal data from logs, and filter response fields to the caller's needs.

## Summary by requested area

| Area | Current finding | Status |
|---|---|---|
| Authentication and authorization | UI only; no auth middleware or protected API | No current exploit; backend required |
| IDOR | No user-ID API or customer records | Not present in this preview |
| Reset tokens / JWT / logout | No token or session implementation | Not present; implement securely before enabling auth |
| Payment tampering | No payment request or paid entitlement | No current exploit; server pricing and verified webhooks required |
| SQL injection | No database or SQL | Not present |
| XSS | Static templates; current form inputs are not inserted into markup | No current form-to-render exploit found |
| File uploads | No upload control or endpoint | Not present |
| Logs / external integrations | No app logs or third-party SDKs/API calls found | No application-side PII transfer found |

The existing [deployment audit](DEPLOYMENT_AUDIT.md) covers headers and general deployment checks. Its `_headers` rules still need verification on the actual hosting provider. No dynamic security tests were run because there are no live server paths to exercise.

## Attacker-path checklist

| Attack path | Result and possible damage | Fix / status |
|---|---|---|
| Change user, order, or document IDs | No endpoint accepts these IDs. There is no private record store to read or alter. | No current IDOR fix is applicable. Add server-side owner-scoped queries before adding records. |
| Omit, corrupt, or expire an auth token; try default admin credentials | No auth API, token validator, credential store, or default account exists. Login is a static preview. | No current login bypass. Do not enable customer features until server authentication and sessions are implemented. |
| Guess admin URLs or edit a role claim | `#/admin` is directly reachable, but only exposes a mock data model and public contact address; there are no role claims or actions to escalate into. | Low-impact interface disclosure only. Keep the explicit preview label; remove the route from a customer build or enforce server-side admin roles before connecting data/actions. |
| Mass signup, spam messages, upload files, flood APIs, reuse promo codes/trials/referrals | No signup endpoint, messaging feature, upload, API, discount, trial, or referral logic exists. | No abuse path currently exists. Add server-side quotas, rate limits, upload validation/storage limits, and single-use promotion rules if those features are introduced. |
| Inject JavaScript or SQL through text fields/search/login | No search/filter or SQL path exists. Form values are not interpolated into the fixed HTML templates. | No current injection path found. Keep user text out of `innerHTML`; validate server-side and use parameterized SQL if a backend is added. |
| Request `.env`, `.git`, docs, or health endpoints | In the local site folder there is no `.env`, `.git` directory, API docs, health endpoint, or server error handler. `.env.example` contains placeholders only and has been moved to the parent `outputs` folder, outside the static publish folder. The local `.gitignore` contains ignore rules only. | Local artifact has no secret/config exposure found. A remote host's dotfile handling cannot be tested without its deployed URL/config; publish only the intended site directory and verify `/.env`, `/.env.example`, `/.git/`, and internal docs return 404. |
| Change price, submit a negative amount, stack discounts, or unlock paid access | Prices are static display text; no charge, promotion, trial, referral, or entitlement is processed. | No current business-logic exploit. Before payment launch, calculate amounts from server-owned plan records and grant access only after a verified, idempotently processed provider event. |

**Severity summary:** no current data-theft or unauthorized-action path was found. The public owner preview is low-impact static disclosure. Remote hosting behavior remains unverified because this workspace has no deployed URL or host configuration.

## FTP upload error reported by the user

- **Repository evidence:** The publish folder contains only static `index.html`, `app.js`, `styles.css`, `_headers`, and documentation/configuration files. There is no file input, upload form, upload API, server/backend code, FTP/SFTP/FTPS package, host/port/protocol configuration, or FTP-related error string in the application source. The existing order form is only a website-project brief and its submit handler prevents submission.
- **Root-cause conclusion:** `Upload failed: FTP login failed` is not generated by this repository's current website code. The evidence does not identify whether the separate uploader/deployment path uses FTP, SFTP, or FTPS, and it provides no basis to identify or change credentials. The message likely comes from a separate hosting/deployment uploader or a different codebase; that cannot be confirmed from these files alone.
- **Code change:** None is safe or applicable: there is no upload implementation to patch. I did not add an FTP client, change protocol settings, invent environment variables, expose secrets, or contact an external server.
- **Safe next step outside this code change:** Identify which application/tool displays the error and inspect its non-secret connection diagnostics in the hosting/deployment panel. If that system is configured to use FTP credentials, set or rotate them only in that system's protected settings/secret store. Do not paste passwords into this static front end or commit them. Once the actual uploader source/configuration and protocol are present in the repository, its authentication, connection, and permission errors can be separated in code without changing multi-file progress behavior.
