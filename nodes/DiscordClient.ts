import {
  ButtonStyle,
  Client,
  ComponentType,
  GatewayIntentBits,
  MessageFlags,
  Partials,
  SeparatorSpacingSize,
  type APIActionRowComponent,
  type APIButtonComponent,
  type APIChannelSelectComponent,
  type APIComponentInContainer,
  type APIContainerComponent,
  type APIFileComponent,
  type APIMediaGalleryComponent,
  type APIMentionableSelectComponent,
  type APIMessageTopLevelComponent,
  type APIRoleSelectComponent,
  type APISectionComponent,
  type APISeparatorComponent,
  type APIStringSelectComponent,
  type APITextDisplayComponent,
  type APIThumbnailComponent,
  type APIUserSelectComponent,
  type ClientEvents,
} from 'discord.js';
import type { IDataObject, IExecuteFunctions, ITriggerFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

// Re-exported so other modules never import discord.js directly and bundle it again.
export { ButtonStyle, ComponentType, GatewayIntentBits, MessageFlags, Partials, SeparatorSpacingSize };
export type {
  APIActionRowComponent,
  APIButtonComponent,
  APIChannelSelectComponent,
  APIComponentInContainer,
  APIContainerComponent,
  APIFileComponent,
  APIMediaGalleryComponent,
  APIMentionableSelectComponent,
  APIMessageTopLevelComponent,
  APIRoleSelectComponent,
  APISectionComponent,
  APISeparatorComponent,
  APIStringSelectComponent,
  APITextDisplayComponent,
  APIThumbnailComponent,
  APIUserSelectComponent,
};
export type DiscordEventName = keyof ClientEvents;
export type DiscordEventListener<TEventName extends DiscordEventName> =
  (...args: ClientEvents[TEventName]) => void;

type DiscordContext = IExecuteFunctions | ITriggerFunctions;

export const toN8nData = (value: unknown): IDataObject =>
  JSON.parse(JSON.stringify(value)) as IDataObject;

export const getBotToken = async (context: DiscordContext): Promise<string> =>
{
  const credentials = await context.getCredentials('discordBotApi');
  const productionToken = credentials.productionBotToken;
  const token = context.getMode() === 'manual'
    || typeof productionToken !== 'string'
    || productionToken.length === 0
    ? credentials.botToken
    : productionToken;
  if (typeof token !== 'string' || token.length === 0)
  {
    throw new NodeOperationError(
      context.getNode(),
      'The debug Discord bot token is missing from the configured credential.',
    );
  }

  return token;
};

export interface DiscordClientOptions
{
  intents?: GatewayIntentBits[];
  partials?: Partials[];
  presence?: ConstructorParameters<typeof Client>[0]['presence'];
}

export const createDiscordClient = (options: DiscordClientOptions = {}): Client =>
  new Client({
    intents: options.intents ?? [],
    ...(options.partials && { partials: options.partials }),
    ...(options.presence && { presence: options.presence }),
  });

export interface DiscordActionClient
{
  client: Client;
  ready: () => Promise<Client>;
  destroy: () => void;
}

/** Creates a client that only logs in on the first `ready()` call. */
export const createDiscordActionClient = async (
  context: IExecuteFunctions,
  intents: GatewayIntentBits[] = [],
): Promise<DiscordActionClient> =>
{
  const token = await getBotToken(context);
  const client = createDiscordClient({ intents });
  client.on('error', (error) =>
  {
    context.logger.error('Discord client error', { error: error.message });
  });

  let loginPromise: Promise<string> | undefined;
  return {
    client,
    ready: async () =>
    {
      loginPromise ??= client.login(token);
      await loginPromise;
      return client;
    },
    destroy: () => client.destroy(),
  };
};

const PENDING_REPLIES_KEY = Symbol.for('n8n-nodes-discord-dm.pendingReplies');
type PendingRepliesStore = Map<string, number>;
const getPendingReplies = (): PendingRepliesStore =>
{
  const store = globalThis as unknown as Record<symbol, PendingRepliesStore | undefined>;
  return (store[PENDING_REPLIES_KEY] ??= new Map<string, number>());
};

// Marks a user/channel as awaiting a reply from a "Send and Wait" node so triggers ignore it.
export const claimPendingReply = (userId: string, channelId: string): (() => void) =>
{
  const key = `${userId}:${channelId}`;
  const pending = getPendingReplies();
  pending.set(key, (pending.get(key) ?? 0) + 1);
  return () =>
  {
    const count = (pending.get(key) ?? 1) - 1;
    if (count <= 0)
    {
      pending.delete(key);
    } else
    {
      pending.set(key, count);
    }
  };
};

export const isPendingReply = (userId: string, channelId: string): boolean =>
  getPendingReplies().has(`${userId}:${channelId}`);

export const isWaitComponentId = (customId: string): boolean => customId.startsWith('n8n-hitl-');
