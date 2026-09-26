import { usePaths } from "../contexts/PathsContext";
import { useAuth } from "./useAuth";
import { backendEnabled } from "../services/apiClient";
import { visibleToEmployee } from "../utils/pathWorkflow";

/**
 * Lộ trình của nhân viên đang đăng nhập. Có backend: server chỉ trả về lộ trình đã gán cho người này
 * (bản ghi gán), nên không lọc lại theo phòng ban / vị trí ở đây.
 */
export function useMyPaths() {
  const { paths } = usePaths();
  const { user } = useAuth();
  if (backendEnabled()) return paths.filter(p => p.status === "published");
  return paths.filter(p => visibleToEmployee(p, user));
}
