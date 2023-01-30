import { GraphQLID, GraphQLList, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { ProfileEntity } from "../../utils/DB/entities/DBProfiles";
import { UserEntity } from "../../utils/DB/entities/DBUsers";
import { memberType, memberTypeInput, postInput, postType, profileInput, profileType, userInput, usersAllFields, userType } from "./types";

export const graphqlBodySchema = {
  type: "object",
  properties: {
    mutation: { type: "string" },
    query: { type: "string" },
    variables: {
      type: "object",
    },
  },
  oneOf: [
    {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string" },
        variables: {
          type: "object",
        },
      },
      additionalProperties: false,
    },
    {
      type: "object",
      required: ["mutation"],
      properties: {
        mutation: { type: "string" },
        variables: {
          type: "object",
        },
      },
      additionalProperties: false,
    },
  ],
} as const;

const queryType = new GraphQLObjectType({
  name: "Query",
  fields: {
    user: {
      type: userType,
      args: { id: { type: GraphQLID }, firstName: { type: GraphQLString }, lastName: { type: GraphQLString }, email: { type: GraphQLString } },
      async resolve(source, args, context) {
        const user: UserEntity = await context.db.users.findOne({ key: "id", equals: args.id });
        return user;
      },
    },
    users: {
      type: new GraphQLList(userType),
      async resolve(source, args, context) {
        const users = await context.db.users.findMany();
        return users;
      },
    },
    posts: {
      type: new GraphQLList(postType),
      async resolve(source, args, context) {
        const posts: UserEntity = await context.db.posts.findMany();
        return posts;
      },
    },
    post: {
      type: postType,
      args: { id: { type: GraphQLID } },
      async resolve(source, args, context) {
        const postById = await context.db.posts.findOne({ key: "id", equals: args.id });
        return postById;
      },
    },
    memberType: {
      type: memberType,
      args: { id: { type: GraphQLID } },
      async resolve(source, args, context) {
        const memberTypesById = await context.db.memberTypes.findOne({ key: "id", equals: args.id });
        return memberTypesById;
      },
    },
    memberTypes: {
      type: new GraphQLList(memberType),
      async resolve(source, args, context) {
        const memberTypes = await context.db.memberTypes.findMany();
        return memberTypes;
      },
    },
    profile: {
      type: profileType,
      args: { id: { type: GraphQLID } },
      async resolve(source, args, context) {
        const profile = await context.db.profiles.findOne({ key: "id", equals: args.id });
        return profile;
      },
    },
    profiles: {
      type: new GraphQLList(profileType),
      args: { id: { type: GraphQLID } },
      async resolve(source, args, context) {
        const profiles = await context.db.profiles.findMany();
        return profiles;
      },
    },

    usersAllFields: {
      type: new GraphQLList(usersAllFields),
      async resolve(source, args, context) {
        const users = await context.db.users.findMany();
        const result = users.map(async (user: UserEntity) => {
          const profile = await context.db.profiles.findOne({ key: "userId", equals: user.id });
          const posts = await context.db.posts.findMany({ key: "userId", equals: user.id });
          let memberType = null;
          if (profile) {
            memberType = await context.db.memberTypes.findOne({ key: "id", equals: profile.memberTypeId });
          }

          return Object.assign(user, { profile, posts, memberType });
        });
        return result;
      },
    },

    userAllFields: {
      type: usersAllFields,
      args: { id: { type: GraphQLID } },
      async resolve(source, args, context) {
        const user: UserEntity = await context.db.users.findOne({ key: "id", equals: args.id });
        const profile: ProfileEntity = await context.db.profiles.findOne({ key: "userId", equals: user.id });
        const posts = await context.db.posts.findMany({ key: "userId", equals: user.id });
        let memberType = null;
        if (profile) {
          memberType = await context.db.memberTypes.findOne({ key: "id", equals: profile.memberTypeId });
        }

        return Object.assign(user, { profile, posts, memberType });
      },
    },

    userSubscribedTo: {
      type: new GraphQLList(usersAllFields),
      async resolve(source, args, context) {
        const users = await context.db.users.findMany();
        const result = users.map(async (user: UserEntity) => {
          const subscribedUsers = await context.db.users.findMany({ key: "subscribedToUserIds", inArray: user.id });
          const userSubscribedTo = subscribedUsers.map(async (relatedUser: UserEntity) => {
            return relatedUser.id;
          });
          const profile = await context.db.profiles.findOne({ key: "userId", equals: user.id });
          return Object.assign(user, { userSubscribedTo: userSubscribedTo }, { profile: profile });
        });
        return result;
      },
    },

    subscribedToUserById: {
      type: usersAllFields,
      args: {
        id: { type: GraphQLID },
      },
      async resolve(source, args, context) {
        const user = await context.db.users.findOne({ key: "id", equals: args.id });
        const posts = await context.db.posts.findMany({ key: "userId", equals: user.id });
        return Object.assign(user, { subscribedToUser: user.subscribedToUserIds, posts });
      },
    },

    subscribedUsers: {
      type: new GraphQLList(usersAllFields),
      async resolve(source, args, context) {
        const users = await context.db.users.findMany();
        const result = users.map(async (user: UserEntity) => {
          const relatedUsers = await context.db.users.findMany({ key: "subscribedToUserIds", inArray: user.id });
          const userSubscribedTo = relatedUsers.map(async (relatedUser: UserEntity) => {
            return relatedUser.id;
          });

          return Object.assign(user, { userSubscribedTo: userSubscribedTo }, { subscribedToUser: user.subscribedToUserIds });
        });
        return result;
      },
    },
  },
});

const mutationType = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    createUser: {
      type: userType,
      args: { input: { type: userInput } },
      async resolve(source, args, context) {
        const createUser: UserEntity = await context.db.users.create(args.input);
        return createUser;
      },
    },
    createProfile: {
      type: profileType,
      args: { input: { type: profileInput } },
      async resolve(source, args, context) {
        const user = await context.db.users.findOne({ key: "id", equals: args.input.userId });
        if (user === null || !user) {
          throw new Error(`User ${args.input.userId} not exist`);
        }
        const profile = await context.db.profiles.findOne({ key: "userId", equals: args.input.userId });
        if (profile !== null) {
          throw new Error(`Profile ${args.input.userId} not exist`);
        }
        const memberType = await context.db.memberTypes.findOne({ key: "id", equals: args.input.memberTypeId });
        if (memberType === null || !memberType) {
          throw new Error(`MemberType ${args.input.userId} not exist`);
        }
        const createProfile: ProfileEntity = await context.db.profiles.create(args.input);
        return createProfile;
      },
    },
    createPost: {
      type: postType,
      args: { input: { type: postInput } },
      async resolve(source, args, context) {
        const createPost: ProfileEntity = await context.db.posts.create(args.input);
        return createPost;
      },
    },
    updateUser: {
      type: userType,
      args: {
        id: { type: GraphQLID },
        input: { type: userInput },
      },
      async resolve(source, args, context) {
        const user = await context.db.users.findOne({ key: "id", equals: args.id });
        if (user === null || !user) {
          throw new Error(`User ${args.id} not exist`);
        } else {
          const updatedUser = await context.db.users.change(args.id, args.input);
          return updatedUser;
        }
      },
    },
    updateProfile: {
      type: profileType,
      args: {
        id: { type: GraphQLID },
        input: { type: profileInput },
      },
      async resolve(source, args, context) {
        const profile = await context.db.profiles.findOne({ key: "id", equals: args.id });
        if (profile === null || !profile) {
          throw new Error(`Profile ${args.id} not exist`);
        } else {
          const updatedProfile = await context.db.profiles.change(args.id, args.input);
          return updatedProfile;
        }
      },
    },
    updatePost: {
      type: postType,
      args: {
        id: { type: GraphQLID },
        input: { type: postInput },
      },
      async resolve(source, args, context) {
        const post = await context.db.posts.findOne({ key: "id", equals: args.id });
        if (post === null || !post) {
          throw new Error(`Post ${args.id} not exist`);
        } else {
          const updatedpost = await context.db.posts.change(args.id, args.input);
          return updatedpost;
        }
      },
    },
    updateMemberType: {
      type: memberType,
      args: {
        id: { type: GraphQLID },
        input: { type: memberTypeInput },
      },
      async resolve(source, args, context) {
        const member = await context.db.memberTypes.findOne({
          key: "id",
          equals: args.id,
        });
        if (member === null || !member) {
          throw new Error(`MemberType ${args.id} not exist`);
        }
        const memberType = await context.db.memberTypes.change(args.id, args.input);
        return memberType;
      },
    },
  },
});

export const Schema: GraphQLSchema = new GraphQLSchema({
  query: queryType,
  mutation: mutationType,
  types: [userType],
});
