import { config } from '@n8n/node-cli/eslint';

export default [
	...config,
	{
		files: ['package.json'],
		rules: {
			'@n8n/community-nodes/valid-peer-dependencies': 'off',
		},
	},
	{
		files: ['nodes/**/*.ts'],
		rules: {
			'n8n-nodes-base/node-dirname-against-convention': 'off',
			'n8n-nodes-base/node-filename-against-convention': 'off',
		},
	},
];
