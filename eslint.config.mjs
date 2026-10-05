import { config } from '@n8n/node-cli/eslint';

export default [
	...config,
	{
		files: ['package.json'],
		rules: {
			'@n8n/community-nodes/valid-peer-dependencies': 'off',
		},
	},
];
