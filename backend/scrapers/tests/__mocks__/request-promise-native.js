/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

export default function (request) {
  if (request.url.endsWith('fivelinks')) {
    return {
      body: '<a href="https://google.com/1"></a><a href="https://google.com/2"></a><a href="https://google.com/3"></a><a href="https://google.com/4"></a><a href="https://google.com/5"></a>',
      statusCode: 200,
    };
  }

  if (request.url.endsWith('somecrossdomain')) {
    return {
      body: '<a href="https://yahoo.com/1"></a><a href="https://bing.com/2"></a><a href="https://google.com/circletest"></a><a href="https://google.com/justanotherurl"></a>',
      statusCode: 200,
    };
  }

  if (request.url.endsWith('circletest')) {
    return {
      body: '<a href="https://yahoo.com/1"></a><a href="https://bing.com/2"></a><a href="https://google.com/somecrossdomain"></a><a nope></a>',
      statusCode: 200,
    };
  }


  return {
    body: `response for ${request.method} ${request.url}`,
    statusCode: 200,
  };
}
