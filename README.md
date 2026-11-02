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
| **Discord Component Interaction Trigger** | Emits custom-ID button and select-menu interactions after immediately acknowledging them. |
| **Discord Reaction Added Trigger** | Emits reaction and user data when a reaction is added. |
| **Discord Reaction Removed Trigger** | Emits reaction and user data when a reaction is removed. |

Triggers emit Discord event data. Discord may resend events after reconnects;
deduplicate by event or message ID if your workflow performs non-idempotent
actions.

## Actions

| Node | What it does |
| --- | --- |
| **Discord Send Direct Message** | Sends a plain-text or Components V2 message, or sends and waits for an approval or free-text response. Text messages can attach an input binary property; long text is sent in 2,000-character chunks. |
| **Discord Respond to Component Interaction** | Updates the original Components V2 message or sends a text or Components V2 follow-up from an interaction trigger. |

The send node defaults to **Text**, preserving the existing message and attachment
behavior. Select **Components V2** to build a layout using structured fields:
text displays, containers and their child components, sections with thumbnail or
button accessories, separators, media galleries, files, action rows, buttons,
and select menus. Use each component's **Position** to order mixed component
types; when positions match, the node uses its stable component-type order.

Discord Components V2 messages require component content instead of the regular
message content, embeds, polls, or stickers. Discord also limits a message to
40 total components (including nested children), 4,000 characters across text
displays, 10 items per media gallery, three text displays per section, and
either up to five buttons or one select menu per action row. A select menu can
have up to 25 options. The node validates these limits before sending.

Media gallery, file, and thumbnail URLs can be external HTTP(S) URLs. For an
input binary property, set **Binary Property** and reference the attached file
in a component URL as `attachment://<file-name>` (use the binary file's name).
Components V2 requires every attached file to be referenced in a component.

### Handling buttons and select menus

Link buttons open their URL and do not need interaction handling. To process
custom-ID buttons or select menus:

1. Add **Discord Component Interaction Trigger**, using the same bot credential
   as the sender. Optionally filter on an exact **Custom ID Filter**.
2. Connect the trigger output to the workflow logic and then to **Discord
   Respond to Component Interaction**.
3. Choose **Update Original Message** to replace the original layout, or a
   follow-up mode to send a separate response.

The trigger immediately defers the component update so Discord's interaction
acknowledgement deadline is met, then emits `componentInteraction` data,
including the selected values and the interaction token needed by the response
action. The response action can only use that token for a limited time (up to
15 minutes). Treat it as a secret: do not log, expose, or store it longer than
needed. Interaction responses cannot attach binary files; use externally hosted
URLs for media in response layouts.

### Asking a user and waiting for a response

Set **Message Type** to **Send and Wait for Response** in **Discord Send Direct
Message** to send a question and wait for either a button-based approval or a
free-text response. Approval button labels and the response timeout are
configurable. In free-text mode, the first new DM from that user after the
prompt is sent is used as the response; it does not need to be a reply to the
prompt. The output includes the sent message and `responseType`, `response`,
and `approved` for approval responses.

The node stays active while waiting; its timeout is bounded from 1 minute to
24 hours, and n8n's own execution timeout may stop it sooner.

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
