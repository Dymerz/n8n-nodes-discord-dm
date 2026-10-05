import { Client, GatewayIntentBits, Partials, type ClientEvents } from 'discord.js';
import
{
  NodeApiError,
  type IDataObject,
  type ITriggerFunctions,
  type ITriggerResponse,
  type JsonObject,
} from 'n8n-workflow';

export const DISCORD_INTENTS = {
  DIRECT_MESSAGES: GatewayIntentBits.DirectMessages,
  DIRECT_MESSAGE_REACTIONS: GatewayIntentBits.DirectMessageReactions,
  GUILD_MESSAGE_REACTIONS: GatewayIntentBits.GuildMessageReactions,
} as const;

type DiscordEventName = keyof ClientEvents;
type EventListener<TEventName extends DiscordEventName> = (...args: ClientEvents[TEventName]) => void;

const toN8nData = (value: unknown): IDataObject =>
  JSON.parse(JSON.stringify(value)) as IDataObject;

export const createDiscordTrigger = async <TEventName extends DiscordEventName>(
  context: ITriggerFunctions,
  intents: GatewayIntentBits[],
  eventName: TEventName,
  listener: EventListener<TEventName>,
): Promise<ITriggerResponse> =>
{
  const credentialName = context.getMode() === 'manual'
    ? 'discordBotApi'
    : 'discordBotProductionApi';
  const credentials = await context.getCredentials(credentialName);
  const token = credentials.botToken;
  if (typeof token !== 'string' || token.length === 0)
  {
    throw new Error('Discord bot token is missing from the configured credential.');
  }

  const client = new Client({
    intents,
    partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.User],
  });
  const handleError = (error: Error) => context.emitError(error);

  client.on('error', handleError);
  client.on(eventName, listener);

  try
  {
    await client.login(token);
  } catch (error)
  {
    client.removeListener('error', handleError);
    client.removeListener(eventName, listener);
    client.destroy();
    throw new NodeApiError(context.getNode(), error as JsonObject);
  }

  return {
    closeFunction: async () =>
    {
      client.removeListener('error', handleError);
      client.removeListener(eventName, listener);
      client.destroy();
    },
  };
};

export { toN8nData };
