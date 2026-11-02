import { randomUUID } from 'node:crypto';
import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import {
  ButtonStyle,
  ComponentType,
  GatewayIntentBits,
  MessageFlags,
  claimPendingReply,
  createDiscordActionClient,
  toN8nData,
} from '../DiscordClient';
import type { APIMessageTopLevelComponent, DiscordEventListener } from '../DiscordClient';

import { buildComponents, createComponentsProperty, getAttachmentReferences } from '../DiscordComponents';

const DISCORD_MESSAGE_MAX_LENGTH = 2000;
const DEFAULT_TIMEOUT_MINUTES = 5;
const MAX_TIMEOUT_MINUTES = 1440;
const BUTTON_LABEL_MAX_LENGTH = 80;

interface DiscordHumanResponse
{
  response: string;
  responseType: 'approval' | 'text';
  approved?: boolean;
  responseMessageId?: string;
}

function splitMessage(message: string): string[]
{
  const chunks: string[] = [];
  let characters: string[] = [];
  let chunkLength = 0;

  for (const character of message)
  {
    if (chunkLength + character.length > DISCORD_MESSAGE_MAX_LENGTH)
    {
      chunks.push(characters.join(''));
      characters = [];
      chunkLength = 0;
    }

    characters.push(character);
    chunkLength += character.length;
    if (chunkLength === DISCORD_MESSAGE_MAX_LENGTH)
    {
      chunks.push(characters.join(''));
      characters = [];
      chunkLength = 0;
    }
  }

  if (characters.length > 0)
  {
    chunks.push(characters.join(''));
  }

  return chunks;
}

export class DiscordSendDirectMessage implements INodeType
{
  description: INodeTypeDescription = {
    displayName: 'Discord Send Direct Message',
    name: 'discordSendDirectMessage',
    icon: { light: 'file:../discord.svg', dark: 'file:../discord.svg' },
    group: ['transform'],
    version: 1,
    subtitle: 'Send a direct message or wait for a response',
    description: 'Sends a direct message to a Discord user, optionally waiting for an approval or free-text reply.',
    usableAsTool: true,
    defaults: {
      name: 'Discord Send Direct Message',
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'discordBotApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Message Type',
        name: 'messageType',
        type: 'options',
        options: [
          { name: 'Text', value: 'text', description: 'Send a regular Discord message' },
          { name: 'Components V2', value: 'componentsV2', description: 'Build a message from Discord display components and controls' },
          { name: 'Send and Wait for Response', value: 'sendAndWait', description: 'Send a question and wait for an approval or free-text reply' },
        ],
        default: 'text',
        noDataExpression: true,
      },
      {
        displayName: 'User ID',
        name: 'userId',
        type: 'string',
        required: true,
        default: '={{ $("Discord Direct Message Trigger").json.authorId ?? "" }}',
        description: 'The Discord user ID that should receive the direct message',
      },
      {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        typeOptions: {
          rows: 4,
        },
        required: true,
        default: '',
        description: 'The content of the direct message. Messages over 2,000 characters are sent in consecutive messages.',
        displayOptions: { show: { messageType: ['text', 'sendAndWait'] } },
      },
      createComponentsProperty({ show: { messageType: ['componentsV2'] } }),
      {
        displayName: 'Response Type',
        name: 'responseType',
        type: 'options',
        options: [
          { name: 'Approval', value: 'approval', description: 'Wait for the user to click an approval or rejection button' },
          { name: 'Free Text', value: 'text', description: 'Wait for the user to reply to the message with text' },
        ],
        default: 'approval',
        noDataExpression: true,
        displayOptions: { show: { messageType: ['sendAndWait'] } },
      },
      {
        displayName: 'Approve Button Label',
        name: 'approveLabel',
        type: 'string',
        default: 'Approve',
        required: true,
        displayOptions: { show: { messageType: ['sendAndWait'], responseType: ['approval'] } },
        description: `Button label (up to ${BUTTON_LABEL_MAX_LENGTH} characters)`,
      },
      {
        displayName: 'Reject Button Label',
        name: 'rejectLabel',
        type: 'string',
        default: 'Reject',
        required: true,
        displayOptions: { show: { messageType: ['sendAndWait'], responseType: ['approval'] } },
        description: `Button label (up to ${BUTTON_LABEL_MAX_LENGTH} characters)`,
      },
      {
        displayName: 'Timeout (Minutes)',
        name: 'timeoutMinutes',
        type: 'number',
        typeOptions: { minValue: 1, maxValue: MAX_TIMEOUT_MINUTES },
        default: DEFAULT_TIMEOUT_MINUTES,
        required: true,
        description: 'How long to wait before failing the execution',
        displayOptions: { show: { messageType: ['sendAndWait'] } },
      },
      {
        displayName: 'Binary Property',
        name: 'binaryPropertyName',
        type: 'string',
        default: '',
        description: 'Name of the input binary property to attach. In Components V2 mode, reference its file name using attachment:// in a media or file component.',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>
  {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const discord = await createDiscordActionClient(this, [GatewayIntentBits.DirectMessages]);

    try
    {
      for (let itemIndex = 0; itemIndex < items.length; itemIndex++)
      {
        try
        {
          const messageType = this.getNodeParameter('messageType', itemIndex, 'text') as string;
          const userId = this.getNodeParameter('userId', itemIndex) as string;
          const message = messageType !== 'componentsV2'
            ? this.getNodeParameter('message', itemIndex) as string
            : '';
          const binaryPropertyName = (this.getNodeParameter('binaryPropertyName', itemIndex, '') as string).trim();
          let components: APIMessageTopLevelComponent[] | undefined;

          if (messageType !== 'text' && messageType !== 'componentsV2' && messageType !== 'sendAndWait')
          {
            throw new NodeOperationError(this.getNode(), 'Message Type must be Text, Components V2, or Send and Wait for Response.', {
              itemIndex,
            });
          }

          if (userId.trim().length === 0)
          {
            throw new NodeOperationError(this.getNode(), 'User ID must not be empty.', {
              itemIndex,
            });
          }

          if (messageType !== 'componentsV2' && message.trim().length === 0)
          {
            throw new NodeOperationError(this.getNode(), 'Message must not be empty.', {
              itemIndex,
            });
          }

          let responseType: 'approval' | 'text' | undefined;
          let approveLabel = '';
          let rejectLabel = '';
          let timeoutMinutes = DEFAULT_TIMEOUT_MINUTES;
          if (messageType === 'sendAndWait')
          {
            const responseTypeValue = this.getNodeParameter('responseType', itemIndex) as string;
            if (responseTypeValue !== 'approval' && responseTypeValue !== 'text')
            {
              throw new NodeOperationError(this.getNode(), 'Response Type must be Approval or Free Text.', {
                itemIndex,
              });
            }
            responseType = responseTypeValue;
            timeoutMinutes = this.getNodeParameter('timeoutMinutes', itemIndex) as number;
            if (message.length > 1900)
            {
              throw new NodeOperationError(this.getNode(), 'Message must not exceed 1,900 characters when waiting for a response.', {
                itemIndex,
              });
            }
            if (!Number.isInteger(timeoutMinutes) || timeoutMinutes < 1 || timeoutMinutes > MAX_TIMEOUT_MINUTES)
            {
              throw new NodeOperationError(
                this.getNode(),
                `Timeout must be a whole number between 1 and ${MAX_TIMEOUT_MINUTES} minutes.`,
                { itemIndex },
              );
            }

            if (responseType === 'approval')
            {
              approveLabel = (this.getNodeParameter('approveLabel', itemIndex) as string).trim();
              rejectLabel = (this.getNodeParameter('rejectLabel', itemIndex) as string).trim();
              if ([approveLabel, rejectLabel].some((label) =>
                label.length === 0 || label.length > BUTTON_LABEL_MAX_LENGTH)
                || approveLabel === rejectLabel)
              {
                throw new NodeOperationError(
                  this.getNode(),
                  `Approval button labels must be different and contain 1-${BUTTON_LABEL_MAX_LENGTH} characters.`,
                  { itemIndex },
                );
              }
            }
          }

          if (messageType === 'componentsV2')
          {
            components = buildComponents(
              this.getNodeParameter('components', itemIndex, {}),
              (messageText) =>
              {
                throw new NodeOperationError(this.getNode(), messageText, { itemIndex });
              },
            );
          }

          const client = await discord.ready();

          const user = await client.users.fetch(userId);
          const binaryData = binaryPropertyName.length > 0
            ? this.helpers.assertBinaryData(itemIndex, binaryPropertyName)
            : undefined;
          const files = binaryData
            ? [{
              attachment: await this.helpers.getBinaryDataBuffer(itemIndex, binaryData),
              name: binaryData.fileName || binaryPropertyName,
            }]
            : [];
          if (messageType === 'sendAndWait' && responseType)
          {
            const approveCustomId = `n8n-hitl-${randomUUID()}-approve`;
            const rejectCustomId = `n8n-hitl-${randomUUID()}-reject`;
            let promptMessageChannelId = '';
            let timeout: NodeJS.Timeout | undefined;
            let releasePendingReply: (() => void) | undefined;

            let resolveResponse!: (response: DiscordHumanResponse) => void;
            let rejectResponse!: (error: Error) => void;
            const responsePromise = new Promise<DiscordHumanResponse>((resolve, reject) =>
            {
              resolveResponse = resolve;
              rejectResponse = reject;
            });
            void responsePromise.catch(() => undefined);

            const messageListener: DiscordEventListener<'messageCreate'> = (incomingMessage) =>
            {
              if (responseType !== 'text'
                || incomingMessage.author.bot
                || incomingMessage.author.id !== userId
                || incomingMessage.channelId !== promptMessageChannelId)
              {
                return;
              }

              resolveResponse({
                response: incomingMessage.content,
                responseType: 'text',
                responseMessageId: incomingMessage.id,
              });
            };
            const interactionListener: DiscordEventListener<'interactionCreate'> = async (interaction) =>
            {
              if (responseType !== 'approval'
                || !interaction.isButton()
                || interaction.user.id !== userId
                || interaction.channelId !== promptMessageChannelId
                || (interaction.customId !== approveCustomId && interaction.customId !== rejectCustomId))
              {
                return;
              }

              const approved = interaction.customId === approveCustomId;
              try
              {
                await interaction.update({
                  content: `${message}\n\n${approved ? approveLabel : rejectLabel}`,
                  components: [],
                });
                resolveResponse({
                  response: approved ? 'approved' : 'rejected',
                  responseType: 'approval',
                  approved,
                });
              } catch (error)
              {
                rejectResponse(error instanceof Error ? error : new Error(String(error)));
              }
            };
            const clientErrorListener: DiscordEventListener<'error'> = (error) =>
            {
              rejectResponse(error);
            };

            client.on('messageCreate', messageListener);
            client.on('interactionCreate', interactionListener);
            client.on('error', clientErrorListener);
            try
            {
              const sentMessage = responseType === 'approval'
                ? await user.send({
                  content: message,
                  components: [
                    {
                      type: ComponentType.ActionRow,
                      components: [
                        {
                          type: ComponentType.Button,
                          custom_id: approveCustomId,
                          label: approveLabel,
                          style: ButtonStyle.Success,
                        },
                        {
                          type: ComponentType.Button,
                          custom_id: rejectCustomId,
                          label: rejectLabel,
                          style: ButtonStyle.Danger,
                        },
                      ],
                    },
                  ],
                  ...(files.length > 0 && { files }),
                })
                : await user.send({
                  content: message,
                  ...(files.length > 0 && { files }),
                });
              promptMessageChannelId = sentMessage.channelId;
              if (responseType === 'text')
              {
                releasePendingReply = claimPendingReply(userId, promptMessageChannelId);
              }
              const timeoutPromise = new Promise<never>((_resolve, reject) =>
              {
                // eslint-disable-next-line @n8n/community-nodes/no-restricted-globals -- n8n-workflow timer helpers are not exported by all supported n8n versions.
                timeout = setTimeout(() => reject(new NodeOperationError(
                  this.getNode(),
                  `Timed out after ${timeoutMinutes} minutes waiting for a Discord response.`,
                  { itemIndex },
                )), timeoutMinutes * 60 * 1000);
              });
              const response = await Promise.race([responsePromise, timeoutPromise]);
              const output = toN8nData(sentMessage.toJSON());
              output.response = response.response;
              output.responseType = response.responseType;
              if (response.approved !== undefined)
              {
                output.approved = response.approved;
              }
              if (response.responseMessageId)
              {
                output.responseMessageId = response.responseMessageId;
              }
              returnData.push({
                json: output,
                pairedItem: { item: itemIndex },
              });
            } finally
            {
              if (timeout)
              {
                // eslint-disable-next-line @n8n/community-nodes/no-restricted-globals -- Clear the native timeout when the user has already responded.
                clearTimeout(timeout);
              }
              releasePendingReply?.();
              client.removeListener('messageCreate', messageListener);
              client.removeListener('interactionCreate', interactionListener);
              client.removeListener('error', clientErrorListener);
            }
            continue;
          }

          if (components)
          {
            const references = getAttachmentReferences(components);
            const fileName = files[0]?.name;
            const missingReferences = references.filter((reference) => reference !== fileName);
            if (missingReferences.length > 0)
            {
              throw new NodeOperationError(
                this.getNode(),
                `Components V2 attachment reference(s) ${missingReferences.map((reference) => `"${reference}"`).join(', ')} do not match the attached binary file. Set Binary Property to the matching file or remove those references.`,
                { itemIndex },
              );
            }
            if (files.length > 0 && !references.includes(fileName ?? ''))
            {
              throw new NodeOperationError(
                this.getNode(),
                `Binary file "${fileName}" must be referenced by a Components V2 File, Media Gallery, or Thumbnail component.`,
                { itemIndex },
              );
            }

            const sentMessage = await user.send({
              components,
              flags: MessageFlags.IsComponentsV2,
              ...(files.length > 0 && { files }),
            });
            returnData.push({
              json: toN8nData(sentMessage.toJSON()),
              pairedItem: { item: itemIndex },
            });
          } else
          {
            const messageChunks = splitMessage(message);
            for (let chunkIndex = 0; chunkIndex < messageChunks.length; chunkIndex++)
            {
              const messageChunk = messageChunks[chunkIndex];
              const sentMessage = await user.send(
                chunkIndex === 0 && files.length > 0
                  ? { content: messageChunk, files }
                  : messageChunk,
              );
              returnData.push({
                json: toN8nData(sentMessage.toJSON()),
                pairedItem: { item: itemIndex },
              });
            }
          }
        }
        catch (error)
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
    }
    finally
    {
      discord.destroy();
    }

    return [returnData];
  }
}
