import type {
  IDataObject,
  IExecuteFunctions,
  IHttpRequestOptions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const DISCORD_API_BASE_URL = 'https://discord.com/api/v10';
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
        displayName: 'Discord Bot API (Development)',
        required: true,
      },
      {
        name: 'discordBotProductionApi',
        displayName: 'Discord Bot API (Production)',
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
    const request = this.helpers.httpRequestWithAuthentication as (
      credentialsType: string,
      requestOptions: IHttpRequestOptions,
    ) => Promise<unknown>;
    const credentialName = this.getMode() === 'manual'
      ? 'discordBotApi'
      : 'discordBotProductionApi';

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

        const channel = (await request.call(this,
          credentialName,
          {
            baseURL: DISCORD_API_BASE_URL,
            url: '/users/@me/channels',
            method: 'POST',
            body: {
              recipient_id: userId,
            },
            json: true,
          },
        )) as IDataObject;

        const channelId = channel.id;
        if (typeof channelId !== 'string' || channelId.length === 0)
        {
          throw new NodeApiError(
            this.getNode(),
            { message: 'Discord did not return a channel ID.' },
            { itemIndex },
          );
        }

        for (const messageChunk of splitMessage(message))
        {
          const sentMessage = (await request.call(this,
            credentialName,
            {
              baseURL: DISCORD_API_BASE_URL,
              url: `/channels/${encodeURIComponent(channelId)}/messages`,
              method: 'POST',
              body: {
                content: messageChunk,
              },
              json: true,
            },
          )) as IDataObject;

          returnData.push({
            json: sentMessage,
            pairedItem: { item: itemIndex },
          });
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
