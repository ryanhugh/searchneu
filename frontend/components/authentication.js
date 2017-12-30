import macros from './macros'


class Authentication {

  constructor() {



    if (window.FB) {
      this.initFB();
    }
    else {
      window.fbAsyncInit = this.initFB.bind(this);
    }

    this.onSendToMessengerClick = this.onSendToMessengerClick.bind(this);
  }


  initFB() {
    window.FB.init({
      appId            : '1979224428978082',
      autoLogAppEvents : false,
      xfbml            : false,
      version          : 'v2.11',
    });


    window.FB.Event.subscribe('send_to_messenger', this.onSendToMessengerClick);
  }

  onSendToMessengerClick(event) {

      
      if (e.event === 'rendered') {
        macros.log('Plugin was rendered');
      } else if (e.event === 'checkbox') {
        const checkboxState = e.state;
        macros.log(`Checkbox state: ${checkboxState}`);
      } else if (e.event === 'not_you') {
        macros.log("User clicked 'not you'");
      } else if (e.event === 'hidden') {
        macros.log('Plugin was hidden');
      } else if (e.event === 'opt_in') {
        macros.log("Opt in was clicked!", e)

        if (macros.DEV) {
          request.post({
            url: '/webhook', 
            body: {
              "object": "page",
              "entry": [
              {
                  "id": "111111111111111",
                  "time": Date.now(),
                  "messaging": [
                  {
                      "recipient":
                      {
                          "id": "111111111111111"
                      },
                      "timestamp": Date.now(),
                      "sender":
                      {
                          "id": "1397905100304615"
                      },
                      "optin":
                      {
                          "ref": e.ref
                      }
                  }]
              }]
          }
        }
        )

        // Fetch the sender id from the server

        

          

      } else {
        macros.log(e, 'other message');
      }
    }
  }

}


export default new Authentication();