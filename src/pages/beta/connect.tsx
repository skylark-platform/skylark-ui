import { useRouter } from "next/router";
import { useEffect } from "react";

export default function BetaConnect() {
  const router = useRouter();

  useEffect(() => {
    router.push(router.asPath.replace("/beta/connect", "/connect"));
  }, [router]);

  return <></>;
}
