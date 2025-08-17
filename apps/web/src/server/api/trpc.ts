import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";

export const t = initTRPC.create({
  errorFormatter({ shape, error }) {
    const data = {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    };
    return { ...shape, data };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware to check authentication
const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      session,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
