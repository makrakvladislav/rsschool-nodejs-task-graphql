import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";
import { idParamSchema } from "../../utils/reusedSchemas";
import { createProfileBodySchema, changeProfileBodySchema } from "./schema";
import type { ProfileEntity } from "../../utils/DB/entities/DBProfiles";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  fastify.get("/", async function (request, reply): Promise<ProfileEntity[]> {
    const profiles = await fastify.db.profiles.findMany();
    if (profiles === null || !profiles) {
      throw reply.code(404);
    } else {
      return profiles;
    }
  });

  fastify.get(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profile = await fastify.db.profiles.findOne({ key: "id", equals: request.params.id });
      if (profile === null || !profile) {
        throw reply.code(404);
      } else {
        return profile;
      }
    }
  );

  fastify.post(
    "/",
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const user = await fastify.db.users.findOne({ key: "id", equals: request.body.userId });
      if (user === null || !user) {
        throw reply.code(400);
      }
      const profile = await fastify.db.profiles.findOne({ key: "userId", equals: request.body.userId });
      if (profile !== null) {
        throw reply.code(400);
      }
      const memberType = await fastify.db.memberTypes.findOne({ key: "id", equals: request.body.memberTypeId });
      if (memberType === null || !memberType) {
        throw reply.code(400);
      }
      const createProfile = await fastify.db.profiles.create(request.body);
      return createProfile;
    }
  );

  fastify.delete(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profile = await fastify.db.profiles.findOne({ key: "id", equals: request.params.id });

      if (profile === null || !profile) {
        throw reply.code(400).send({ message: `Profile ${request.params.id} not found` });
      } else {
        const deleteProfile = await fastify.db.profiles.delete(profile.id);
        return deleteProfile;
      }
    }
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profile = await fastify.db.profiles.findOne({ key: "id", equals: request.params.id });
      if (profile === null || !profile) {
        throw reply.code(400);
      } else {
        const updatedProfile = await fastify.db.profiles.change(request.params.id, request.body);
        return updatedProfile;
      }
    }
  );
};

export default plugin;
