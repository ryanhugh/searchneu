# Overview

To sign up for notifications, we use facebook for both authentication and sending notifications. Each person's information is stored in a database, which is interfaced by `searchneu/backend/database.js`. In production, the database is linked to a firebase instance, in development, the database is just stored in memory. After that, the data is interacted with by server.js, 
