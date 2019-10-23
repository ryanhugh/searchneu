# Life of a notification

Are you wondering what happens from the moment you first sign into Facebook and hit the Send to Messenger button on the site to the moment you get a notification? You're in the right place, keep on reading 😉

Just as a warning, this is a more complex than it needs to be. We could refactor it so its a bit simpler. 

## Initial Frontend flow

 - When a new user goes to the site for the first time, they don't have any user data. Nothing is generated at this step and if the user never hits a `Sign up for notifications` button, nothing else in this flow will run. 
 -  When someone first clicks the `Sign up for notifications` button, the **loginKey** is generated. This loginKey is a long string that is generated in the browser that will be used in the future to authenticate the user to the backend. Also, at this step, the `Facebook Send To Messenger` button is rendered. The **loginKey** and the class/sections to be watched are embedded inside a `data-ref` attribute of the `Facebook Send To Messenger` button. 
 - When the user clicks the `Facebook Send To Messenger` button, the button sends a message to Facebook's servers. Then, Facebook sends a webhook to the production server. This request contains the `data-ref`. 

## Initial Backend flow

 - The backend gets this webhook and decodes the `data-ref`. Because the webhook comes from Facebook, we can trust it. Then, the backend parses the class and sections from the `data-ref` and adds them to be watched in Firebase. 
 - At the same time, the frontend makes a request to the backend for this user data. The frontend has the **loginKey** from earlier, which is used to authenticate this request from the frontend. The data is then returned to the frontend. 

## Back to the frontend 

-  Back in the frontend, [User.js](https://github.com/sandboxnu/searchneu/blob/master/frontend/components/user.js) is told through `downloadUserData` that the user is now watching these classes. Some other components (such as the Class Panels and SignUpForNotifications.js) have handler methods registered with User.js that are now called. The site's UI is now updated to reflect the user is now logged in.  

## Second flow - Adding more notifications
- When the user clicks another `Sign up for notifications` button again, User.js is called to make a request with the **loginKey** to the backend with the class they signed up for.
- The backend gets this requests, verifies it with the **loginKey**, and updates Firebase. 


## Possible Simplifications

This flow requires that we have two separate flows, one for the first request and one for all subsequent requests. Most of the reason we have the first flow now is to initially authenticate the user, but we should be able to use some **FB.js** APIs such as `FB.getLoginStatus` to get a signed Facebook token in the frontend, which will let us eliminate most of the first flow entirely. 

## Updater.js

Once the data is in Firebase it will be picked up by [the updater](https://github.com/sandboxnu/searchneu/blob/master/backend/updater.js). The updater runs once every 5 minutes. It first pulls all the user information from Firebase, and then re-scrapes every class that anyone is watching. Then, it sends out notifications and updates elasticsearch with the updated seat information. 


