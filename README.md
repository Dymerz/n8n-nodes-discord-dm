# n8n-nodes-discord-triggers

This n8n community node starts workflows from Discord bot events delivered over
the Discord Gateway and can send direct messages through discord.js.
It provides separate triggers for direct messages, added reactions, and removed
reactions, plus a node for sending a direct message to a user.

This package bundles `discord.js` once as a shared module used by all trigger
nodes, so the published package has no runtime dependency that n8n must
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
  emitting each message. Message attachments are downloaded and included in
  the item's binary data under properties named `attachment_0`,
  `attachment_1`, and so on; the file name and MIME type are preserved.
* **Discord Reaction Added Trigger** — emits raw `MESSAGE_REACTION_ADD`
  payloads.
* **Discord Reaction Removed Trigger** — emits raw `MESSAGE_REACTION_REMOVE`
  payloads.

Each trigger emits the complete Discord Gateway event data as one n8n item.

## Actions

* **Discord Send Direct Message** — creates or opens a direct-message channel
  with a Discord user and sends a message to it using discord.js.

The action accepts a Discord user ID and message content. It returns the
message object returned by Discord. The bot must be able to message the target
user, and Discord limits message content to 2,000 characters. All binary
properties on each input item are sent as attachments with the first message
chunk.

## Credentials

Create a Discord application and bot in the [Discord Developer
Portal](https://discord.com/developers/applications), copy the bot token, and
save it in a single n8n **Discord Bot API** credential. Enter the debug bot
token in **Debug Bot Token**. You can optionally enter a separate production
token in **Production Bot Token**; triggers and actions use the debug token
while testing a workflow in the editor, and use the production token when the
workflow runs outside manual mode. If no production token is set, they fall
back to the debug token. This lets debug and published workflows use different
Discord bots or tokens. Both values are stored as password fields.

The triggers do not request privileged intents. The bot must be installed in
the servers where reactions should be observed and have permission to view the
relevant channels and read message history. Direct messages require the bot to
share a DM conversation with the user. The send-direct-message action uses the
same bot credential through discord.js.

Do not share or commit the bot token. Discord may invalidate exposed tokens.

## Compatibility

The node uses the n8n community-node package format. Discord Gateway
availability and bot permissions are controlled by Discord.

## Local development

The project includes a Docker Compose setup for testing the node in an n8n
instance with development reload enabled. The Compose setup mounts the project
root so n8n can read `package.json` and resolve the node files it declares
under `dist/`. n8n's custom extension loader discovers `.node.js` files, so the
node sources and their built bundles use the `.node.ts` and `.node.js` suffixes.
Build the node before starting n8n:

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
Compose** task to stop the container. The watcher rebuilds `dist`, but the
Compose logs may report that file watching for hot reload is unavailable. After
adding or changing a node, restart the n8n service with
`docker compose restart n8n`, then refresh the editor.

If the logs report `Unrecognized node type: CUSTOM.discordDirectMessage`, a
saved workflow is referring to the old custom node type ID. After the current
package has loaded, remove that missing node from the workflow and add the
**Discord Direct Message Trigger** again from the node picker.

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
