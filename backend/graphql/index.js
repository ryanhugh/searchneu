import { ApolloServer, gql } from 'apollo-server-express';
import GraphQLJSON, { GraphQLJSONObject } from 'graphql-type-json';
import macros from '../macros';

import classResolvers from './resolvers/class';
import classTypeDef from './typeDefs/class';
import classOccurrenceTypeDef from './typeDefs/classOccurrence';

import majorResolvers from './resolvers/major';
import majorTypeDef from './typeDefs/major';
import majorOccurrenceTypeDef from './typeDefs/majorOccurrence';


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
  typeDefs: [baseQuery, classTypeDef, classOccurrenceTypeDef, majorTypeDef, majorOccurrenceTypeDef],
  resolvers: [JSONResolvers, classResolvers, majorResolvers],
});

if (require.main === module) {
  server.listen().then(({ url }) => {
    macros.log(`ready at ${url}`);
  });
}

export default server;
