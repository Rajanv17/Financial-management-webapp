import { Prisma, NotificationType } from "../generated/prisma/client";
import { prisma } from "../config";

type Db = Prisma.TransactionClient | typeof prisma;

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  dedupeKey: string;
  data?: Prisma.InputJsonValue;
}

export async function createNotification(
  input: CreateNotificationInput,
  db: Db = prisma,
): Promise<boolean> {
  const { count } = await db.notification.createMany({
    data: [
      {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        dedupeKey: input.dedupeKey,
        data: input.data,
      },
    ],
    skipDuplicates: true,
  });
  return count === 1;
}
