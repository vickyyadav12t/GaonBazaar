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
    <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
      <CardHeader className="border-b border-[#e2d4b7] bg-[#f6eddc]">
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5 text-[#315f3b]" />
          Product Listings
        </CardTitle>
        <CardDescription className="text-[#6f6552]">Manage all product vm.listings on the platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b816f]" />
            <Input
              placeholder="Search vm.listings…"
              className="border-[#d7c7a8] bg-[#fffdf7] pl-10 text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
              value={vm.listingSearch}
              onChange={(e) => vm.setListingSearch(e.target.value)}
            />
          </div>
        </div>

        {vm.listingsLoading && (
          <div className="mb-4 flex items-center gap-2 text-sm text-[#6f6552]">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            Loading vm.listings…
          </div>
        )}

        <StaggerContainer staggerDelay={0.05} animation="slide-up" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vm.listings.map((listing) => (
            <Card
              key={listing.id}
              className="overflow-hidden border-[#d7c7a8] bg-[#fffdf7] transition-all hover:border-[#c8b38b] hover:shadow-[0_16px_40px_rgba(95,70,40,0.12)]"
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
                      ? 'bg-[#315f3b] text-[#fffaf0]'
                      : 'bg-[#f3ebdd] text-[#6c5a3d]'
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
                    <p className="text-sm text-[#6f6552]">by {listing.farmerName}</p>
                  </div>
                  <p className="mb-3 text-lg font-bold text-[#315f3b]">
                    ₹{listing.price}/{listing.unit}
                  </p>
                </button>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="min-w-[7rem] flex-1 bg-[#f3ebdd] text-[#315f3b] hover:bg-[#eadfc9]"
                    onClick={() => vm.openListingDrawer(listing)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                  {listing.status === 'hidden' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-[#d7c7a8] bg-[#fffaf0] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                      onClick={() => handleListingAction(listing.id, 'activate')}
                    >
                      Activate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-[#d7c7a8] bg-[#fffaf0] text-[#8a4f2a] hover:bg-[#f6e5dc] hover:text-[#8a4f2a]"
                      onClick={() => handleListingAction(listing.id, 'suspend')}
                    >
                      Suspend
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="bg-[#8a4f2a] text-[#fffaf0] hover:bg-[#784223]"
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
          <p className="rounded-lg border border-dashed border-[#d7c7a8] py-8 text-center text-sm text-[#6f6552]">
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
