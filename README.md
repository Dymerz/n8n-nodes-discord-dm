# n8n-nodes-discord-dm

Discord triggers and a direct-message action for self-hosted n8n. This package
bundles `discord.js` and is not eligible for n8n Cloud.

[Install](#installation) · [Triggers](#triggers) · [Actions](#actions) · [Credentials](#credentials) · [Development](#development)

## Installation

Install this package using the [n8n community node guide](https://docs.n8n.io/integrations/community-nodes/installation/).

## Triggers

| Node | What it does |
| --- | --- |
| **Discord Direct Message Trigger** | Emits non-bot DMs as one item. Adds a 👀 reaction, sends a typing indicator, and includes attachments as `attachment_0`, `attachment_1`, etc. |
| **Discord Reaction Added Trigger** | Emits reaction and user data when a reaction is added. |
| **Discord Reaction Removed Trigger** | Emits reaction and user data when a reaction is removed. |

Triggers emit Discord event data. Discord may resend events after reconnects;
deduplicate by event or message ID if your workflow performs non-idempotent
actions.

## Actions

| Node | What it does |
| --- | --- |
| **Discord Send Direct Message** | Sends a message to a Discord user. Optionally attaches an input binary property; long messages are sent in 2,000-character chunks. |

## Credentials

Create a bot in the [Discord Developer Portal](https://discord.com/developers/applications), then add a **Discord Bot API** credential in n8n.

| Field | Purpose |
| --- | --- |
| **Debug Bot Token** | Used while manually testing workflows in the editor. |
| **Production Bot Token** | Optional; used for active workflows. If empty, the debug token is used. |

The bot needs access to relevant channels and message history to observe
reactions. It must share a DM conversation with users to receive or send DMs,
and have permission to add reactions for the DM trigger.

Keep bot tokens private. Discord may invalidate exposed tokens.

## Development

Use the n8n node CLI for local development:

```sh
pnpm install
pnpm dev
```

For the included Docker Compose setup:

```sh
pnpm install
pnpm build
docker compose up
```

Open [localhost:5678](http://localhost:5678). To rebuild on changes, run
`pnpm build:watch` in another terminal. Restart the Compose service after
changing a node, then refresh the n8n editor.

Useful commands: `pnpm build`, `pnpm lint`, `pnpm build:watch`.

## Resources

- [n8n community nodes](https://docs.n8n.io/integrations/#community-nodes)
- [Discord Gateway](https://discord.com/developers/docs/topics/gateway)
- [Discord bot permissions](https://discord.com/developers/docs/topics/permissions)
