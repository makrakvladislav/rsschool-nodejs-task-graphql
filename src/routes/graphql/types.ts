import { GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from "graphql";

export const userType = new GraphQLObjectType({
  name: "userType",
  fields: () => ({
    id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    subscribedToUserIds: { type: new GraphQLList(GraphQLString) },
  }),
});

export const profileType = new GraphQLObjectType({
  name: "profileType",
  fields: () => ({
    id: { type: GraphQLID },
    avatar: { type: GraphQLString },
    sex: { type: GraphQLString },
    birthday: { type: GraphQLInt },
    country: { type: GraphQLString },
    street: { type: GraphQLString },
    city: { type: GraphQLString },
    memberTypeId: { type: GraphQLString },
    userId: { type: GraphQLString },
  }),
});

export const postType = new GraphQLObjectType({
  name: "postType",
  fields: () => ({
    id: { type: GraphQLID },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    userId: { type: GraphQLString },
  }),
});

export const memberType = new GraphQLObjectType({
  name: "memberType",
  fields: () => ({
    id: { type: GraphQLID },
    discount: { type: GraphQLInt },
    monthPostsLimit: { type: GraphQLInt },
  }),
});

export const usersAllFields = new GraphQLObjectType({
  name: "usersAllFields",
  fields: () => ({
    id: { type: GraphQLID },
    firstName: { type: GraphQLString },
    lastName: { type: GraphQLString },
    email: { type: GraphQLString },
    subscribedToUser: { type: new GraphQLList(GraphQLString) },
    subscribedToUserIds: { type: new GraphQLList(GraphQLString) },
    userSubscribedTo: { type: new GraphQLList(GraphQLString) },
    profile: {
      type: profileType,
    },
    posts: {
      type: new GraphQLList(postType),
    },
    memberType: {
      type: memberType,
    },
  }),
});
