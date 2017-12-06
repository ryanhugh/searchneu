/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import request from 'request';

import macros from './macros';

// const request = new Request('notifyer');


class Notifyer {
  // Webhook to respond to facebook messages.
  async sendFBNotification(sender, text) {
    macros.log('Sending a fb message to ', sender, text);
    const messageData = { text:text };

    const token = await macros.getEnvVariable('fbToken');

    request.post({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      // url: 'http://localhost/v2.6/me/messages',
      qs: { access_token:token },
      method: 'POST',
      json: {
        recipient: { id:sender },
        message: messageData,
      },
    }, (error, response) => {
      if (error) {
        macros.log('Error sending messages: ', error);
      } else if (response.body.error) {
        macros.log('Error: ', response.body.error);
      }
    });
  }


  // Get some info about the user
  // Docs here: https://developers.facebook.com/docs/messenger-platform/identity/user-profile
  async getUserProfileInfo(senderId) {
    const token = await macros.getEnvVariable('fbToken');

    // Example: 
    // {
    //   "first_name": "Ryan",
    //   "last_name": "Hughes",
    //   "id": "..."
    // }
    return request.get("https://graph.facebook.com/v2.6/" + sender + "?fields=first_name,last_name&access_token=" + token)
  }

  // TODO
  // sendEmail() {

  // }


  // sendNotification() {

  // }


  main() {
    this.sendFBNotification('1397905100304615', 'test notification');
  }
}

const instance = new Notifyer();
export default instance;

if (require.main === module) {
  instance.main();
}
