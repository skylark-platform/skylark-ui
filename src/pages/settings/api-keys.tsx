import clsx from "clsx";
import dayjs from "dayjs";
import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { DeleteConfirmationModal, ApiKeyModal } from "src/components/modals";
import { Toast } from "src/components/toast/toast.component";
import { HREFS } from "src/constants/skylark";
import { useDeleteApiKey } from "src/hooks/apiKeys/useDeleteApiKey";
import { useListApiKeys } from "src/hooks/apiKeys/useListApiKeys";
import { SkylarkGraphQLAPIKey } from "src/interfaces/skylark";
import { formatReadableDateTime } from "src/lib/skylark/availability";

export default function ApiKeysPage() {
  const { data } = useListApiKeys();

  const [modalState, setModalState] = useState<
    | null
    | { mode: "create" }
    | { mode: "edit" | "delete"; apiKey: SkylarkGraphQLAPIKey }
  >(null);

  const sortedApiKeys = data && [...data].reverse();

  const { deleteApiKey, isPending: isDeletingApiKey } = useDeleteApiKey({
    onSuccess: (name) => {
      toast.success(
        <Toast
          title={`Key "${name}" deleted`}
          message={["An API Key has been deleted."]}
        />,
      );
      setModalState(null);
    },
    onError: (err) => {
      toast.error(
        <Toast
          title={`Error deleting key`}
          message={[
            "Please try again later.",
            err.response.errors?.[0].message,
          ]}
        />,
      );
    },
  });

  return (
    <div className="mx-auto mt-32 flex w-full max-w-5xl flex-col justify-center text-sm">
      <div className="flex justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Manage API Keys</h1>
          <p>
            Keys that you have generated can be used with the{" "}
            <Button variant="ghost" href={HREFS.apiDocs.root} newTab>
              Skylark API
            </Button>
            .
          </p>
        </div>
        <Button
          variant="primary"
          Icon={<FiPlus className="stroke-success-content text-xl" />}
          onClick={() => setModalState({ mode: "create" })}
        >
          Create
        </Button>
      </div>

      {sortedApiKeys?.map(({ name, active, permissions, expires, created }) => (
        <div
          key={name}
          className={clsx(
            "my-2 bg-white z-30 border rounded-lg items-center h-14 px-8 flex justify-between",
            active
              ? "shadow border-manatee-300"
              : "opacity-40 border-manatee-200",
          )}
        >
          <div className={clsx("flex-grow")}>
            <p className="font-medium mr-1">
              {name}{" "}
              <span className="text-manatee-600 text-xs">
                - {permissions.join(", ")}
              </span>
            </p>
            <div className="flex">
              <p className="text-xs text-manatee-400 mr-1">
                {created
                  ? `Created ${formatReadableDateTime(created)} -`
                  : "Automatically generated -"}
              </p>
              {active && (
                <p
                  className={clsx(
                    "text-xs",
                    expires ? "text-warning" : "text-manatee-400",
                  )}
                >
                  {expires
                    ? `Expires ${dayjs(expires).fromNow()}`
                    : "Never expires"}
                </p>
              )}
              {!active && <p className="text-manatee-500 text-xs">Disabled.</p>}
            </div>
          </div>
          <div className="gap-2 flex">
            <Button
              variant="outline"
              onClick={() =>
                setModalState({
                  mode: "edit",
                  apiKey: {
                    active,
                    api_key: null,
                    name,
                    permissions,
                    expires,
                    created,
                  },
                })
              }
            >
              Edit
            </Button>
            <Button
              variant="outline"
              danger
              onClick={() =>
                setModalState({
                  mode: "delete",
                  apiKey: {
                    active,
                    api_key: null,
                    name,
                    permissions,
                    expires,
                    created,
                  },
                })
              }
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
      <ApiKeyModal
        isOpen={Boolean(
          modalState &&
            (modalState.mode === "create" || modalState.mode === "edit"),
        )}
        closeModal={() => setModalState(null)}
        existingApiKey={
          (modalState?.mode === "edit" && modalState.apiKey) || undefined
        }
      />
      <DeleteConfirmationModal
        title="Delete API Key"
        description={`Are you sure you want to delete the API Key "${modalState?.mode === "delete" && modalState.apiKey.name}"?`}
        isOpen={Boolean(modalState?.mode === "delete")}
        closeModal={() => setModalState(null)}
        onDeleteConfirmed={() =>
          modalState?.mode === "delete" && deleteApiKey(modalState.apiKey.name)
        }
        isDeleting={isDeletingApiKey}
      />
    </div>
  );
}
