import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export const registerProcedure = publicProcedure
  .input(z.object({ 
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6)
  }))
  .mutation(async ({ input }) => {
    // In a real app, this would create a user in the database
    // For demo purposes, we'll just return a success response
    return {
      success: true,
      user: {
        id: `user_${Date.now()}`,
        name: input.name,
        email: input.email,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80',
        createdAt: new Date().toISOString(),
      }
    };
  });

export default registerProcedure;