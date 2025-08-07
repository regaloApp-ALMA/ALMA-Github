import { z } from "zod";
import { publicProcedure } from "../../../create-context";

export const loginProcedure = publicProcedure
  .input(z.object({ 
    email: z.string().email(),
    password: z.string().min(6)
  }))
  .mutation(async ({ input }) => {
    // In a real app, this would validate credentials against a database
    // For demo purposes, we'll accept specific demo credentials or any valid email/password
    if (input.email && input.password && input.password.length >= 6) {
      // Demo user credentials
      if (input.email === 'demo@alma.com' && input.password === 'demo123') {
        return {
          success: true,
          user: {
            id: 'demo_user',
            name: 'Usuario Demo',
            email: 'demo@alma.com',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80',
            createdAt: new Date().toISOString(),
          }
        };
      }
      
      // Ana García credentials
      if (input.email === 'ana.garcia@example.com' && input.password === 'password') {
        return {
          success: true,
          user: {
            id: 'user1',
            name: 'Ana García',
            email: 'ana.garcia@example.com',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80',
            createdAt: new Date().toISOString(),
          }
        };
      }
      
      // Any other valid email/password combination
      return {
        success: true,
        user: {
          id: `user_${Date.now()}`,
          name: 'Usuario',
          email: input.email,
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80',
          createdAt: new Date().toISOString(),
        }
      };
    }
    
    throw new Error('Credenciales incorrectas');
  });

export default loginProcedure;