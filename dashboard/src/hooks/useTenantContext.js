import { useAuthStore } from '../store/authStore';
import { getTenantContext } from '../utils/tenantContext';

export function useTenantContext() {
  const outlet = useAuthStore((state) => state.outlet);
  return getTenantContext(outlet);
}