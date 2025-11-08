import { z } from "zod";

export const Ping = z.object({ type: z.literal("ping") });
export const Hello = z.object({
  type: z.literal("hello"),
  name: z.string().min(1),
});
export const Incoming = z.union([Ping, Hello]);

export const Pong = z.object({
  type: z.literal("pong"),
  at: z.string(),
});
export type Pong = z.infer<typeof Pong>;
export const Welcome = z.object({
  type: z.literal("welcome"),
  you: z.object({ name: z.string() }),
  at: z.string(),
});
export type Welcome = z.infer<typeof Welcome>;
export const Err = z.object({
  type: z.literal("error"),
  code: z.string(),
  message: z.string().optional(),
});

export type Incoming = z.infer<typeof Incoming>;

export const protocolVersion = "0.1.0";
