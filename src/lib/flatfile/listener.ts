import api from "@flatfile/api";
import { FlatfileListener } from "@flatfile/listener";
import { recordHook } from "@flatfile/plugin-record-hook";

import { hasProperty } from "src/lib/utils";

/**
 * Example Listener
 */
export const listener = FlatfileListener.create((listener) => {
  listener.on("**", (event) => {
    console.log(`Received event: ${event.topic}`);
  });

  listener.use(
    recordHook("contacts", (record) => {
      const firstName = record.get("firstName");
      console.log({ firstName });
      record.set("lastName", "Rock");
      return record;
    }),
  );

  listener.filter({ job: "workbook:submitActionFg" }, (configure) => {
    configure.on("job:ready", async ({ context: { jobId } }) => {
      try {
        await api.jobs.ack(jobId, {
          info: "Getting started.",
          progress: 10,
        });

        // Make changes after cells in a Sheet have been updated
        console.log("Make changes here when an action is clicked");

        await api.jobs.complete(jobId, {
          outcome: {
            acknowledge: true,
            message: "This is now complete.",
            next: {
              type: "wait",
            },
          },
        });
      } catch (error: unknown) {
        console.error(
          "Error:",
          hasProperty(error, "stack") ? error?.stack : error,
        );

        await api.jobs.fail(jobId, {
          outcome: {
            message: "This job encountered an error.",
          },
        });
      }
    });
  });
});
