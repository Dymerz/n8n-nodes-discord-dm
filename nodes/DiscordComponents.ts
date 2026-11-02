import type {
  APIActionRowComponent,
  APIButtonComponent,
  APIChannelSelectComponent,
  APIComponentInContainer,
  APIContainerComponent,
  APIFileComponent,
  APIMediaGalleryComponent,
  APIMentionableSelectComponent,
  APIMessageTopLevelComponent,
  APIRoleSelectComponent,
  APISectionComponent,
  APISeparatorComponent,
  APIStringSelectComponent,
  APITextDisplayComponent,
  APIThumbnailComponent,
  APIUserSelectComponent,
} from './DiscordClient';
import { ButtonStyle, ComponentType, SeparatorSpacingSize } from './DiscordClient';
import type { INodeProperties, INodePropertyCollection } from 'n8n-workflow';

type ComponentGroup =
  | 'textDisplay'
  | 'container'
  | 'mediaGallery'
  | 'section'
  | 'separator'
  | 'file'
  | 'actionRow';

type ComponentCollection = Record<string, unknown>;
type ComponentFailure = (message: string) => never;
type InteractiveButtonStyle =
  | ButtonStyle.Primary
  | ButtonStyle.Secondary
  | ButtonStyle.Success
  | ButtonStyle.Danger
  | ButtonStyle.Link;
type ActionRowComponent =
  | APIButtonComponent
  | APIStringSelectComponent
  | APIUserSelectComponent
  | APIRoleSelectComponent
  | APIMentionableSelectComponent
  | APIChannelSelectComponent;

const textDisplayOption: INodePropertyCollection = {
  displayName: 'Text Display',
  name: 'textDisplay',
  values: [
    {
      displayName: 'Position',
      name: 'position',
      type: 'number',
      typeOptions: { minValue: 1, maxValue: 40 },
      default: 1,
      description: 'Lower positions appear before higher positions'
    },
    {
      displayName: 'Text',
      name: 'content',
      type: 'string',
      typeOptions: { rows: 3 },
      default: '',
      required: true,
    },
  ],
};

const mediaGalleryOption: INodePropertyCollection = {
  displayName: 'Media Gallery',
  name: 'mediaGallery',
  values: [
    {
      displayName: 'Position',
      name: 'position',
      type: 'number',
      typeOptions: { minValue: 1, maxValue: 40 },
      default: 1,
    },
    {
      displayName: 'Items',
      name: 'items',
      type: 'fixedCollection',
      typeOptions: {
        multipleValues: true,
        multipleValueButtonText: 'Add Media Item',
      },
      default: {},
      options: [
        {
          displayName: 'Media Item',
          name: 'mediaItem',
          values: [
            {
              displayName: 'URL',
              name: 'url',
              type: 'string',
              default: '',
              required: true,
              description: 'An external HTTP(S) URL or an attachment:// file name',
            },
            {
              displayName: 'Description',
              name: 'description',
              type: 'string',
              default: '',
              description: 'Alternative text for the media item',
            },
            {
              displayName: 'Spoiler',
              name: 'spoiler',
              type: 'boolean',
              default: false,
            },
          ],
        },
      ],
    },
  ],
};

const sectionOption: INodePropertyCollection = {
  displayName: 'Section',
  name: 'section',
  values: [
    {
      displayName: 'Accessory',
      name: 'accessoryType',
      type: 'options',
      options: [
        {
          name: 'Thumbnail',
          value: 'thumbnail',
        },
        {
          name: 'Button',
          value: 'button',
        },
      ],
      default: 'thumbnail',
    },
    {
      displayName: 'Button Custom ID',
      name: 'buttonCustomId',
      type: 'string',
      default: '',
      required: true,
      displayOptions: {
        show: { accessoryType: ['button'], buttonStyle: ['primary', 'secondary', 'success', 'danger'] },
      },
    },
    {
      displayName: 'Button Label',
      name: 'buttonLabel',
      type: 'string',
      default: '',
      required: true,
      displayOptions: { show: { accessoryType: ['button'] } },
    },
    {
      displayName: 'Button Style',
      name: 'buttonStyle',
      type: 'options',
      options: [
        {
          name: 'Danger',
          value: 'danger',
        },
        {
          name: 'Link',
          value: 'link',
        },
        {
          name: 'Primary',
          value: 'primary',
        },
        {
          name: 'Secondary',
          value: 'secondary',
        },
        {
          name: 'Success',
          value: 'success',
        },
      ],
      default: 'primary',
      displayOptions: { show: { accessoryType: ['button'] } },
    },
    {
      displayName: 'Button URL',
      name: 'buttonUrl',
      type: 'string',
      default: '',
      required: true,
      displayOptions: { show: { accessoryType: ['button'], buttonStyle: ['link'] } },
    },
    {
      displayName: 'Position',
      name: 'position',
      type: 'number',
      default: 1
    },
    {
      displayName: 'Spoiler Thumbnail',
      name: 'thumbnailSpoiler',
      type: 'boolean',
      default: false,
      displayOptions: { show: { accessoryType: ['thumbnail'] } },
    },
    {
      displayName: 'Text Displays',
      name: 'textDisplays',
      type: 'fixedCollection',
      default: {},
      options: [
        {
          displayName: 'Text Display',
          name: 'textDisplay',
          values: [
            {
              displayName: 'Text',
              name: 'content',
              type: 'string',
              default: '',
              required: true,
            },
          ]
        },
      ]
    },
    {
      displayName: 'Thumbnail Description',
      name: 'thumbnailDescription',
      type: 'string',
      default: '',
      displayOptions: { show: { accessoryType: ['thumbnail'] } },
    },
    {
      displayName: 'Thumbnail URL',
      name: 'thumbnailUrl',
      type: 'string',
      default: '',
      required: true,
      displayOptions: { show: { accessoryType: ['thumbnail'] } },
    },
  ],
};

const separatorOption: INodePropertyCollection = {
  displayName: 'Separator',
  name: 'separator',
  values: [
    {
      displayName: 'Position',
      name: 'position',
      type: 'number',
      typeOptions: { minValue: 1, maxValue: 40 },
      default: 1,
    },
    {
      displayName: 'Spacing',
      name: 'spacing',
      type: 'options',
      options: [
        { name: 'Small', value: 'small' },
        { name: 'Large', value: 'large' },
      ],
      default: 'small',
    },
    {
      displayName: 'Show Divider',
      name: 'divider',
      type: 'boolean',
      default: true,
    },
  ],
};

const fileOption: INodePropertyCollection = {
  displayName: 'File',
  name: 'file',
  values: [
    {
      displayName: 'Position',
      name: 'position',
      type: 'number',
      typeOptions: { minValue: 1, maxValue: 40 },
      default: 1,
    },
    {
      displayName: 'Attachment URL',
      name: 'url',
      type: 'string',
      default: '',
      required: true,
      description: 'Use attachment:// followed by the attached file name',
    },
    {
      displayName: 'Spoiler',
      name: 'spoiler',
      type: 'boolean',
      default: false,
    },
  ],
};

const buttonOption: INodePropertyCollection = {
  displayName: 'Button',
  name: 'button',
  values: [
    {
      displayName: 'Custom ID',
      name: 'customId',
      type: 'string',
      default: '',
      required: true,
      displayOptions: { show: { style: ['primary', 'secondary', 'success', 'danger'] } },
    },
    {
      displayName: 'Disabled',
      name: 'disabled',
      type: 'boolean',
      default: false,
    },
    {
      displayName: 'Label',
      name: 'label',
      type: 'string',
      default: '',
      required: true,
    },
    {
      displayName: 'Style',
      name: 'style',
      type: 'options',
      options: [
        {
          name: 'Danger',
          value: 'danger',
        },
        {
          name: 'Link',
          value: 'link',
        },
        {
          name: 'Primary',
          value: 'primary',
        },
        {
          name: 'Secondary',
          value: 'secondary',
        },
        {
          name: 'Success',
          value: 'success',
        },
      ],
      default: 'primary',
    },
    {
      displayName: 'URL',
      name: 'url',
      type: 'string',
      default: '',
      required: true,
      displayOptions: { show: { style: ['link'] } },
    },
  ],
};

const selectOption: INodePropertyCollection = {
  displayName: 'String Select',
  name: 'stringSelect',
  values: [
    {
      displayName: 'Custom ID',
      name: 'customId',
      type: 'string',
      default: '',
      required: true,
    },
    {
      displayName: 'Maximum Values',
      name: 'maxValues',
      type: 'number',
      default: 1
    },
    {
      displayName: 'Minimum Values',
      name: 'minValues',
      type: 'number',
      default: 1
    },
    {
      displayName: 'Options',
      name: 'options',
      type: 'fixedCollection',
      default: {},
      options: [
        {
          displayName: 'Option',
          name: 'option',
          values: [
            {
              displayName: 'Label',
              name: 'label',
              type: 'string',
              default: '',
              required: true,
            },
            {
              displayName: 'Value',
              name: 'value',
              type: 'string',
              default: '',
              required: true,
            },
            {
              displayName: 'Description',
              name: 'description',
              type: 'string',
              default: '',
            },
            {
              displayName: 'Default',
              name: 'default',
              type: 'boolean',
              default: false,
            },
          ]
        },
      ]
    },
    {
      displayName: 'Placeholder',
      name: 'placeholder',
      type: 'string',
      default: '',
    },
  ],
};

const entitySelectOptions: INodePropertyCollection[] = [
  { displayName: 'User Select', name: 'userSelect' },
  { displayName: 'Role Select', name: 'roleSelect' },
  { displayName: 'Mentionable Select', name: 'mentionableSelect' },
  { displayName: 'Channel Select', name: 'channelSelect' },
].map(({ displayName, name }) => ({
  displayName,
  name,
  values: [
    {
      displayName: 'Custom ID',
      name: 'customId',
      type: 'string',
      default: '',
      required: true,
    },
    {
      displayName: 'Disabled',
      name: 'disabled',
      type: 'boolean',
      default: false,
    },
    {
      displayName: 'Maximum Values',
      name: 'maxValues',
      type: 'number',
      default: 1
    },
    {
      displayName: 'Minimum Values',
      name: 'minValues',
      type: 'number',
      default: 1
    },
    {
      displayName: 'Placeholder',
      name: 'placeholder',
      type: 'string',
      default: '',
    },
  ],
}));

const actionRowOption: INodePropertyCollection = {
  displayName: 'Action Row',
  name: 'actionRow',
  values: [
    {
      displayName: 'Position',
      name: 'position',
      type: 'number',
      typeOptions: { minValue: 1, maxValue: 40 },
      default: 1,
    },
    {
      displayName: 'Buttons',
      name: 'buttons',
      type: 'fixedCollection',
      typeOptions: {
        multipleValues: true,
        multipleValueButtonText: 'Add Button',
      },
      default: {},
      options: [buttonOption],
    },
    {
      displayName: 'Select Menu',
      name: 'selectMenu',
      type: 'fixedCollection',
      default: {},
      options: [selectOption, ...entitySelectOptions],
    },
  ],
};

const containerOption: INodePropertyCollection = {
  displayName: 'Container',
  name: 'container',
  values: [
    {
      displayName: 'Accent Color',
      name: 'accentColor',
      type: 'number',
      typeOptions: { minValue: 0, maxValue: 16777215 },
      default: 0,
      description: 'Decimal RGB color value',
      displayOptions: { show: { useAccentColor: [true] } },
    },
    {
      displayName: 'Child Components',
      name: 'children',
      type: 'fixedCollection',
      typeOptions: {
        multipleValues: true,
        multipleValueButtonText: 'Add Child Component',
      },
      default: {},
      options: [textDisplayOption, mediaGalleryOption, sectionOption, separatorOption, fileOption, actionRowOption],
    },
    {
      displayName: 'Position',
      name: 'position',
      type: 'number',
      typeOptions: { minValue: 1, maxValue: 40 },
      default: 1,
    },
    {
      displayName: 'Spoiler',
      name: 'spoiler',
      type: 'boolean',
      default: false,
    },
    {
      displayName: 'Use Accent Color',
      name: 'useAccentColor',
      type: 'boolean',
      default: false,
    },
  ],
};

export function createComponentsProperty(
  displayOptions?: INodeProperties['displayOptions'],
): INodeProperties
{
  return {
    displayName: 'Components',
    name: 'components',
    type: 'fixedCollection',
    typeOptions: {
      multipleValues: true,
      multipleValueButtonText: 'Add Component',
    },
    default: {},
    description: 'Define and order display and interactive components. Equal positions keep their component-type order.',
    options: [
      textDisplayOption,
      containerOption,
      mediaGalleryOption,
      sectionOption,
      separatorOption,
      fileOption,
      actionRowOption,
    ],
    displayOptions,
  };
}

function asObject(value: unknown): ComponentCollection
{
  if (typeof value !== 'object' || value === null || Array.isArray(value))
  {
    return {};
  }

  return value as ComponentCollection;
}

function getEntries(value: unknown, key: string): ComponentCollection[]
{
  const entry = asObject(value)[key];
  if (Array.isArray(entry))
  {
    return entry.map(asObject);
  }
  if (entry !== undefined && entry !== null)
  {
    return [asObject(entry)];
  }
  return [];
}

function getNumber(
  value: unknown,
  name: string,
  defaultValue: number,
  fail: ComponentFailure,
): number
{
  if (value === undefined || value === null || value === '')
  {
    return defaultValue;
  }
  const number = Number(value);
  if (!Number.isFinite(number))
  {
    fail(`${name} must be a finite number.`);
  }
  return number;
}

function getString(
  value: unknown,
  name: string,
  fail: ComponentFailure,
  required = false,
): string
{
  const string = typeof value === 'string' ? value.trim() : '';
  if (required && string.length === 0)
  {
    fail(`${name} must not be empty.`);
  }
  return string;
}

function getBoolean(value: unknown): boolean
{
  return value === true || value === 'true';
}

function getPosition(
  entry: ComponentCollection,
  name: string,
  fallback: number,
  fail: ComponentFailure,
): number
{
  const position = getNumber(entry.position, `${name} position`, fallback, fail);
  if (!Number.isInteger(position) || position < 1 || position > 40)
  {
    fail(`${name} position must be a whole number between 1 and 40.`);
  }
  return position;
}

function requireMediaUrl(value: unknown, name: string, fail: ComponentFailure): string
{
  const url = getString(value, name, fail, true);
  if (url.startsWith('attachment://'))
  {
    if (url.length === 'attachment://'.length)
    {
      fail(`${name} must include the attached file name after attachment://.`);
    }
    return url;
  }

  let parsedUrl: URL;
  try
  {
    parsedUrl = new URL(url);
  } catch
  {
    fail(`${name} must be a valid HTTP(S) URL or attachment:// URL.`);
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:')
  {
    fail(`${name} must use HTTP(S) or attachment://.`);
  }
  return url;
}

function getCustomId(value: unknown, name: string, fail: ComponentFailure): string
{
  const customId = getString(value, name, fail, true);
  if (customId.length > 100)
  {
    fail(`${name} cannot exceed 100 characters.`);
  }
  return customId;
}

function getStyle(value: unknown, name: string, fail: ComponentFailure): InteractiveButtonStyle
{
  const styles: Record<string, InteractiveButtonStyle> = {
    primary: ButtonStyle.Primary,
    secondary: ButtonStyle.Secondary,
    success: ButtonStyle.Success,
    danger: ButtonStyle.Danger,
    link: ButtonStyle.Link,
  };
  const style = typeof value === 'string' ? styles[value] : undefined;
  if (style === undefined)
  {
    fail(`${name} has an unsupported button style.`);
  }
  return style;
}

function buildButton(
  entry: ComponentCollection,
  name: string,
  fail: ComponentFailure,
): APIButtonComponent
{
  const style = getStyle(entry.style, name, fail);
  const label = getString(entry.label, `${name} label`, fail);
  if (label.length > 80)
  {
    fail(`${name} label cannot exceed 80 characters.`);
  }
  if (label.length === 0)
  {
    fail(`${name} label must not be empty.`);
  }

  if (style === ButtonStyle.Link)
  {
    const url = requireMediaUrl(entry.url, `${name} URL`, fail);
    if (url.startsWith('attachment://'))
    {
      fail(`${name} URL must be an external HTTP(S) URL.`);
    }
    return {
      type: ComponentType.Button,
      style,
      label,
      url,
      disabled: getBoolean(entry.disabled),
    };
  }

  return {
    type: ComponentType.Button,
    style,
    label,
    custom_id: getCustomId(entry.customId, `${name} custom ID`, fail),
    disabled: getBoolean(entry.disabled),
  };
}

function getSelectLimits(
  entry: ComponentCollection,
  fail: ComponentFailure,
  optionCount = 25,
)
{
  const minValues = getNumber(entry.minValues, 'Select menu minimum values', 1, fail);
  const maxValues = getNumber(entry.maxValues, 'Select menu maximum values', 1, fail);
  if (!Number.isInteger(minValues) || !Number.isInteger(maxValues)
    || minValues < 0 || maxValues < 1 || maxValues > optionCount || minValues > maxValues)
  {
    fail(`Select menu values must satisfy 0 <= minimum <= maximum <= ${optionCount}.`);
  }
  return { minValues, maxValues };
}

function buildSelectMenu(
  entry: ComponentCollection,
  fail: ComponentFailure,
): APIStringSelectComponent
{
  const customId = getCustomId(entry.customId, 'String Select custom ID', fail);
  const placeholder = getString(entry.placeholder, 'String Select placeholder', fail);
  const { minValues, maxValues } = getSelectLimits(entry, fail);
  const options = getEntries(entry.options, 'option').map((option, index) =>
  {
    const label = getString(option.label, `Select option ${index + 1} label`, fail, true);
    const value = getString(option.value, `Select option ${index + 1} value`, fail, true);
    const description = getString(option.description, `Select option ${index + 1} description`, fail);
    if (label.length > 100 || value.length > 100 || description.length > 100)
    {
      fail(`Select option ${index + 1} label, value, and description cannot exceed 100 characters.`);
    }
    return {
      label,
      value,
      ...(description.length > 0 && { description }),
      ...(getBoolean(option.default) && { default: true }),
    };
  });

  if (options.length < 1 || options.length > 25)
  {
    fail('String Select must have between 1 and 25 options.');
  }
  if (maxValues > options.length)
  {
    fail('String Select values must satisfy 0 <= minimum <= maximum <= number of options (maximum 25).');
  }
  if (placeholder.length > 150)
  {
    fail('String Select placeholder cannot exceed 150 characters.');
  }

  return {
    type: ComponentType.StringSelect,
    custom_id: customId,
    options,
    min_values: minValues,
    max_values: maxValues,
    ...(placeholder.length > 0 && { placeholder }),
    disabled: getBoolean(entry.disabled),
  };
}

function buildEntitySelectMenu(
  group: string,
  entry: ComponentCollection,
  fail: ComponentFailure,
): APIUserSelectComponent | APIRoleSelectComponent | APIMentionableSelectComponent | APIChannelSelectComponent
{
  const customId = getCustomId(entry.customId, `${group} custom ID`, fail);
  const placeholder = getString(entry.placeholder, `${group} placeholder`, fail);
  const { minValues, maxValues } = getSelectLimits(entry, fail);
  if (placeholder.length > 150)
  {
    fail(`${group} placeholder cannot exceed 150 characters.`);
  }

  const common = {
    custom_id: customId,
    ...(placeholder.length > 0 && { placeholder }),
    min_values: minValues,
    max_values: maxValues,
    disabled: getBoolean(entry.disabled),
  };

  if (group === 'userSelect')
  {
    return { type: ComponentType.UserSelect, ...common };
  }
  if (group === 'roleSelect')
  {
    return { type: ComponentType.RoleSelect, ...common };
  }
  if (group === 'mentionableSelect')
  {
    return { type: ComponentType.MentionableSelect, ...common };
  }
  return { type: ComponentType.ChannelSelect, ...common };
}

function buildActionRow(
  entry: ComponentCollection,
  fail: ComponentFailure,
): APIActionRowComponent<ActionRowComponent>
{
  const buttons = getEntries(entry.buttons, 'button').map((button, index) =>
    buildButton(button, `Button ${index + 1}`, fail));
  const selectCollection = asObject(entry.selectMenu);
  const selectMenuGroups = ['stringSelect', 'userSelect', 'roleSelect', 'mentionableSelect', 'channelSelect'];
  const configuredSelectMenus = selectMenuGroups.flatMap((group) =>
    getEntries(selectCollection, group).map((menu) => ({ group, menu })));

  if (buttons.length > 0 && configuredSelectMenus.length > 0)
  {
    fail('An Action Row cannot contain both buttons and a select menu.');
  }
  if (buttons.length < 1 && configuredSelectMenus.length < 1)
  {
    fail('An Action Row must contain at least one button or one select menu.');
  }
  if (buttons.length > 5)
  {
    fail('An Action Row cannot contain more than 5 buttons.');
  }
  if (configuredSelectMenus.length > 1)
  {
    fail('An Action Row can contain only one select menu.');
  }

  const menu = configuredSelectMenus[0];
  return {
    type: ComponentType.ActionRow,
    components: buttons.length > 0
      ? buttons
      : [menu.group === 'stringSelect'
        ? buildSelectMenu(menu.menu, fail)
        : buildEntitySelectMenu(menu.group, menu.menu, fail)],
  };
}

function buildComponent(
  group: ComponentGroup,
  entry: ComponentCollection,
  fail: ComponentFailure,
): APIMessageTopLevelComponent
{
  if (group === 'textDisplay')
  {
    const content = getString(entry.content, 'Text Display text', fail, true);
    return { type: ComponentType.TextDisplay, content } satisfies APITextDisplayComponent;
  }

  if (group === 'mediaGallery')
  {
    const items = getEntries(entry.items, 'mediaItem').map((item, index) =>
    {
      const description = getString(item.description, `Media Gallery item ${index + 1} description`, fail);
      if (description.length > 1024)
      {
        fail(`Media Gallery item ${index + 1} description cannot exceed 1,024 characters.`);
      }
      return {
        media: { url: requireMediaUrl(item.url, `Media Gallery item ${index + 1} URL`, fail) },
        ...(description.length > 0 && { description }),
        ...(getBoolean(item.spoiler) && { spoiler: true }),
      };
    });
    if (items.length < 1 || items.length > 10)
    {
      fail('Media Gallery must contain between 1 and 10 media items.');
    }
    return { type: ComponentType.MediaGallery, items } satisfies APIMediaGalleryComponent;
  }

  if (group === 'separator')
  {
    const spacing = entry.spacing === 'large'
      ? SeparatorSpacingSize.Large
      : SeparatorSpacingSize.Small;
    return {
      type: ComponentType.Separator,
      divider: entry.divider === undefined ? true : getBoolean(entry.divider),
      spacing,
    } satisfies APISeparatorComponent;
  }

  if (group === 'file')
  {
    return {
      type: ComponentType.File,
      file: { url: requireMediaUrl(entry.url, 'File attachment URL', fail) },
      ...(getBoolean(entry.spoiler) && { spoiler: true }),
    } satisfies APIFileComponent;
  }

  if (group === 'actionRow')
  {
    return buildActionRow(entry, fail);
  }

  if (group === 'section')
  {
    const textDisplays = getEntries(entry.textDisplays, 'textDisplay').map((text, index) =>
    {
      const content = getString(text.content, `Section text ${index + 1}`, fail, true);
      return { type: ComponentType.TextDisplay, content } satisfies APITextDisplayComponent;
    });
    if (textDisplays.length < 1 || textDisplays.length > 3)
    {
      fail('Section must contain between 1 and 3 Text Displays.');
    }

    const accessoryType = entry.accessoryType;
    let accessory: APIThumbnailComponent | APIButtonComponent | undefined;
    if (accessoryType === 'thumbnail')
    {
      const description = getString(entry.thumbnailDescription, 'Section thumbnail description', fail);
      accessory = {
        type: ComponentType.Thumbnail,
        media: { url: requireMediaUrl(entry.thumbnailUrl, 'Section thumbnail URL', fail) },
        ...(description.length > 0 && { description }),
        ...(getBoolean(entry.thumbnailSpoiler) && { spoiler: true }),
      };
    } else if (accessoryType === 'button')
    {
      accessory = buildButton({
        style: entry.buttonStyle,
        label: entry.buttonLabel,
        customId: entry.buttonCustomId,
        url: entry.buttonUrl,
      }, 'Section button', fail);
    } else
    {
      fail('Section accessory must be a Thumbnail or Button.');
    }

    return {
      type: ComponentType.Section,
      components: textDisplays,
      accessory,
    } satisfies APISectionComponent;
  }

  const useAccentColor = getBoolean(entry.useAccentColor);
  const accentColor = getNumber(entry.accentColor, 'Container accent color', 0, fail);
  if (useAccentColor && (!Number.isInteger(accentColor) || accentColor < 0 || accentColor > 16777215))
  {
    fail('Container accent color must be a decimal RGB value from 0 to 16,777,215.');
  }
  const children = buildComponentList(entry.children, false, fail);
  if (children.length < 1)
  {
    fail('Container must contain at least one child component.');
  }
  return {
    type: ComponentType.Container,
    components: children as APIComponentInContainer[],
    ...(useAccentColor && { accent_color: accentColor }),
    ...(getBoolean(entry.spoiler) && { spoiler: true }),
  } satisfies APIContainerComponent;
}

const COMPONENT_GROUPS: ComponentGroup[] = [
  'textDisplay',
  'container',
  'mediaGallery',
  'section',
  'separator',
  'file',
  'actionRow',
];

function buildComponentList(
  value: unknown,
  allowContainer: boolean,
  fail: ComponentFailure,
): APIMessageTopLevelComponent[]
{
  const collection = asObject(value);
  const positioned: Array<{
    position: number;
    tieBreak: number;
    component: APIMessageTopLevelComponent;
  }> = [];
  let tieBreak = 0;

  for (const group of COMPONENT_GROUPS)
  {
    if (!allowContainer && group === 'container')
    {
      continue;
    }
    for (const [index, entry] of getEntries(collection, group).entries())
    {
      positioned.push({
        position: getPosition(entry, group, index + 1, fail),
        tieBreak,
        component: buildComponent(group, entry, fail),
      });
      tieBreak++;
    }
  }

  positioned.sort((left, right) => left.position - right.position || left.tieBreak - right.tieBreak);
  return positioned.map(({ component }) => component);
}

function countComponents(components: APIMessageTopLevelComponent[]): number
{
  return components.reduce((total, component) =>
  {
    if (component.type === ComponentType.Container)
    {
      return total + 1 + countComponents(
        component.components as APIMessageTopLevelComponent[],
      );
    }
    if (component.type === ComponentType.Section)
    {
      return total + 1 + component.components.length + (component.accessory ? 1 : 0);
    }
    if (component.type === ComponentType.ActionRow)
    {
      return total + 1 + component.components.length;
    }
    return total + 1;
  }, 0);
}

function countText(components: APIMessageTopLevelComponent[]): number
{
  return components.reduce((total, component) =>
  {
    if (component.type === ComponentType.TextDisplay)
    {
      return total + component.content.length;
    }
    if (component.type === ComponentType.Container)
    {
      return total + countText(component.components as APIMessageTopLevelComponent[]);
    }
    if (component.type === ComponentType.Section)
    {
      return total + component.components.reduce((sectionTotal, text) =>
        sectionTotal + text.content.length, 0);
    }
    return total;
  }, 0);
}

export function buildComponents(
  value: unknown,
  fail: ComponentFailure,
): APIMessageTopLevelComponent[]
{
  const components = buildComponentList(value, true, fail);
  if (components.length === 0)
  {
    fail('Add at least one Components V2 component.');
  }
  if (countComponents(components) > 40)
  {
    fail('A Components V2 message cannot contain more than 40 components, including nested components.');
  }
  if (countText(components) > 4000)
  {
    fail('Text across all Components V2 Text Displays cannot exceed 4,000 characters.');
  }
  return components;
}

export function getAttachmentReferences(
  components: APIMessageTopLevelComponent[],
): string[]
{
  const references = new Set<string>();
  const visit = (component: APIMessageTopLevelComponent): void =>
  {
    if (component.type === ComponentType.File)
    {
      if (component.file.url.startsWith('attachment://'))
      {
        references.add(component.file.url.slice('attachment://'.length));
      }
    } else if (component.type === ComponentType.MediaGallery)
    {
      for (const item of component.items)
      {
        if (item.media.url.startsWith('attachment://'))
        {
          references.add(item.media.url.slice('attachment://'.length));
        }
      }
    } else if (component.type === ComponentType.Section)
    {
      const accessory = component.accessory;
      if (accessory?.type === ComponentType.Thumbnail
        && accessory.media.url.startsWith('attachment://'))
      {
        references.add(accessory.media.url.slice('attachment://'.length));
      }
    } else if (component.type === ComponentType.Container)
    {
      for (const child of component.components)
      {
        visit(child as APIMessageTopLevelComponent);
      }
    }
  };

  for (const component of components)
  {
    visit(component);
  }
  return [...references];
}
