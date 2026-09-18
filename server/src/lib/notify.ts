import { db } from "../db/index.js";
import { notifications, type notificationTypeEnum } from "../db/schema.js";

type NotifType = (typeof notificationTypeEnum.enumValues)[number];

export async function notify(
  userId: string,
  type: NotifType,
  title: string,
  text: string,
  metadata: Record<string, string> = {},
) {
  await db.insert(notifications).values({ userId, type, title, text, metadata });
}
