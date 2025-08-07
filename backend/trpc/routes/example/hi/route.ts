import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export default publicProcedure
  .input(z.object({ name: z.string().optional().default("world") }))
  .query(({ input }) => {
    return {
      hello: input.name,
      date: new Date(),
    };
  });