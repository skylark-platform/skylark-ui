import { useRouter } from "next/router";
import { useState } from "react";

import { TextInput } from "src/components/inputs/input";

export default function GenerateAutoconnect() {
  const { query } = useRouter();

  const uri = query.uri;
  const apiKey = query.apikey;
  const token = uri && apiKey ? btoa(`${uri}__${apiKey}`) : null;

  const [redirectTo, setRedirectTo] = useState("");

  const autoconnectUrl =
    typeof window !== "undefined" &&
    token &&
    `${window.location.origin}/connect?token=${token}${redirectTo ? `&redirect=${redirectTo}` : ""}`;

  return (
    <div className="mx-auto pt-32 flex w-full max-w-3xl flex-col justify-center items-center text-sm">
      <h1 className="mb-2 font-heading text-2xl md:mb-4 md:text-3xl text-center">
        Generate Autoconnect URL
      </h1>
      <div className="w-full mt-8">
        <TextInput
          label="Add optional redirect?"
          value={redirectTo}
          onChange={setRedirectTo}
        />
      </div>
      <div className="w-full flex justify-center flex-col items-center mt-8 gap-4">
        {autoconnectUrl ? (
          <>
            <TextInput
              label="Autoconnect URL"
              value={autoconnectUrl}
              withCopy
              onChange={() => ""}
            />
            <p className="w-full text-wrap whitespace-pre font-mono break-all">
              {autoconnectUrl}
            </p>
          </>
        ) : (
          <>
            <p>
              Enter your Skylark URI and API Key into the URL to auto connect.
            </p>
            <p>
              {"Format: "}
              <code>
                {"?uri=${skylark_graphql_url}&apikey=${skylark_api_key}"}
              </code>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
