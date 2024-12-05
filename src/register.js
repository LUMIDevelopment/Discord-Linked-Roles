import config from './config.js';

/**
 * Register the metadata to be stored by Discord. This should be a one time action.
 * Note: uses a Bot token for authentication, not a user token.
 */
async function registerMetadata() {
  const url = `https://discord.com/api/v10/applications/${config.DISCORD_CLIENT_ID}/role-connections/metadata`;
  // supported types: number_lt=1, number_gt=2, number_eq=3 number_neq=4, datetime_lt=5, datetime_gt=6, boolean_eq=7, boolean_neq=8
  const body = [
    {
      key: 'lumipremium',
      name: 'LUMI Premium User',
      description: 'Has bought or received premium.',
      type: 7,
    },
    {
      key: 'serverowner',
      name: 'Server Owner',
      description: 'Is the owner of this server.',
      type: 7,
    },
    {
      key: 'bughunter',
      name: 'Bug Hunter',
      description: 'Helps by looking for bugs and mistakes.',
      type: 7,
    },
  ];

  const response = await fetch(url, {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${config.DISCORD_TOKEN}`,
    },
  });
  if (response.ok) {
    const data = await response.json();
    console.log(data);
  } else {
    const data = await response.text();
    console.log(data);
  }
}

// Call the async function
registerMetadata();