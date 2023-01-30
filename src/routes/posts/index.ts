import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";
import { idParamSchema } from "../../utils/reusedSchemas";
import { createPostBodySchema, changePostBodySchema } from "./schema";
import type { PostEntity } from "../../utils/DB/entities/DBPosts";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  fastify.get("/", async function (request, reply): Promise<PostEntity[]> {
    const posts = await fastify.db.posts.findMany();
    return posts;
  });

  fastify.get(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const postById = await fastify.db.posts.findOne({ key: "id", equals: request.params.id });
      if (postById === null || !postById) {
        throw reply.code(404);
      } else {
        return postById;
      }
    }
  );

  fastify.post(
    "/",
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const createPost = await fastify.db.posts.create(request.body);
      return createPost;
    }
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const post = await fastify.db.posts.findOne({ key: "id", equals: request.params.id });

      if (post === null || !post) {
        throw reply.code(400).send({ message: `Post ${request.params.id} not found` });
      } else {
        const deletePost = await fastify.db.posts.delete(request.params.id);
        return deletePost;
      }
    }
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const post = await fastify.db.posts.findOne({ key: "id", equals: request.params.id });
      if (post === null || !post) {
        throw reply.code(400);
      } else {
        const updatedpost = await fastify.db.posts.change(request.params.id, request.body);
        return updatedpost;
      }
    }
  );
};

export default plugin;
