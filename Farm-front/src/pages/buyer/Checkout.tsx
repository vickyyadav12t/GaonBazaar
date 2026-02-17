import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, Building, Truck, MapPin, Check, Shield } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { clearCart } from '@/store/slices/cartSlice';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { items, totalAmount } = useAppSelector((state) => state.cart);
  const { currentLanguage } = useAppSelector((state) => state.language);

  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const isFormValid =
    formData.name.trim().length > 0 &&
    formData.phone.trim().length >= 10 &&
    formData.address.trim().length > 0 &&
    formData.city.trim().length > 0 &&
    formData.state.trim().length > 0 &&
    formData.pincode.trim().length >= 4;

  const platformFee = Math.round(totalAmount * 0.02);
  const grandTotal = totalAmount + platformFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePayment = async () => {
    if (!isFormValid) {
      toast({
        title: currentLanguage === 'en' ? 'Missing or invalid details' : 'जानकारी अधूरी या अमान्य है',
        description:
          currentLanguage === 'en'
            ? 'Please fill in all address fields correctly before continuing.'
            : 'कृपया सभी पता फ़ील्ड सही से भरें, फिर आगे बढ़ें।',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);

      const shippingAddress = `${formData.name}, ${formData.phone}, ${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`;

      const orderItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const response = await apiService.orders.create({
        items: orderItems,
        shippingAddress,
      });

      if (!response.data?.order) {
        throw new Error('Order was not created');
      }

      setShowSuccess(true);

      setTimeout(() => {
        dispatch(clearCart());
        navigate('/buyer/orders');
      }, 3000);
    } catch (error: any) {
      console.error('Checkout error', error);
      toast({
        title: currentLanguage === 'en' ? 'Payment failed' : 'भुगतान विफल',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Could not place your order. Please try again.'
            : 'आपका ऑर्डर नहीं हो सका। कृपया पुनः प्रयास करें।'),
        variant: 'destructive',
      });
      setIsProcessing(false);
    }
  };

  if (showSuccess) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <Check className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-success">
              {currentLanguage === 'en' ? 'Payment Successful!' : 'भुगतान सफल!'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {currentLanguage === 'en' 
                ? 'Your order has been placed successfully. You will receive a confirmation shortly.' 
                : 'आपका ऑर्डर सफलतापूर्वक दे दिया गया है। आपको जल्द ही पुष्टि मिलेगी।'}
            </p>
            <div className="card-elevated p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">
                {currentLanguage === 'en' ? 'Order ID' : 'ऑर्डर आईडी'}
              </p>
              <p className="font-mono font-bold">#ORD-{Date.now().toString().slice(-8)}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentLanguage === 'en' ? 'Redirecting to orders...' : 'ऑर्डर पर रीडायरेक्ट हो रहा है...'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    navigate('/buyer/cart');
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">
            {currentLanguage === 'en' ? 'Checkout' : 'चेकआउट'}
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {currentLanguage === 'en' ? 'Delivery Address' : 'डिलीवरी पता'}
              </h2>
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">{currentLanguage === 'en' ? 'Full Name' : 'पूरा नाम'}</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder={currentLanguage === 'en' ? 'Enter full name' : 'पूरा नाम दर्ज करें'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">{currentLanguage === 'en' ? 'Phone Number' : 'फोन नंबर'}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">{currentLanguage === 'en' ? 'Address' : 'पता'}</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={currentLanguage === 'en' ? 'Street address, building, etc.' : 'सड़क का पता, इमारत, आदि।'}
                    rows={2}
                  />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">{currentLanguage === 'en' ? 'City' : 'शहर'}</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">{currentLanguage === 'en' ? 'State' : 'राज्य'}</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">{currentLanguage === 'en' ? 'PIN Code' : 'पिन कोड'}</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card-elevated p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                {currentLanguage === 'en' ? 'Payment Method' : 'भुगतान विधि'}
              </h2>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-3">
                  <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <RadioGroupItem value="razorpay" />
                    <div className="w-10 h-10 bg-[#3395FF]/10 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-[#3395FF]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Razorpay</p>
                      <p className="text-sm text-muted-foreground">UPI, Cards, Net Banking</p>
                    </div>
                    <img src="https://razorpay.com/assets/razorpay-logo.svg" alt="Razorpay" className="h-6" />
                  </label>

                  <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'bank' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <RadioGroupItem value="bank" />
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{currentLanguage === 'en' ? 'Bank Transfer' : 'बैंक ट्रांसफर'}</p>
                      <p className="text-sm text-muted-foreground">
                        {currentLanguage === 'en' ? 'Direct bank transfer' : 'सीधा बैंक ट्रांसफर'}
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                    <RadioGroupItem value="cod" />
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Truck className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{currentLanguage === 'en' ? 'Cash on Delivery' : 'कैश ऑन डिलीवरी'}</p>
                      <p className="text-sm text-muted-foreground">
                        {currentLanguage === 'en' ? 'Pay when you receive' : 'मिलने पर भुगतान करें'}
                      </p>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card-elevated p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">
                {currentLanguage === 'en' ? 'Order Summary' : 'ऑर्डर सारांश'}
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} {item.product.unit} × ₹{(item.negotiatedPrice || item.product.price).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      ₹{((item.negotiatedPrice || item.product.price) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{currentLanguage === 'en' ? 'Subtotal' : 'उप-योग'}</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{currentLanguage === 'en' ? 'Delivery' : 'डिलीवरी'}</span>
                  <span className="text-success">{currentLanguage === 'en' ? 'Free' : 'मुफ्त'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{currentLanguage === 'en' ? 'Platform Fee' : 'प्लेटफॉर्म शुल्क'}</span>
                  <span>₹{platformFee.toLocaleString()}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                  <span>{currentLanguage === 'en' ? 'Total' : 'कुल'}</span>
                  <span className="text-primary">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={isProcessing || !isFormValid}
                className="w-full btn-primary-gradient mt-6"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {currentLanguage === 'en' ? 'Processing...' : 'प्रोसेसिंग...'}
                  </span>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    {currentLanguage === 'en' ? `Pay ₹${grandTotal.toLocaleString()}` : `₹${grandTotal.toLocaleString()} भुगतान करें`}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                {currentLanguage === 'en' 
                  ? 'Your payment is secured with 256-bit encryption' 
                  : 'आपका भुगतान 256-बिट एन्क्रिप्शन से सुरक्षित है'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout;
