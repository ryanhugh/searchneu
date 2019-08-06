# Search

The search itself has undergone many different iterations since the first prototype was working. Currently, the search itself is powered  by [Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/elasticsearch-intro.html). Elasticsearch is run as a self-contained process separate from our backend server and is accessed via their REST api, though we use their [Node.js client](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html) that wraps the REST api. It runs on the same VM as the backend, but could easily be moved to a dedicated machine, or one of the many [hosted Elasticsearch services](https://www.elastic.co/pricing) could be used. There's an index for all classes, and an index for employees. `esMapping.json `contains the schema, or "mapping" for the classes index, and we let elasticsearch infer the employee mapping.

## Search Architecture

Elasticsearch is our primary datastore - the entire corpus of course documents is stored in Elasticsearch and nowhere else. This is not typical. Most architectures store documents in a traditional database (Mongo, Postgress etc) and just store the fields that are searched over in Elasticsearch. Then, when a user searches, they have to search Elasticsearch for matching documents, then also go to Mongo and query for the body of each of those documents. The primary considerations for this architecture are that Elasticsearch is (1) not good at rapidly updating data (2) isn't as resilient as other DBs. For SearchNEU, neither applies to us. (1) Data is updated once a day, except for a few "watched" classes that update every 5 minutes. (2) In the extremely rare case that Elasticsearch drops some documents, we just rescrape! **The course catalog is our back-up solution and single source of truth.**

## Search Profiling and Debugging

To debug our queries, use [Kibana](https://www.elastic.co/guide/en/kibana/current/introduction.html), a visualization tool made by the Elastic team. It has tons of features, but for testing new queries on our Elasticsearch index, you just need their [console](https://www.elastic.co/guide/en/kibana/current/console-kibana.html). Alternatively, you can send requests to the Elasticsearch REST API directly with a tool like Postman or Curl.

Log in Chrome Dev tools of the searches being sent to the server:

![](https://i.imgur.com/UZorFlV.png)


When you are typing something into the box, it just loads the first 5 results. More results are loaded as the user is scrolling down the page. 

# Scoring

All the fields get different boostings. Check `server.js` for current setup.

# Optimizations

#### Subject space adding

Searching for "CS2500" and "CS 2500" and "cs2500" should all behave the same. This is accomplished by adding copying a a custom analyzer on the class code field in the Elasticsearch mapping to tokenize `CS2500` into two tokens, `CS` and `2500`. This happens at index and query time.

#### Hardcoded synonyms

Some slang, such as `fundies`, is used all the time at NEU to refer to Fundamentals of Computer Science but is not found anywhere in the description or name of the Fundamentals of Computer Science classes. These exceptions are hardcoded in `searchneu/common/search.js`. 
