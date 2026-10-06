import { useQuery } from "@tanstack/react-query";
import { directoryAPI } from "../api/directoryApi";

/**
 * Fetch directory metadata including breadcrumb path.
 * @param {string} id - directory ObjectId
 */
export function useDirectoryInfo(id) {
  return useQuery({
    queryKey: ["directoryInfo", id],
    queryFn: async () => {
      const res = await directoryAPI.getInfo(id);
      return res.data?.data?.item || null;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

/**
 * Derive breadcrumbs from directory info.
 * path = ancestors (includes root), NOT including current item.
 * Result: [...ancestors, currentDir]
 */
export function useBreadcrumbs(id) {
  const { data: dirInfo, isLoading } = useDirectoryInfo(id);

  let breadcrumbs;
  if (!dirInfo) {
    breadcrumbs = [];
  } else {
    const ancestors = dirInfo.path || [];
    breadcrumbs = [...ancestors, { id: dirInfo.id, name: dirInfo.name }];
  }

  return { breadcrumbs, isLoading };
}
