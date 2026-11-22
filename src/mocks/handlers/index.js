import { delay, http } from "msw";
import { appointmentHandlers } from "./appointments";
import { authHandlers } from "./auth";
import { petHandlers, petOwnerHandlers } from "./petOwners";
import { userHandlers } from "./users";

export const handlers = [
  http.all("*", () => delay(1000)),
  ...authHandlers,
  ...appointmentHandlers,
  ...petOwnerHandlers,
  ...petHandlers,
  ...userHandlers,
];
