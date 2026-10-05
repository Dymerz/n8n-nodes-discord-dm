import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class DiscordBotApi implements ICredentialType
{
  name = 'discordBotApi';
  displayName = 'Discord Bot API';
  documentationUrl = 'https://discord.com/developers/docs/topics/oauth2#bots';
  icon = 'file:../nodes/discord.svg' as ICredentialType['icon'];

  properties: INodeProperties[] = [
    {
      displayName: 'Bot Token',
      name: 'botToken',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'The token for the Discord bot application.',
    },
    {
      displayName: 'Production Bot Token',
      name: 'productionBotToken',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'The token used when the workflow is active or runs outside manual mode.',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: "={{'Bot ' + $credentials.botToken}}",
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://discord.com/api/v10',
      url: '/users/@me',
      method: 'GET',
    },
  };
}
