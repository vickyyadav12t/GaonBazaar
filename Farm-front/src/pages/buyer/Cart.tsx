import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CreditCard, Truck, Shield } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { removeFromCart, updateQuantity, clearCart } from '@/store/slices/cartSlice';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {currentLanguage === 'en' ? 'Your cart is empty' : 'आपकी कार्ट खाली है'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {currentLanguage === 'en' 
                ? 'Looks like you haven\'t added any products yet.' 
                : 'लगता है आपने अभी तक कोई उत्पाद नहीं जोड़ा है।'}
            </p>
            <Link to="/marketplace">
              <Button className="btn-primary-gradient">
                {currentLanguage === 'en' ? 'Browse Marketplace' : 'मार्केटप्लेस देखें'}
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {currentLanguage === 'en' ? 'Shopping Cart' : 'शॉपिंग कार्ट'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {items.length} {currentLanguage === 'en' ? 'items' : 'आइटम'}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="card-elevated p-4">
                <div className="flex gap-4">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {currentLanguage === 'en' ? 'by' : 'द्वारा'} {item.product.farmerName}
                        </p>
                        <p className="text-sm text-muted-foreground">{item.product.farmerLocation}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium w-12 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-muted-foreground">{item.product.unit}</span>
                      </div>
                      <div className="text-right">
                        {item.negotiatedPrice && item.negotiatedPrice < item.product.price && (
                          <p className="text-xs text-muted-foreground line-through">
                            ₹{item.product.price.toLocaleString()}
                          </p>
                        )}
                        <p className="font-bold text-primary">
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
              className="text-destructive text-sm font-medium hover:underline"
            >
              {currentLanguage === 'en' ? 'Clear Cart' : 'कार्ट खाली करें'}
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card-elevated p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">
                {currentLanguage === 'en' ? 'Order Summary' : 'ऑर्डर सारांश'}
              </h2>

              {/* Coupon */}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder={currentLanguage === 'en' ? 'Coupon code' : 'कूपन कोड'}
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <Button variant="outline">
                  {currentLanguage === 'en' ? 'Apply' : 'लागू करें'}
                </Button>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {currentLanguage === 'en' ? 'Subtotal' : 'उप-योग'}
                  </span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {currentLanguage === 'en' ? 'Delivery' : 'डिलीवरी'}
                  </span>
                  <span className="text-success">
                    {currentLanguage === 'en' ? 'Free' : 'मुफ्त'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {currentLanguage === 'en' ? 'Platform Fee' : 'प्लेटफॉर्म शुल्क'}
                  </span>
                  <span>₹{Math.round(totalAmount * 0.02).toLocaleString()}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                  <span>{currentLanguage === 'en' ? 'Total' : 'कुल'}</span>
                  <span className="text-primary">
                    ₹{(totalAmount + Math.round(totalAmount * 0.02)).toLocaleString()}
                  </span>
                </div>
              </div>

              <Link to="/buyer/checkout">
                <Button className="w-full btn-primary-gradient mt-6">
                  <CreditCard className="w-4 h-4 mr-2" />
                  {currentLanguage === 'en' ? 'Proceed to Checkout' : 'चेकआउट करें'}
                </Button>
              </Link>

              {/* Trust Badges */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-success" />
                  <span>{currentLanguage === 'en' ? 'Secure Payment' : 'सुरक्षित भुगतान'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Truck className="w-4 h-4 text-success" />
                  <span>{currentLanguage === 'en' ? 'Free Delivery' : 'मुफ्त डिलीवरी'}</span>
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
