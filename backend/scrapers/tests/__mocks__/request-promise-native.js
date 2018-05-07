/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

export default function (request) {
  return {
    body: `response for ${request.method} ${request.url}`,
    statusCode: 200,
  };
}
