import type { INodeType, INodeTypeDescription, ITriggerFunctions } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { createDiscordTrigger, DISCORD_INTENTS, toN8nData } from '../DiscordGateway/DiscordGateway';

export class DiscordReactionAdded implements INodeType
{
  description: INodeTypeDescription = {
    displayName: 'Discord Reaction Added Trigger',
    name: 'discordReactionAdded',
    icon: { light: 'file:../discord.svg', dark: 'file:../discord.svg' },
    group: ['trigger'],
    version: 1,
    subtitle: 'Listen for added reactions',
    description: 'Starts a workflow when a reaction is added to a Discord message.',
    defaults: {
      name: 'Discord Reaction Added Trigger',
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
      'messageReactionAdd',
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
