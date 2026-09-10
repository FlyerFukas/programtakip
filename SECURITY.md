# Security

## Reporting a vulnerability

Open a [security advisory](https://github.com/mrFurkan33333/program-takip/security/advisories/new)
or a private issue. Please do not disclose publicly before a fix is available.

## Threat model

This is a **single-user personal application**. It is not multi-tenant and has
no account system; access is one password plus an HMAC-signed cookie.

- `DATABASE_URL` is read **server-side only** and never reaches the browser.
  It carries no `NEXT_PUBLIC_` prefix, which is what keeps it out of the
  client bundle.
- All writes go through Server Actions, and every one of them calls
  `oturumZorunlu()` as its first statement. Relying on the layout guard is not
  enough: Server Actions can be POSTed directly, without passing through it.
- The session cookie stores an expiry timestamp signed with `OTURUM_GIZLI`.
  No session state is kept on the server, so a tampered cookie fails the
  signature check rather than granting access.
- Password comparison is constant-time and hashes both sides first, so the
  length difference itself does not leak.
- `.env*` files are gitignored (only `.env.local.example` is tracked). Verify
  with `git check-ignore -v .env.local` after cloning.

## If you deploy this yourself

Set `APP_PAROLA` to something you do not use elsewhere, and generate
`OTURUM_GIZLI` with `npm run gizli` rather than typing one by hand. Anyone who
learns the password gets full read and write access to the database.
