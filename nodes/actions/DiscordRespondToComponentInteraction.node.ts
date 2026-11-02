import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { MessageFlags, toN8nData  } from '../DiscordClient';
import type { APIMessageTopLevelComponent } from '../DiscordClient';


import { buildComponents, createComponentsProperty, getAttachmentReferences } from '../DiscordComponents';

function asDataObject(value: unknown): IDataObject | undefined
{
  if (typeof value !== 'object' || value === null || Array.isArray(value))
  {
    return undefined;
  }
  return value as IDataObject;
}

export class DiscordRespondToComponentInteraction implements INodeType
{
  description: INodeTypeDescription = {
    displayName: 'Discord Respond to Component Interaction',
    name: 'discordRespondToComponentInteraction',
    icon: { light: 'file:../discord.svg', dark: 'file:../discord.svg' },
    group: ['transform'],
    version: 1,
    subtitle: 'Respond to a component interaction',
    description: 'Updates a Components V2 message or sends a follow-up after the Discord Component Interaction Trigger.',
    usableAsTool: true,
    defaults: {
      name: 'Discord Respond to Component Interaction',
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    properties: [
      {
        displayName: 'Response Mode',
        name: 'responseMode',
        type: 'options',
        options: [
          { name: 'Update Original Message', value: 'updateOriginal', description: 'Replace the original message with a new Components V2 layout' },
          { name: 'Send Text Follow-Up', value: 'followUpText', description: 'Send a plain-text follow-up message' },
          { name: 'Send Components V2 Follow-Up', value: 'followUpComponents', description: 'Send a follow-up with a Components V2 layout' },
        ],
        default: 'updateOriginal',
        noDataExpression: true,
      },
      {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        typeOptions: { rows: 4 },
        default: '',
        required: true,
        displayOptions: { show: { responseMode: ['followUpText'] } },
      },
      createComponentsProperty({
        show: { responseMode: ['updateOriginal', 'followUpComponents'] },
      }),
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>
  {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++)
    {
      try
      {
        const interaction = asDataObject(items[itemIndex].json.componentInteraction);
        if (!interaction)
        {
          throw new NodeOperationError(
            this.getNode(),
            'Input item must contain componentInteraction data from Discord Component Interaction Trigger.',
            { itemIndex },
          );
        }

        const applicationId = interaction.applicationId;
        const interactionToken = interaction.interactionToken;
        if (typeof applicationId !== 'string' || !/^\d+$/.test(applicationId))
        {
          throw new NodeOperationError(this.getNode(), 'componentInteraction.applicationId must be a Discord application ID.', {
            itemIndex,
          });
        }
        if (typeof interactionToken !== 'string' || interactionToken.length === 0)
        {
          throw new NodeOperationError(this.getNode(), 'componentInteraction.interactionToken is missing.', {
            itemIndex,
          });
        }

        const responseMode = this.getNodeParameter('responseMode', itemIndex) as string;
        let body: IDataObject;
        let method: 'PATCH' | 'POST';
        let url: string;
        if (responseMode === 'followUpText')
        {
          const message = this.getNodeParameter('message', itemIndex) as string;
          if (message.trim().length === 0)
          {
            throw new NodeOperationError(this.getNode(), 'Follow-up message must not be empty.', {
              itemIndex,
            });
          }
          body = { content: message };
          method = 'POST';
          url = `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}?wait=true`;
        } else if (responseMode === 'updateOriginal' || responseMode === 'followUpComponents')
        {
          const components: APIMessageTopLevelComponent[] = buildComponents(
            this.getNodeParameter('components', itemIndex, {}),
            (messageText) =>
            {
              throw new NodeOperationError(this.getNode(), messageText, { itemIndex });
            },
          );
          if (getAttachmentReferences(components).length > 0)
          {
            throw new NodeOperationError(
              this.getNode(),
              'Interaction responses cannot include attachment:// references. Use externally hosted media URLs.',
              { itemIndex },
            );
          }

          body = {
            components,
            flags: MessageFlags.IsComponentsV2,
          };
          method = responseMode === 'updateOriginal' ? 'PATCH' : 'POST';
          url = responseMode === 'updateOriginal'
            ? `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}/messages/@original`
            : `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}?wait=true`;
        } else
        {
          throw new NodeOperationError(this.getNode(), 'Response Mode is not supported.', {
            itemIndex,
          });
        }

        try
        {
          const response = await this.helpers.httpRequest({
            method,
            url,
            body,
            json: true,
          });
          returnData.push({
            json: toN8nData(response),
            pairedItem: { item: itemIndex },
          });
        } catch (error)
        {
          const message = error instanceof Error
            ? error.message.split(interactionToken).join('[redacted]')
            : 'Discord interaction response failed.';
          throw new NodeApiError(this.getNode(), { message }, { itemIndex });
        }
      } catch (error)
      {
        const nodeError =
          error instanceof NodeOperationError || error instanceof NodeApiError
            ? error
            : new NodeApiError(
              this.getNode(),
              error instanceof Error ? { message: error.message } : { message: String(error) },
              { itemIndex },
            );
        if (this.continueOnFail())
        {
          returnData.push({
            json: { error: nodeError.message },
            pairedItem: { item: itemIndex },
          });
          continue;
        }
        throw nodeError;
      }
    }

    return [returnData];
  }
}
