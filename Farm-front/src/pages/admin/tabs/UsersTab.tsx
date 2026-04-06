import { Users, Search, Loader2, Package, Star, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AnimateOnScroll, StaggerContainer } from '@/components/animations';
import { useAdminDashboard } from '../adminDashboardContext';
import { AdminUserActionsMenu, AdminPager, USERS_PAGE_SIZE } from '../adminShared';


export default function AdminUsersTab() {
  const vm = useAdminDashboard();
  return (
    <div className="space-y-6">
  <AnimateOnScroll animation="slide-up">
    <Card className="border-2 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          User Management
        </CardTitle>
        <CardDescription>
          Manage farmers and buyers. Search matches name, phone, or email on the server (updates after you stop typing).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email…"
              value={vm.searchQuery}
              onChange={(e) => vm.setSearchQuery(e.target.value)}
              className="pl-10"
              aria-busy={vm.isUserSearchLoading}
            />
          </div>
        </div>

        {vm.isUserSearchLoading && vm.usersSearchActive && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            Searching users…
          </div>
        )}

        {vm.usersSearchEmpty && (
          <p className="text-sm text-muted-foreground mb-6 py-4 text-center border border-dashed rounded-lg">
            No farmers or buyers match &ldquo;{vm.debouncedUserSearch}&rdquo;. Try another name, phone, or email.
          </p>
        )}

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-success" />
              Farmers (
              {vm.usersSearchActive ? `${vm.usersTabFarmers.length} matched` : `${vm.totalFarmersUsers} total`})
            </h3>
            {vm.usersTabLoading && !vm.usersSearchActive && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                Loading page…
              </div>
            )}
            <div className="space-y-3">
              {vm.usersTabFarmers.map((farmer) => (
                <div
                  key={farmer.id}
                  className="card-elevated p-4 flex flex-col gap-4 sm:flex-row sm:items-center hover:shadow-lg transition-shadow border-2 border-border"
                >
                  <img
                    src={farmer.avatar}
                    alt={farmer.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-success/20 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-base">{farmer.name}</p>
                      {vm.getKycBadge(farmer.kycStatus)}
                      {farmer.accountStatus === 'suspended' ? (
                        <Badge variant="destructive" className="text-xs">
                          Suspended
                        </Badge>
                      ) : null}
                      {farmer.emailVerified ? (
                        <Badge variant="outline" className="text-xs border-success/40 text-success">
                          Email verified
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {farmer.email || '—'} • {farmer.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[farmer.location?.district, farmer.location?.state]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </p>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 mb-1">
                        <Star className="w-4 h-4 text-warning fill-warning" />
                        <p className="text-sm font-semibold">
                          {farmer.rating != null && farmer.rating > 0
                            ? farmer.rating
                            : '—'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {farmer.reviewCount != null && farmer.reviewCount > 0
                          ? `${farmer.reviewCount} review${farmer.reviewCount === 1 ? '' : 's'}`
                          : 'No reviews'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {farmer.totalSales} delivered order{farmer.totalSales === 1 ? '' : 's'}
                      </p>
                      <p className="text-sm text-muted-foreground">Farm: {farmer.farmSize}</p>
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
              <ShoppingCart className="w-5 h-5 text-accent" />
              Buyers (
              {vm.usersSearchActive ? `${vm.usersTabBuyers.length} matched` : `${vm.totalBuyersUsers} total`})
            </h3>
            {vm.usersTabLoading && !vm.usersSearchActive && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                Loading page…
              </div>
            )}
            <div className="space-y-3">
              {vm.usersTabBuyers.map((buyer) => (
                <div
                  key={buyer.id}
                  className="card-elevated p-4 flex flex-col gap-4 sm:flex-row sm:items-center hover:shadow-lg transition-shadow border-2 border-border"
                >
                  <img
                    src={buyer.avatar}
                    alt={buyer.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-accent/20 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-base">{buyer.name}</p>
                      {vm.getKycBadge(buyer.kycStatus)}
                      {buyer.accountStatus === 'suspended' ? (
                        <Badge variant="destructive" className="text-xs">
                          Suspended
                        </Badge>
                      ) : null}
                      {buyer.emailVerified ? (
                        <Badge variant="outline" className="text-xs border-success/40 text-success">
                          Email verified
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {buyer.businessName} • {buyer.businessType}
                    </p>
                    <p className="text-sm text-muted-foreground">
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
