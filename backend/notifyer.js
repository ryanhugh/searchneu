/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import Request from './scrapers/request';

import macros from './macros';

const request = new Request('notifyer', {
  cache: false,

  // Try each request up to three times in production,
  // but fail on the first try in development.
  retryCount: macros.DEV ? 1 : 3,
});

class Notifyer {
  // Webhook to respond to Facebook messages.
  async sendFBNotification(sender, text) {
    if (sender.length !== 16 || sender.includes(',')) {
      macros.warn('Invalid sender ID:', sender);
      return {
        error: 'true',
      };
    }

    let devUserFbId = macros.getEnvVariable('fbMessengerId')

    // If you want to message yourself in dev mode too, just change this.
    // This check is here so we don't accidentally message people with dev data.
    if (!macros.PROD && sender !== devUserFbId) {
      macros.log('Not sending fb message in dev mode ', sender, text, 'is not', devUserFbId);
      return {
        error: 'true',
      };
    }

    const token = macros.getEnvVariable('fbToken');

    if (!token) {
      macros.warn("Don't have fbToken, not sending FB notification to", sender, text);
      return {
        error: 'true',
      };
    }

    const config = {
      method: 'POST',
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {
        access_token: token,
      },
      json: {
        recipient: {
          id: sender,
        },
        message: {
          text: text,
        },
      },
    };

    try {
      const response = await request.post(config);

      if (response.body.message_id) {
        macros.log('Sent a fb message to ', sender, text, response.body.message_id);
        return {
          status: 'success',
        };
      }

      macros.warn('Could not send fb message', sender, text, response.body);
      return {
        error: 'true',
      };
    } catch (e) {
      macros.warn('Could not send fb message', sender, text, e.message || e.error || e);
      return {
        error: 'true',
      };
    }
  }


  // Get some info about the user
  // Docs here: https://developers.facebook.com/docs/messenger-platform/identity/user-profile
  async getUserProfileInfo(sender) {
    const token = macros.getEnvVariable('fbToken');

    if (!token) {
      macros.warn("Don't have fbToken, not getting user info for", sender);
      return {};
    }

    // Example:
    // {
    //   "first_name": "Ryan",
    //   "last_name": "Hughes",
    //   "id": "..."
    // }
    const response = await request.get(`https://graph.facebook.com/v2.6/${sender}?fields=first_name,last_name&access_token=${token}`);

    return JSON.parse(response.body);
  }

<<<<<<< HEAD
  main() {
    this.sendFBNotification('1397905100304615', 'test notification');
=======
  test() {
    // currently on whatever your current id is

    let devUserFbId = macros.getEnvVariable('fbMessengerId')

    this.sendFBNotification(devUserFbId, 'test notification');
>>>>>>> f69f406... added fb user id to config.json and it should be used everywhere now - no more hardcoding ids
  }
}

const instance = new Notifyer();
export default instance;

if (require.main === module) {
  instance.main();
}
