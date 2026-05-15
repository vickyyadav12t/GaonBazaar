import { Users, Search, Loader2, Package, Star, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AnimateOnScroll, StaggerContainer } from '@/components/animations';
import { useAdminDashboard } from '../adminDashboardContext';
import { AdminUserActionsMenu, AdminPager, USERS_PAGE_SIZE } from '../adminShared';
import { resolveBackendAssetUrl } from '@/lib/productImageUrl';


export default function AdminUsersTab() {
  const vm = useAdminDashboard();
  return (
    <div className="space-y-6">
  <AnimateOnScroll animation="slide-up">
    <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#315f3b]" />
          User Management
        </CardTitle>
        <CardDescription className="text-[#6f6552]">
          Manage farmers and buyers. Search matches name, phone, or email on the server (updates after you stop typing).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b816f]" />
            <Input
              placeholder="Search by name, phone, or email…"
              value={vm.searchQuery}
              onChange={(e) => vm.setSearchQuery(e.target.value)}
              className="border-[#d7c7a8] bg-[#fffdf7] pl-10 text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
              aria-busy={vm.isUserSearchLoading}
            />
          </div>
        </div>

        {vm.isUserSearchLoading && vm.usersSearchActive && (
          <div className="mb-4 flex items-center gap-2 text-sm text-[#6f6552]">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            Searching users…
          </div>
        )}

        {vm.usersSearchEmpty && (
          <p className="mb-6 rounded-lg border border-dashed border-[#d7c7a8] bg-[#fffdf7] py-4 text-center text-sm text-[#6f6552]">
            No farmers or buyers match &ldquo;{vm.debouncedUserSearch}&rdquo;. Try another name, phone, or email.
          </p>
        )}

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#315f3b]" />
              Farmers (
              {vm.usersSearchActive ? `${vm.usersTabFarmers.length} matched` : `${vm.totalFarmersUsers} total`})
            </h3>
            {vm.usersTabLoading && !vm.usersSearchActive && (
              <div className="mb-3 flex items-center gap-2 text-sm text-[#6f6552]">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                Loading page…
              </div>
            )}
            <div className="space-y-3">
              {vm.usersTabFarmers.map((farmer) => (
                <div
                  key={farmer.id}
                  className="flex flex-col gap-4 rounded-lg border border-[#d7c7a8] bg-[#fffdf7] p-4 transition-all hover:border-[#c8b38b] hover:shadow-[0_16px_40px_rgba(95,70,40,0.12)] sm:flex-row sm:items-center"
                >
                  <img
                    src={resolveBackendAssetUrl(farmer.avatar)}
                    alt={farmer.name}
                    className="h-14 w-14 shrink-0 rounded-full border-2 border-[#bfd2bf] object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.onerror = null;
                      el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(farmer.name || 'Farmer')}&size=128`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-base">{farmer.name}</p>
                      {vm.getKycBadge(farmer.kycStatus)}
                      {farmer.accountStatus === 'suspended' ? (
                        <Badge className="text-xs bg-[#f6e5dc] text-[#8a4f2a] hover:bg-[#f6e5dc]">
                          Suspended
                        </Badge>
                      ) : null}
                      {farmer.emailVerified ? (
                        <Badge variant="outline" className="text-xs border-[#bfd2bf] bg-[#eaf5ec] text-[#315f3b]">
                          Email verified
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-[#6f6552]">
                      {farmer.email || '—'} • {farmer.phone}
                    </p>
                    <p className="text-sm text-[#6f6552]">
                      {[farmer.location?.district, farmer.location?.state]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </p>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 mb-1">
                        <Star className="h-4 w-4 fill-[#d89b2b] text-[#d89b2b]" />
                        <p className="text-sm font-semibold">
                          {farmer.rating != null && farmer.rating > 0
                            ? farmer.rating
                            : '—'}
                        </p>
                      </div>
                      <p className="text-xs text-[#6f6552]">
                        {farmer.reviewCount != null && farmer.reviewCount > 0
                          ? `${farmer.reviewCount} review${farmer.reviewCount === 1 ? '' : 's'}`
                          : 'No reviews'}
                      </p>
                      <p className="text-sm text-[#6f6552]">
                        {farmer.totalSales} delivered order{farmer.totalSales === 1 ? '' : 's'}
                      </p>
                      <p className="text-sm text-[#6f6552]">Farm: {farmer.farmSize}</p>
                    </div>
                    <AdminUserActionsMenu
                      user={{
                        id: farmer.id,
                        role: 'farmer',
                        accountStatus: farmer.accountStatus,
                        emailVerified: farmer.emailVerified,
                        email: farmer.email,
                      }}
                      onPatched={() => vm.setUsersRefreshKey((k) => k + 1)}
                    />
                  </div>
                </div>
              ))}
            </div>
            {!vm.usersSearchActive && (
              <AdminPager
                skip={vm.skipFarmers}
                limit={USERS_PAGE_SIZE}
                total={vm.totalFarmersUsers}
                busy={vm.usersTabLoading}
                onPrev={() =>
                  vm.setSkipFarmers((s) => Math.max(0, s - USERS_PAGE_SIZE))
                }
                onNext={() => vm.setSkipFarmers((s) => s + USERS_PAGE_SIZE)}
              />
            )}
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#8a4f2a]" />
              Buyers (
              {vm.usersSearchActive ? `${vm.usersTabBuyers.length} matched` : `${vm.totalBuyersUsers} total`})
            </h3>
            {vm.usersTabLoading && !vm.usersSearchActive && (
              <div className="mb-3 flex items-center gap-2 text-sm text-[#6f6552]">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                Loading page…
              </div>
            )}
            <div className="space-y-3">
              {vm.usersTabBuyers.map((buyer) => (
                <div
                  key={buyer.id}
                  className="flex flex-col gap-4 rounded-lg border border-[#d7c7a8] bg-[#fffdf7] p-4 transition-all hover:border-[#c8b38b] hover:shadow-[0_16px_40px_rgba(95,70,40,0.12)] sm:flex-row sm:items-center"
                >
                  <img
                    src={resolveBackendAssetUrl(buyer.avatar)}
                    alt={buyer.name}
                    className="h-14 w-14 shrink-0 rounded-full border-2 border-[#d8b0a0] object-cover"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const el = e.currentTarget;
                      el.onerror = null;
                      el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(buyer.name || 'Buyer')}&size=128`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-base">{buyer.name}</p>
                      {vm.getKycBadge(buyer.kycStatus)}
                      {buyer.accountStatus === 'suspended' ? (
                        <Badge className="text-xs bg-[#f6e5dc] text-[#8a4f2a] hover:bg-[#f6e5dc]">
                          Suspended
                        </Badge>
                      ) : null}
                      {buyer.emailVerified ? (
                        <Badge variant="outline" className="text-xs border-[#bfd2bf] bg-[#eaf5ec] text-[#315f3b]">
                          Email verified
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-[#6f6552]">
                      {buyer.businessName} • {buyer.businessType}
                    </p>
                    <p className="text-sm text-[#6f6552]">
                      {[buyer.location?.district, buyer.location?.state]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </p>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{buyer.totalOrders} orders</p>
                    </div>
                    <AdminUserActionsMenu
                      user={{
                        id: buyer.id,
                        role: 'buyer',
                        accountStatus: buyer.accountStatus,
                        emailVerified: buyer.emailVerified,
                        email: buyer.email,
                      }}
                      onPatched={() => vm.setUsersRefreshKey((k) => k + 1)}
                    />
                  </div>
                </div>
              ))}
            </div>
            {!vm.usersSearchActive && (
              <AdminPager
                skip={vm.skipBuyers}
                limit={USERS_PAGE_SIZE}
                total={vm.totalBuyersUsers}
                busy={vm.usersTabLoading}
                onPrev={() =>
                  vm.setSkipBuyers((s) => Math.max(0, s - USERS_PAGE_SIZE))
                }
                onNext={() => vm.setSkipBuyers((s) => s + USERS_PAGE_SIZE)}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  </AnimateOnScroll>
    </div>
  );
}
