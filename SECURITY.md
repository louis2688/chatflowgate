# Security Policy

ChatFlowGate sits between the public internet and its customers' n8n workflows.
A flaw here can expose a webhook that was meant to stay private, so security
reports are taken seriously and answered.

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Report it privately, whichever is easier:

- **GitHub** — open a [private security advisory](https://github.com/louis2688/chatflowgate/security/advisories/new)
  (Security tab → Report a vulnerability). Preferred, because the discussion and
  the fix stay linked.
- **Email** — security@chatflowgate.com

Helpful things to include, as far as you have them: what you did, what happened,
what you expected, and anything that helps reproduce it. A proof of concept is
welcome but never required — a clear description of the flaw is enough to start.

## What to expect

| | |
| --- | --- |
| First reply | within 3 working days |
| Assessment and severity | within 7 working days |
| Fix for a confirmed high-severity issue | as fast as we can, and you will be told the timeline |

You will be credited in the advisory unless you would rather not be. If a report
turns out not to be a vulnerability, you will get a straight explanation of why
rather than silence.

## Scope

**In scope** — anything that lets someone:

- read or send messages for a bot belonging to another workspace
- reach a customer's webhook URL, or make the gateway call a host it should not
- forge, replay or extend a visitor session token
- bypass rate limiting, credit metering, IP bans or geofencing
- escalate privileges inside a workspace, or read another workspace's analytics
- inject content that executes in the widget or the dashboard

**Out of scope**

- findings against the demo bot's canned responses
- missing hardening headers with no demonstrated impact
- automated scanner output with no working proof of concept
- social engineering, physical access, or denial of service by volume alone
- vulnerabilities in n8n itself — report those to the n8n project

## Testing, and where the line is

Please test only against your **own** workspace and your own bots. Do not attempt
to reach another customer's data, and do not run load or stress tests against the
hosted service.

If you find something and want to confirm the impact, stop at the point where the
flaw is demonstrated. You do not need to extract data to prove a data-access bug.

## Supported versions

The hosted service at chatflowgate.com always runs the latest `main`. Self-hosted
deployments running older commits are not separately patched — update to `main`.