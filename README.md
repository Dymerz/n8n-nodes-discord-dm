# n8n-nodes-discord-triggers

This n8n community node starts workflows from Discord bot events delivered over
the Discord Gateway and can send direct messages through the Discord REST API.
It provides separate triggers for direct messages, added reactions, and removed
reactions, plus a node for sending a direct message to a user.

This package uses `discord.js` and bundles it into each node entry during the
build, so the published package has no runtime dependency that n8n must
install. It is intended for self-hosted n8n installations and is not eligible
for n8n Cloud community-node loading.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) · [Triggers](#triggers) · [Actions](#actions) · [Credentials](#credentials) · [Local development](#local-development) · [Usage](#usage) · [Resources](#resources)

## Installation

Follow the [community node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

## Triggers

* **Discord Direct Message Trigger** — emits raw `MESSAGE_CREATE` payloads
  received in direct-message or group-direct-message channels, excluding
  messages sent by bots. It also sends Discord's typing indicator before
  emitting each message.
* **Discord Reaction Added Trigger** — emits raw `MESSAGE_REACTION_ADD`
  payloads.
* **Discord Reaction Removed Trigger** — emits raw `MESSAGE_REACTION_REMOVE`
  payloads.

Each trigger emits the complete Discord Gateway event data as one n8n item.

## Actions

* **Discord Send Direct Message** — creates or opens a direct-message channel
  with a Discord user and sends a message to it.

The action accepts a Discord user ID and message content. It returns the
message object returned by Discord. The bot must be able to message the target
user, and Discord limits message content to 2,000 characters.

## Credentials

Create a Discord application and bot in the [Discord Developer
Portal](https://discord.com/developers/applications), copy the bot token, and
save it in an n8n **Discord Bot API** credential. Enter the debug bot token in
**Bot Token** and, when needed, a separate production bot token in
**Production Bot Token**. Triggers automatically use the debug token while
testing a workflow in the editor and the production token when the workflow is
active or otherwise runs outside manual mode. This lets debug and published
workflows use different Discord bots or tokens. Both values are stored as
password fields.

The triggers do not request privileged intents. The bot must be installed in
the servers where reactions should be observed and have permission to view the
relevant channels and read message history. Direct messages require the bot to
share a DM conversation with the user. The send-direct-message action uses the
same bot credential with Discord's REST API.

Do not share or commit the bot token. Discord may invalidate exposed tokens.

## Compatibility

The node uses the n8n community-node package format. Discord Gateway
availability and bot permissions are controlled by Discord.

## Local development

The project includes a Docker Compose setup for testing the node in an n8n
instance with development reload enabled. Build the node before starting n8n:

```shell
pnpm install
pnpm build
docker compose up
```

Open [http://localhost:5678](http://localhost:5678) and create a workflow. The
node is loaded from this package's `dist` directory. To rebuild the bundled node automatically while editing, run
`pnpm build:watch` in a second terminal. Stop the n8n instance with
`docker compose down`.

In VS Code, use **Run and Debug → Start n8n development** to start the
TypeScript and bundle watcher and Docker Compose together. Use the **Stop n8n
Compose** task to stop the container. After a node change, n8n reloads the
updated bundle; refresh the editor page if the node metadata is already open.

The recommended alternative is `pnpm dev`, which uses the `n8n-node` tool to
start n8n and rebuild the node automatically. The Compose setup is intended for
the documented external-n8n workflow and requires Docker or Podman.

## Usage

Add a trigger or the **Discord Send Direct Message** node to a workflow and
configure its credentials. For the action, select a Discord Bot API
credential, then provide the recipient's Discord user ID and message content.
For a trigger, configure both its debug and production credentials, then
activate the workflow and send a DM or add/remove a reaction to test it. The
workflow must remain active while Discord Gateway events are being received.

Discord may deliver reconnects and duplicate events. Workflows that perform
non-idempotent actions should use Discord event or message identifiers to
deduplicate as needed.

## Resources

* [n8n community node documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Discord Gateway documentation](https://discord.com/developers/docs/topics/gateway)
* [Discord bot permissions](https://discord.com/developers/docs/topics/permissions)

## Version history

* `0.1.0` — Added Discord direct message and reaction triggers.
