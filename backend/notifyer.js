import macros from './macros';
// import Request from './scrapers/request';
import request from 'request';

// const request = new Request('notifyer');


class Notifyer {
  
  constructor() {
    
  }
  
    
  // Webhook to respond to facebook messages. 
  async sendFBNotification(sender, text) {
      console.log("Sending a fb message to ", sender, text)
      let messageData = { text:text }
      
      let token = await macros.getEnvVariable('fbToken')
      
      request.post({
  	    url: 'https://graph.facebook.com/v2.6/me/messages',
  	   // url: 'http://localhost/v2.6/me/messages',
  	    qs: {access_token:token},
  	    method: 'POST',
  		json: {
  		    recipient: {id:sender},
  			message: messageData,
  		}
  	}, function(error, response, body) {
  		if (error) {
  		    macros.log('Error sending messages: ', error)
  		} else if (response.body.error) {
  		    macros.log('Error: ', response.body.error)
  	    }
      })
  }
  

  
  sendEmail() {
    
  }
  
  
  
  sendNotification() {
    
  }
  
  
  main() {
    
    this.sendFBNotification('1397905100304615', "test notification")
  }
  
}



const instance = new Notifyer();
export default instance;

if (require.main === module) {
  instance.main();
}
