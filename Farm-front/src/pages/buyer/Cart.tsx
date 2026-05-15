import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CreditCard, Truck, Shield } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { removeFromCart, updateQuantity, clearCart } from '@/store/slices/cartSlice';
import { useToast } from '@/hooks/use-toast';
import { optimizeListingImageUrl } from '@/lib/productImageUrl';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { items, totalAmount } = useAppSelector((state) => state.cart);
  const { currentLanguage } = useAppSelector((state) => state.language);
  const [couponCode, setCouponCode] = useState('');

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity > 0) {
      dispatch(updateQuantity({ productId, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (productId: string) => {
    dispatch(removeFromCart(productId));
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-[linear-gradient(rgba(251,247,235,0.96),rgba(251,247,235,0.96)),linear-gradient(rgba(138,79,42,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(138,79,42,0.08)_1px,transparent_1px)] bg-[size:auto,26px_26px,26px_26px]">
          <div className="container mx-auto min-w-0 px-3 py-10 sm:px-4 sm:py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-[#d7c7a8] bg-[#fffaf0] shadow-[0_14px_30px_rgba(90,60,35,0.08)]">
              <ShoppingBag className="h-12 w-12 text-[#315f3b]" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-[#2f3a2f]">
              {currentLanguage === 'en' ? 'Your cart is empty' : 'आपकी कार्ट खाली है'}
            </h2>
            <p className="mb-6 text-[#6f6552]">
              {currentLanguage === 'en' 
                ? 'Looks like you haven\'t added any products yet.' 
                : 'लगता है आपने अभी तक कोई उत्पाद नहीं जोड़ा है।'}
            </p>
            <Link to="/marketplace">
              <Button className="border border-[#b68222] bg-[#d89b2b] text-[#2f2416] shadow-[0_10px_24px_rgba(216,155,43,0.22)] transition hover:bg-[#c88d22]">
                {currentLanguage === 'en' ? 'Browse Marketplace' : 'मार्केटप्लेस देखें'}
              </Button>
            </Link>
          </div>
        </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[linear-gradient(rgba(251,247,235,0.97),rgba(251,247,235,0.97)),linear-gradient(rgba(138,79,42,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(138,79,42,0.07)_1px,transparent_1px)] bg-[size:auto,24px_24px,24px_24px]">
        <div className="container mx-auto min-w-0 px-3 py-5 sm:px-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-[#d7c7a8] bg-[#fffaf0] p-2 text-[#315f3b] transition hover:bg-[#f6eddc]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#2f3a2f]">
              {currentLanguage === 'en' ? 'Shopping Cart' : 'शॉपिंग कार्ट'}
            </h1>
            <p className="text-sm text-[#6f6552]">
              {items.length} {currentLanguage === 'en' ? 'items' : 'आइटम'}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-4 shadow-[0_16px_40px_rgba(95,70,40,0.08)]"
              >
                <div className="flex gap-4">
                  <img
                    src={optimizeListingImageUrl(item.product.images[0], 240)}
                    alt={item.product.name}
                    className="h-24 w-24 rounded-xl border border-[#e2d4b7] object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-[#2f3a2f]">{item.product.name}</h3>
                        <p className="text-sm text-[#6f6552]">
                          {currentLanguage === 'en' ? 'by' : 'द्वारा'} {item.product.farmerName}
                        </p>
                        <p className="text-sm text-[#6f6552]">{item.product.farmerLocation}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="rounded-lg p-2 text-[#8a4f2a] transition hover:bg-[#f4e1d4]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] transition hover:bg-[#f3ebdd]"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium text-[#2f3a2f]">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] transition hover:bg-[#f3ebdd]"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-[#6f6552]">{item.product.unit}</span>
                      </div>
                      <div className="text-right">
                        {item.negotiatedPrice && item.negotiatedPrice < item.product.price && (
                          <p className="text-xs text-[#8b816f] line-through">
                            ₹{item.product.price.toLocaleString()}
                          </p>
                        )}
                        <p className="font-bold text-[#315f3b]">
                          ₹{((item.negotiatedPrice || item.product.price) * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => dispatch(clearCart())}
              className="text-sm font-medium text-[#8a4f2a] hover:underline"
            >
              {currentLanguage === 'en' ? 'Clear Cart' : 'कार्ट खाली करें'}
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-6 shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <h2 className="mb-4 text-lg font-semibold text-[#2f3a2f]">
                {currentLanguage === 'en' ? 'Order Summary' : 'ऑर्डर सारांश'}
              </h2>

              {/* Coupon */}
              <div className="flex gap-2 mb-4">
                <Input
                  className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] placeholder:text-[#8b816f] focus-visible:ring-[#315f3b]"
                  placeholder={currentLanguage === 'en' ? 'Coupon code' : 'कूपन कोड'}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                  onClick={() =>
                    toast({
                      title: currentLanguage === 'en' ? 'Coupons' : 'कूपन',
                      description:
                        currentLanguage === 'en'
                          ? 'Coupon codes are not available yet.'
                          : 'कूपन कोड अभी उपलब्ध नहीं हैं।',
                    })
                  }
                >
                  {currentLanguage === 'en' ? 'Apply' : 'लागू करें'}
                </Button>
              </div>

              <div className="space-y-3 border-t border-[#e2d4b7] pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6f6552]">
                    {currentLanguage === 'en' ? 'Subtotal' : 'उप-योग'}
                  </span>
                  <span className="text-[#2f3a2f]">₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6f6552]">
                    {currentLanguage === 'en' ? 'Delivery' : 'डिलीवरी'}
                  </span>
                  <span className="text-[#315f3b]">
                    {currentLanguage === 'en' ? 'Free' : 'मुफ्त'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6f6552]">
                    {currentLanguage === 'en' ? 'Platform Fee' : 'प्लेटफॉर्म शुल्क'}
                  </span>
                  <span className="text-[#2f3a2f]">₹{Math.round(totalAmount * 0.02).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-[#e2d4b7] pt-3 text-lg font-bold">
                  <span className="text-[#2f3a2f]">{currentLanguage === 'en' ? 'Total' : 'कुल'}</span>
                  <span className="text-[#315f3b]">
                    ₹{(totalAmount + Math.round(totalAmount * 0.02)).toLocaleString()}
                  </span>
                </div>
              </div>

              <Link to="/buyer/checkout">
                <Button className="mt-6 w-full border border-[#b68222] bg-[#d89b2b] text-[#2f2416] shadow-[0_10px_24px_rgba(216,155,43,0.2)] transition hover:bg-[#c88d22]">
                  <CreditCard className="w-4 h-4 mr-2" />
                  {currentLanguage === 'en' ? 'Proceed to Checkout' : 'चेकआउट करें'}
                </Button>
              </Link>

              {/* Trust Badges */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-[#6f6552]">
                  <Shield className="w-4 h-4 text-[#315f3b]" />
                  <span>{currentLanguage === 'en' ? 'Secure Payment' : 'सुरक्षित भुगतान'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-[#6f6552]">
                  <Truck className="w-4 h-4 text-[#315f3b]" />
                  <span>{currentLanguage === 'en' ? 'Free Delivery' : 'मुफ्त डिलीवरी'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default Cart;
