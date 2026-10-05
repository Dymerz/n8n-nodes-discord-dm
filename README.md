# n8n-nodes-discord-triggers

This n8n community node starts workflows from Discord bot events delivered over
the Discord Gateway. It provides separate triggers for direct messages, added
reactions, and removed reactions.

This package uses `discord.js` and is intended for self-hosted n8n
installations where peer dependencies can be installed. The included Compose
setup installs these dependencies before starting n8n. It is not eligible for
n8n Cloud community-node loading.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) · [Triggers](#triggers) · [Credentials](#credentials) · [Local development](#local-development) · [Usage](#usage) · [Resources](#resources)

## Installation

Follow the [community node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

## Triggers

* **Discord Direct Message Trigger** — emits raw `MESSAGE_CREATE` payloads
  received in direct-message or group-direct-message channels.
* **Discord Reaction Added Trigger** — emits raw `MESSAGE_REACTION_ADD`
  payloads.
* **Discord Reaction Removed Trigger** — emits raw `MESSAGE_REACTION_REMOVE`
  payloads.

Each trigger emits the complete Discord Gateway event data as one n8n item.

## Credentials

Create a Discord application and bot in the [Discord Developer
Portal](https://discord.com/developers/applications), copy the bot token, and
save it in an n8n **Discord Bot API** credential. The token is stored as a
password field and is used only for the Gateway connection.

These triggers do not request privileged intents. The bot must be installed in
the servers where reactions should be observed and have permission to view the
relevant channels and read message history. Direct messages require the bot to
share a DM conversation with the user.

Do not share or commit the bot token. Discord may invalidate exposed tokens.

## Compatibility

The node uses the n8n community-node package format. Discord Gateway
availability and bot permissions are controlled by Discord.

## Local development

The project includes a Docker Compose setup for testing the node in an n8n
instance with development reload enabled. Build the node before starting n8n:

```shell
npm install
npm run build
docker compose up
```

Open [http://localhost:5678](http://localhost:5678) and create a workflow. The
node is loaded from this package's `dist` directory. To rebuild automatically
while editing, run `npm run build:watch` in a second terminal. Stop the n8n
instance with `docker compose down`.

In VS Code, use **Run and Debug → Start n8n development** to start the
TypeScript watcher and Docker Compose together. Use the **Stop n8n Compose**
task to stop the container.

The recommended alternative is `npm run dev`, which uses the `n8n-node` tool to
start n8n and rebuild the node automatically. The Compose setup is intended for
the documented external-n8n workflow and requires Docker or Podman.

## Usage

Add one of the trigger nodes to a workflow, select a Discord Bot API
credential, activate the workflow, and send a DM or add/remove a reaction to
test it. The workflow must remain active while Discord Gateway events are being
received.

Discord may deliver reconnects and duplicate events. Workflows that perform
non-idempotent actions should use Discord event or message identifiers to
deduplicate as needed.

## Resources

* [n8n community node documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Discord Gateway documentation](https://discord.com/developers/docs/topics/gateway)
* [Discord bot permissions](https://discord.com/developers/docs/topics/permissions)

## Version history

* `0.1.0` — Added Discord direct message and reaction triggers.
