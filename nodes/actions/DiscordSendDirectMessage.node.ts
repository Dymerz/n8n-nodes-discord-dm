import { Client } from 'discord.js';
import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import { toN8nData } from '../triggers/DiscordGateway';

const DISCORD_MESSAGE_MAX_LENGTH = 2000;

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
    subtitle: 'Send a direct message',
    description: 'Sends a direct message to a Discord user through the bot.',
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
        displayName: 'User ID',
        name: 'userId',
        type: 'string',
        required: true,
        default: '',
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
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>
  {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = await this.getCredentials('discordBotApi');
    const productionToken = credentials.productionBotToken;
    const token = this.getMode() === 'manual'
      || typeof productionToken !== 'string'
      || productionToken.length === 0
      ? credentials.botToken
      : productionToken;
    if (typeof token !== 'string' || token.length === 0)
    {
      throw new NodeOperationError(this.getNode(), 'The debug Discord bot token is missing from the configured credential.');
    }

    const client = new Client({ intents: [] });
    client.on('error', (error) =>
    {
      this.logger.error('Discord client error', { error: error.message });
    });
    let loginPromise: Promise<string> | undefined;

    try
    {
      for (let itemIndex = 0; itemIndex < items.length; itemIndex++)
      {
        try
        {
          const userId = this.getNodeParameter('userId', itemIndex) as string;
          const message = this.getNodeParameter('message', itemIndex) as string;

          if (userId.trim().length === 0)
          {
            throw new NodeOperationError(this.getNode(), 'User ID must not be empty.', {
              itemIndex,
            });
          }

          if (message.trim().length === 0)
          {
            throw new NodeOperationError(this.getNode(), 'Message must not be empty.', {
              itemIndex,
            });
          }

          loginPromise ??= client.login(token);
          await loginPromise;

          const user = await client.users.fetch(userId);
          const files = await Promise.all(
            Object.entries(items[itemIndex].binary ?? {}).map(async ([propertyName, binaryData]) => ({
              attachment: await this.helpers.getBinaryDataBuffer(itemIndex, binaryData),
              name: binaryData.fileName || propertyName,
            })),
          );
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
      client.destroy();
    }

    return [returnData];
  }
}
