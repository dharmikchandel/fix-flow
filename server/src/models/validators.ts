import { z } from "zod";

export const createBugSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must not exceed 200 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must not exceed 5000 characters"),
  stepsToReproduce: z.string().max(5000).optional(),
  module: z
    .string()
    .min(1, "Module is required")
    .max(100, "Module must not exceed 100 characters"),
  environment: z.string().max(100).optional(),
});

export const assignBugSchema = z.object({
  bugId: z.string().min(1, "Bug ID is required"),
});

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  role: z.enum(["engineer", "lead", "manager"]).optional(),
  expertise: z
    .array(z.string())
    .min(1, "At least one expertise area is required"),
  maxCapacity: z.number().int().min(1).max(20).optional(),
});

export type CreateBugPayload = z.infer<typeof createBugSchema>;
export type AssignBugPayload = z.infer<typeof assignBugSchema>;
export type CreateUserPayload = z.infer<typeof createUserSchema>;
