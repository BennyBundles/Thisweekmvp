# This Week — Hosted Auth Production Setup

This guide is the operator checklist for the hosted Supabase Auth settings required before `account/release-config.js` may declare public Auth ready.

## Canonical URLs

Application Site URL:

`https://bennybundles.github.io/Thisweekmvp/`

Account confirmation redirect:

`https://bennybundles.github.io/Thisweekmvp/account/`

Password recovery redirect:

`https://bennybundles.github.io/Thisweekmvp/account/?mode=recovery`

Do not replace these with broad wildcard redirects unless there is a documented release need.

## Supabase hosted configuration

Project ref:

`xjtvawmppzwzrooairyx`

### URL configuration

In Supabase Dashboard:

**Authentication → URL Configuration**

Set the Site URL to the production This Week URL and add the two Account Center redirects above to the allowed redirect URLs.

After testing signup confirmation and password recovery, set:

- `hostedAuth.siteUrlVerified=true`
- `hostedAuth.redirectAllowlistVerified=true`

### Email confirmation

In:

**Authentication → Providers → Email**

Keep email confirmation enabled for public signup.

After a real confirmation email round trip succeeds, set:

`hostedAuth.emailConfirmationsVerified=true`

### CAPTCHA

Supabase currently supports hCaptcha and Cloudflare Turnstile for Auth bot protection.

This Week's client implementation is prepared for **Cloudflare Turnstile**.

1. Create a Turnstile widget for `bennybundles.github.io`.
2. Copy the **public site key** into `account/release-config.js`.
3. Put the **secret key only in Supabase Dashboard** under Authentication → Bot and Abuse Protection.
4. Enable CAPTCHA protection in Supabase.
5. Verify sign-in, signup, and password recovery.
6. Set `captcha.supabaseProtectionVerified=true`.

Never put the Turnstile secret key in GitHub, GitHub Pages, localStorage, sessionStorage, or the Account Center release config.

### Production email

Supabase recommends a custom SMTP provider for production Auth emails.

Configure SMTP in:

**Authentication → Emails → SMTP Settings**

Use a trusted sender/domain, test confirmation and recovery delivery, and disable link tracking if the mail provider rewrites Auth links.

After delivery is verified, set:

`hostedAuth.customSmtpVerified=true`

### Security notifications

Review Supabase security notification emails for events such as:

- password changed;
- email changed;
- MFA factor enrolled/removed;
- identity linked/removed.

After verification, set:

`hostedAuth.securityNotificationsVerified=true`

## Public-ready switch

Only after all required gates pass should:

`publicAuthReady:true`

be committed.

The Account Center release checker will reject `publicAuthReady:true` if required hosted/CAPTCHA assertions are still false.
