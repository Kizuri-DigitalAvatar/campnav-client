/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as announcements from "../announcements.js";
import type * as cron from "../cron.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as files from "../files.js";
import type * as images from "../images.js";
import type * as menus from "../menus.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";
import type * as reports from "../reports.js";
import type * as requests from "../requests.js";
import type * as rooms from "../rooms.js";
import type * as search from "../search.js";
import type * as tasks from "../tasks.js";
import type * as test from "../test.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  announcements: typeof announcements;
  cron: typeof cron;
  crons: typeof crons;
  email: typeof email;
  files: typeof files;
  images: typeof images;
  menus: typeof menus;
  notifications: typeof notifications;
  orders: typeof orders;
  products: typeof products;
  reports: typeof reports;
  requests: typeof requests;
  rooms: typeof rooms;
  search: typeof search;
  tasks: typeof tasks;
  test: typeof test;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
