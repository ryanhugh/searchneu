# Frontend

The frontend was made with React and Webpack. Redux isn't used at the moment but may be used in the future. All the react components are located in `frontend/components`. All the static files (robots.txt, etc.) are located in `frontend/static`.

### Home.js

Home.js is the main React component in Search NEU. It handles many different event listeners such as the back and forward buttons in the browser, the search box events, and the term selector events. When a user searches for a query, Home.js fetches the results from the server with `Search.js` and then sends the results to `ResultsLoader.js` to be rendered. 

# The Panels

## Classes

The class panels are responsible for rendering one class results on either mobile or desktop. 

### Desktop Class Panel

The desktop class panel renders one class and all the sections in the class on desktop. Example:

![Desktop Class Panel screenshot](https://i.imgur.com/h93IlBP.png)


### Mobile Class Panel

The desktop class panel renders one class result on mobile devices. Example:

![Mobile Class Panel screenshot](https://i.imgur.com/lqIFmcm.png)

### Mobile Section Panel

The mobile section panel renders one section on mobile devices. Example:

![Mobile Section Panel screenshot](https://i.imgur.com/izVuPL3.png)

### Employee Panel

The employee panel renders one employee result on either mobile devices or desktop devices. Examples:

Mobile:  
![Employe Mobile Panel screenshot](https://i.imgur.com/JCgjW3a.png)

Desktop:  
![Employe Desktop Panel screenshot](https://i.imgur.com/Eyk3AYd.png)

# Other components

### Location Link

The location link component renders the location of a section. If it is a valid building, it also hyperlinks it to Google Maps. Screenshot:

![Location Link screenshot](https://i.imgur.com/tQ849bd.png)


### Weekday boxes

The Weekday boxes component renders the boxes of when a section meets. Screenshot:

![Weekday boxes screenshot](https://i.imgur.com/SIEeiCP.png)







