import { FastifyPluginAsyncJsonSchemaToTs } from "@fastify/type-provider-json-schema-to-ts";
import { idParamSchema } from "../../utils/reusedSchemas";
import { changeMemberTypeBodySchema } from "./schema";
import type { MemberTypeEntity } from "../../utils/DB/entities/DBMemberTypes";

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  fastify.get("/", async function (request, reply): Promise<MemberTypeEntity[]> {
    const memberTypes = await fastify.db.memberTypes.findMany();
    return memberTypes;
  });

  fastify.get(
    "/:id",
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const memberTypesById = await fastify.db.memberTypes.findOne({ key: "id", equals: request.params.id });
      if (memberTypesById === null || !memberTypesById) {
        throw reply.code(404);
      } else {
        return memberTypesById;
      }
    }
  );

  fastify.patch(
    "/:id",
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const member = await fastify.db.memberTypes.findOne({
        key: "id",
        equals: request.params.id,
      });
      if (member === null || !member) {
        throw reply.code(400);
      }
      const memberType = await fastify.db.memberTypes.change(request.params.id, request.body);
      return memberType;
    }
  );
};

export default plugin;
