import { useQuery } from "@apollo/client";
import { GET_SKYLARK_SCHEMA } from "src/lib/graphql/skylark/queries";

export const useSkylarkSchema = () => {
  const { loading, error, data } = useQuery(GET_SKYLARK_SCHEMA);
  return {
    loading,
    error,
    data,
  };
};
