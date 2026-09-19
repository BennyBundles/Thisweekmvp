# Codex operating instructions

Read [CODEX_HANDOFF.md](CODEX_HANDOFF.md) before making changes, then the linked runbooks for the area touched. This repository must be understandable without chat history.

- Preserve production behavior unless the current task explicitly authorizes a behavior change.
- Main is production: every push triggers Pages deployment. Use a review branch for documentation and development.
- Never activate live money, verify release gates, activate the production risk policy, grant staff roles, configure external notification delivery, or activate rewards as a side effect of development.
- Keep the planner browser-local and its CSP `connect-src 'none'`. Do not turn Available Now into a bank/custody balance.
- Keep service credentials, provider tokens, passwords, PAN/CVV and full account numbers out of public source, browser storage, exports and logs.
- Preserve recoverable Auth, active-session checks, required AAL2, server-managed staff roles, signed webhooks, replay/idempotency protections, atomic integer-cent accounting, and append-only history.
- Supabase project is shared with unrelated applications. Scope inspection and changes to This Week resources; never reset the database or bulk-deploy/delete unrelated functions.
- Treat phase documents as historical implementation notes. Verify current state; do not infer deployment or readiness from source presence.
- Run the documented checks on staged production HTML. Never weaken tests or security gates to obtain a green result.
- Completion reports must name exact commits and verification results. A successful build is not proof of deployed identity or provider end-to-end correctness.
