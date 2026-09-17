import { useQuery } from "@tanstack/react-query";
import { getClinic } from "@/lib/patient";

export function useClinic() {
  return useQuery({
    queryKey: ["clinic"],
    queryFn: getClinic,
    staleTime: 60_000,
  });
}
