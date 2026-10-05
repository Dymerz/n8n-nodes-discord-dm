import type { INodeType, INodeTypeDescription, ITriggerFunctions } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { createDiscordTrigger, DISCORD_INTENTS, toN8nData } from '../DiscordGateway/DiscordGateway';

export class DiscordReactionRemoved implements INodeType
{
  description: INodeTypeDescription = {
    displayName: 'Discord Reaction Removed Trigger',
    name: 'discordReactionRemoved',
    icon: { light: 'file:../discord.svg', dark: 'file:../discord.svg' },
    group: ['trigger'],
    version: 1,
    subtitle: 'Listen for removed reactions',
    description: 'Starts a workflow when a reaction is removed from a Discord message.',
    defaults: {
      name: 'Discord Reaction Removed Trigger',
    },
    inputs: [],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'discordBotApi',
        required: true,
      },
      {
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
      [
        DISCORD_INTENTS.DIRECT_MESSAGE_REACTIONS,
        DISCORD_INTENTS.GUILD_MESSAGE_REACTIONS,
      ],
      'messageReactionRemove',
      (reaction, user) =>
      {
        this.emit([[
          {
            json: toN8nData({
              reaction: reaction.toJSON(),
              user: user.toJSON(),
            }),
          },
        ]]);
      },
    );
  }
}
