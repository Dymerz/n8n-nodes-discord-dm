import { isWaitComponentId } from '../DiscordClient';
import type { INodeType, INodeTypeDescription, ITriggerFunctions } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { createDiscordTrigger, DISCORD_INTENTS, toN8nData } from '../DiscordGateway';

export class DiscordComponentInteractionTrigger implements INodeType
{
  description: INodeTypeDescription = {
    displayName: 'Discord Component Interaction Trigger',
    name: 'discordComponentInteractionTrigger',
    icon: { light: 'file:../discord.svg', dark: 'file:../discord.svg' },
    group: ['trigger'],
    version: 1,
    subtitle: 'Listen for component interactions',
    description: 'Starts a workflow when a user clicks a custom-ID button or submits a select menu, and immediately acknowledges the interaction.',
    defaults: {
      name: 'Discord Component Interaction Trigger',
    },
    inputs: [],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'discordBotApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Custom ID Filter',
        name: 'customIdFilter',
        type: 'string',
        default: '',
        description: 'Optional exact custom ID to accept. Leave empty to accept all custom-ID component interactions.',
      },
    ],
  };

  async trigger(this: ITriggerFunctions)
  {
    const customIdFilter = (this.getNodeParameter('customIdFilter', '') as string).trim();
    return await createDiscordTrigger(
      this,
      [DISCORD_INTENTS.GUILDS, DISCORD_INTENTS.DIRECT_MESSAGES],
      'interactionCreate',
      async (interaction) =>
      {
        if (!interaction.isMessageComponent())
        {
          return;
        }
        if (isWaitComponentId(interaction.customId))
        {
          return;
        }
        if (customIdFilter.length > 0 && interaction.customId !== customIdFilter)
        {
          return;
        }

        try
        {
          await interaction.deferUpdate();
        } catch (error)
        {
          this.emitError(error instanceof Error ? error : new Error(String(error)));
          return;
        }

        const values = 'values' in interaction && Array.isArray(interaction.values)
          ? interaction.values
          : [];
        this.emit([[
          {
            json: toN8nData({
              componentInteraction: {
                interactionId: interaction.id,
                applicationId: interaction.applicationId,
                interactionToken: interaction.token,
                customId: interaction.customId,
                componentType: interaction.componentType,
                values,
                user: interaction.user.toJSON(),
                message: interaction.message.toJSON(),
                channelId: interaction.channelId,
                guildId: interaction.guildId,
                acknowledgement: 'deferredUpdate',
              },
            }),
          },
        ]]);
      },
    );
  }
}
