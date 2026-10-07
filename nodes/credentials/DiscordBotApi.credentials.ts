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
  icon = 'file:../discord.svg' as ICredentialType['icon'];

  properties: INodeProperties[] = [
    {
      displayName: 'Debug Bot Token',
      name: 'botToken',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'The token used when testing a workflow manually in the editor',
    },
    {
      displayName: 'Production Bot Token',
      name: 'productionBotToken',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description: 'Optional token used when the workflow runs outside manual mode. If omitted, the debug token is used.',
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
