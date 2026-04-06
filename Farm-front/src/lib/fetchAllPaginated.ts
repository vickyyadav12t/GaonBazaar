import { apiService } from '@/services/api';

/** Load all of the current user's orders (buyer/farmer) using limit/skip pages. */
export async function fetchAllOrdersForCurrentUser(options?: {
  status?: string;
  paymentStatus?: 'pending';
}): Promise<unknown[]> {
  const limit = 100;
  let skip = 0;
  const all: unknown[] = [];
  for (;;) {
    const { data } = await apiService.orders.getAll({
      limit,
      skip,
      ...(options?.status ? { status: options.status } : {}),
      ...(options?.paymentStatus ? { paymentStatus: options.paymentStatus } : {}),
    });
    const batch = data?.orders || [];
    all.push(...batch);
    if (batch.length < limit) break;
    skip += limit;
  }
  return all;
}
