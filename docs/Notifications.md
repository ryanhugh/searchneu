# Overview

To sign up for notifications, we use facebook for both authentication and sending notifications. Each person's information is stored in a database, which is interfaced by `searchneu/backend/database.js`. In production, the database is linked to a firebase instance, in development, the database is just stored in memory. After that, the data is interacted with by `searchneu/backend/server.js` and sent to the front end on request.

The frontend receives and interacts the data using `searchneu/frontend/components/user.js` as an interface. If any frontend/backend communication wants to be added, it's put there. When a user signs up for classes using one of the NotifCheckBoxes, the corresponding state is sent to the backend through user.
