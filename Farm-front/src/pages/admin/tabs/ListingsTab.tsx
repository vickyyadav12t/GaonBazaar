import { Package, Search, Loader2, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AnimateOnScroll, StaggerContainer } from '@/components/animations';
import ProductCard from '@/components/product/ProductCard';
import { useAdminDashboard } from '../adminDashboardContext';
import { AdminPager, LISTINGS_PAGE_SIZE } from '../adminShared';
import {
  LISTING_IMAGE_PLACEHOLDER,
  listingHeroImageUrlFromList,
} from '@/lib/productImageUrl';


export default function AdminListingsTab() {
  const vm = useAdminDashboard();
  return (
    <div className="space-y-6">
  <AnimateOnScroll animation="slide-up">
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Product Listings
        </CardTitle>
        <CardDescription>Manage all product vm.listings on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search vm.listings…"
              className="pl-10"
              value={vm.listingSearch}
              onChange={(e) => vm.setListingSearch(e.target.value)}
            />
          </div>
        </div>

        {vm.listingsLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Loading vm.listings…
          </div>
        )}

        <StaggerContainer staggerDelay={0.05} animation="slide-up" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vm.listings.map((listing) => (
            <Card
              key={listing.id}
              className="overflow-hidden border-2 border-border hover:shadow-xl transition-shadow"
            >
              <button
                type="button"
                className="relative w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => vm.openListingDrawer(listing)}
              >
                <img
                  src={listingHeroImageUrlFromList(listing.images, 640)}
                  alt={listing.name}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.onerror = null;
                    el.src = LISTING_IMAGE_PLACEHOLDER;
                  }}
                />
                <Badge
                  className={`absolute top-2 right-2 ${
                    listing.status === 'active'
                      ? 'bg-success/90 text-success-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {listing.status}
                </Badge>
              </button>
              <CardContent className="p-4">
                <button
                  type="button"
                  className="w-full text-left rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => vm.openListingDrawer(listing)}
                >
                  <div className="mb-2">
                    <h4 className="font-semibold text-lg mb-1">{listing.name}</h4>
                    <p className="text-sm text-muted-foreground">by {listing.farmerName}</p>
                  </div>
                  <p className="font-bold text-primary text-lg mb-3">
                    ₹{listing.price}/{listing.unit}
                  </p>
                </button>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 min-w-[7rem]"
                    onClick={() => vm.openListingDrawer(listing)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                  {listing.status === 'hidden' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleListingAction(listing.id, 'activate')}
                    >
                      Activate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleListingAction(listing.id, 'suspend')}
                    >
                      Suspend
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleListingAction(listing.id, 'remove')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </StaggerContainer>

        {!vm.listingsLoading && vm.listings.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg">
            No vm.listings match this page or search.
          </p>
        )}

        <AdminPager
          skip={vm.listingsSkip}
          limit={LISTINGS_PAGE_SIZE}
          total={vm.listingsTotalCount}
          busy={vm.listingsLoading}
          onPrev={() =>
            setListingsSkip((s) => Math.max(0, s - LISTINGS_PAGE_SIZE))
          }
          onNext={() => setListingsSkip((s) => s + LISTINGS_PAGE_SIZE)}
        />
      </CardContent>
    </Card>
  </AnimateOnScroll>
    </div>
  );
}
