import { router } from "./trpc";
import { z } from "zod";
import { publicProcedure } from "./trpc";

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true })),
  echo: publicProcedure.input(z.object({ text: z.string() })).mutation(({ input }) => ({ text: input.text })),
});

export type AppRouter = typeof appRouter;
