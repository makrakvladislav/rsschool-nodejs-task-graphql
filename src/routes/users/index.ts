import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";
import { idParamSchema } from "../../utils/reusedSchemas";
import { createUserBodySchema, changeUserBodySchema, subscribeBodySchema } from "./schemas";
import type { UserEntity } from "../../utils/DB/entities/DBUsers";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  fastify.get("/", async function (request, reply): Promise<UserEntity[]> {
    const users = await fastify.db.users.findMany();
    return users;
  });

  fastify.get(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const userById = await fastify.db.users.findOne({ key: "id", equals: request.params.id });
      if (userById === null || !userById) {
        throw reply.code(404);
      } else {
        return userById;
      }
    }
  );

  fastify.post(
    "/",
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const createUser = await fastify.db.users.create(request.body);
      return createUser;
    }
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({
        key: "id",
        equals: request.params.id,
      });

      if (user === null || !user) {
        throw reply.code(400);
      } else {
        const subscribedUsers = await fastify.db.users.findMany({ key: "subscribedToUserIds", inArray: user.id });
        const posts = await fastify.db.posts.findMany();
        const profiles = await fastify.db.profiles.findMany();

        subscribedUsers.map((subscriber) => {
          return fastify.db.users.change(subscriber.id, {
            subscribedToUserIds: subscriber.subscribedToUserIds.filter((subscriberId) => subscriberId !== user.id),
          });
        });

        posts.map((post) => {
          if (post.userId === user.id) {
            fastify.db.posts.delete(post.id);
          }
        });

        profiles.map((profile) => {
          if (profile.userId === user.id) {
            fastify.db.profiles.delete(profile.id);
          }
        });

        return await fastify.db.users.delete(user.id);
      }
    }
  );

  fastify.post(
    "/:id/subscribeTo",
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({ key: "id", equals: request.params.id });
      if (user === null || !user) {
        throw reply.code(400);
      } else {
        const subscribedUser = await fastify.db.users.findOne({
          key: "id",
          equals: request.body.userId,
        });

        if (subscribedUser === null || !subscribedUser) {
          throw reply.code(400);
        }
        subscribedUser.subscribedToUserIds.push(user.id);
        return await fastify.db.users.change(request.body.userId, { subscribedToUserIds: subscribedUser.subscribedToUserIds });
      }
    }
  );

  fastify.post(
    "/:id/unsubscribeFrom",
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({ key: "id", equals: request.params.id });
      if (user === null || !user) {
        throw reply.code(400);
      } else {
        const current = await fastify.db.users.findOne({
          key: "id",
          equals: request.body.userId,
        });

        if (current === null || !current) {
          throw reply.code(400);
        }

        const subscribedUsers = current.subscribedToUserIds.filter((id) => user.id !== id);
        if (!current.subscribedToUserIds.some((userId) => userId === user.id)) {
          throw reply.code(400);
        }

        return await fastify.db.users.change(request.body.userId, { subscribedToUserIds: subscribedUsers });
      }
    }
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const user = await fastify.db.users.findOne({ key: "id", equals: request.params.id });
      if (user === null || !user) {
        throw reply.code(400);
      } else {
        const updatedUser = await fastify.db.users.change(request.params.id, request.body);
        return updatedUser;
      }
    }
  );
};

export default plugin;
