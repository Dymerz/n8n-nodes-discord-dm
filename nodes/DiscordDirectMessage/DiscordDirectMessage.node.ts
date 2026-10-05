import type { INodeType, INodeTypeDescription, ITriggerFunctions } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { createDiscordTrigger, DISCORD_INTENTS, toN8nData } from '../DiscordGateway/DiscordGateway';

export class DiscordDirectMessage implements INodeType
{
  description: INodeTypeDescription = {
    displayName: 'Discord Direct Message Trigger',
    name: 'discordDirectMessage',
    icon: { light: 'file:../discord.svg', dark: 'file:../discord.svg' },
    group: ['trigger'],
    version: 1,
    subtitle: 'Listen for direct messages',
    description: 'Starts a workflow when the bot receives a Discord direct message.',
    defaults: {
      name: 'Discord Direct Message Trigger',
    },
    inputs: [],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'discordBotApi',
        displayName: 'Discord Bot API (Development)',
        required: true,
      },
      {
        displayName: 'Discord Bot API (Production)',
        name: 'discordBotProductionApi',
        required: true,
      },
    ],
    properties: [],
  };

  async trigger(this: ITriggerFunctions)
  {
    return await createDiscordTrigger(
      this,
      [DISCORD_INTENTS.DIRECT_MESSAGES],
      'messageCreate',
      async (message) =>
      {
        if (!message.channel.isDMBased())
        {
          return;
        }

        if (message.author.bot)
        {
          return;
        }

        try
        {
          await message.channel.sendTyping();
        } catch (error)
        {
          this.emitError(error instanceof Error ? error : new Error(String(error)));
        }

        this.emit([[{ json: toN8nData(message.toJSON()) }]]);
      },
    );
  }
}
