import dayjs from "dayjs";

const thisMinute = () => dayjs().second(0).millisecond(0);

export const todayFromNow = (minutes) => {
  const now = thisMinute();
  const target = now.add(minutes, "minute");
  if (target.isSame(now, "day")) return target.toISOString();
  const edge =
    minutes < 0 ? now.startOf("day") : now.hour(23).minute(59).second(0);
  return edge.toISOString();
};

export const dayAt = (offset, hour, minute = 0) =>
  thisMinute().add(offset, "day").hour(hour).minute(minute).toISOString();
