const { ApolloServer, gql, PubSub } = require("apollo-server-express");
const  express = require("express");
const http = require("http")
const IDEA_ADDED = "IDEA_ADDED";
const pubsub = new PubSub();
let ideas = [
  {
    text: "Harry Potter and the Chamber of Secrets",
    user: "J.K. Rowling"
  },
  {
    text: "Jurassic Park",
    user: "Michael Crichton"
  }
];

class Idea {
  constructor(user, text) {
    this.user = user;
    this.text = text;
  }
}
const typeDefs = gql`
  # Comments in GraphQL are defined with the hash (#) symbol.

  # This "Book" type can be used in other type declarations.
  type Idea {
    text: String
    user: String
  }

  # The "Query" type is the root of all GraphQL queries.
  # (A "Mutation" type will be covered later on.)
  type Subscription {
    ideaAdded: Idea
  }
  type Query {
    ideas: [Idea]
  }

  type Mutation {
    createIdea(user: String!, text: String!): Idea
  }
`;

const resolvers = {
  Subscription: {
    ideaAdded: {
      // Additional event labels can be passed to asyncIterator creation
      subscribe: () => pubsub.asyncIterator([IDEA_ADDED]),
      resolve: ({ideaAdded}) => ideaAdded
    }
  },
  Query: {
    ideas: () => ideas
  },
  Mutation: {
    createIdea: (parent, { user, text }) => {
      const idea = { user: user, text: text };
      ideas.push(idea);
      pubsub.publish(IDEA_ADDED, { ideaAdded: idea });
      return new Idea(user, text);
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  subscriptions: {
    onConnect: () => console.log('Connected to websocket'),
  },
  tracing: true
});

const app = express();
server.applyMiddleware({ app })


const PORT = 80;
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);
httpServer.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
    console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`)
  })


// server.listen().then(({ url }) => {
//   console.log(`🚀  Server ready at ${url}`);
// });
