import { ApolloServer, gql } from 'apollo-server-express';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import macros from '../macros';

import classResolvers from './resolvers/class';
import classTypeDef from './typeDefs/class';

import classOccurrenceTypeDef from './typeDefs/classOccurrence';

// Enable JSON custom type
const JSONResolvers = {
  JSON: GraphQLJSON,
  JSONObject: GraphQLJSONObject,
};

// Base query so other typeDefs can do "extend type Query"
const baseQuery = gql`
  scalar JSON
  scalar JSONObject

  type Query {
    _empty: String
  }
`;

const server = new ApolloServer({
  typeDefs: [baseQuery, classTypeDef, classOccurrenceTypeDef],
  resolvers: [JSONResolvers, classResolvers],
});

if (require.main === module) {
  server.listen().then(({ url }) => {
    macros.log(`ready at ${url}`);
  });
}

export default server;
