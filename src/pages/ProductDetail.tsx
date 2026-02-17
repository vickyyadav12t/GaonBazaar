import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, CheckCircle, MessageCircle, ShoppingCart, Share2, Heart, ChevronLeft, ChevronRight, Leaf } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockProducts } from '@/data/mockData';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { addToCart, clearCart } from '@/store/slices/cartSlice';
import { toast } from '@/hooks/use-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const product = mockProducts.find((p) => p.id === id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(product?.minOrderQuantity || 1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Link to="/marketplace" className="text-primary mt-4 inline-block">
            Back to Marketplace
          </Link>
        </div>
      </Layout>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Please Login',
        description: 'You need to login to add items to cart.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    dispatch(addToCart({ product, quantity }));
    toast({
      title: 'Added to Cart',
      description: `${quantity} ${product.unit} of ${product.name} added to your cart.`,
    });
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Please Login',
        description: 'You need to login to buy products.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    // Check if user is a buyer
    if (user?.role !== 'buyer') {
      toast({
        title: 'Access Denied',
        description: 'Only buyers can purchase products.',
        variant: 'destructive',
      });
      return;
    }

    // Clear cart and add only this item for "Buy Now"
    dispatch(clearCart());
    dispatch(addToCart({ product, quantity }));
    
    // Navigate to checkout
    navigate('/buyer/checkout');
  };

  const handleNegotiate = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Please Login',
        description: 'You need to login to start negotiation.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    // Check if user is a buyer
    if (user?.role !== 'buyer') {
      toast({
        title: 'Access Denied',
        description: 'Only buyers can negotiate prices.',
        variant: 'destructive',
      });
      return;
    }

    // Check if product is negotiable
    if (!product.isNegotiable) {
      toast({
        title: 'Price Not Negotiable',
        description: 'This product does not support price negotiation.',
        variant: 'destructive',
      });
      return;
    }

    navigate(`/chat/new?product=${product.id}`);
  };

  const content = {
    en: {
      back: 'Back',
      perUnit: 'per',
      minOrder: 'Min. Order',
      available: 'Available',
      harvested: 'Harvested on',
      negotiable: 'Price Negotiable',
      organic: 'Organic',
      quantity: 'Quantity',
      addToCart: 'Add to Cart',
      negotiate: 'Negotiate Price',
      buyNow: 'Buy Now',
      aboutFarmer: 'About the Farmer',
      verified: 'Verified Farmer',
      sales: 'Successful Sales',
      rating: 'Rating',
      description: 'Description',
      viewMore: 'View More from this Farmer',
    },
    hi: {
      back: 'वापस',
      perUnit: 'प्रति',
      minOrder: 'न्यूनतम ऑर्डर',
      available: 'उपलब्ध',
      harvested: 'कटाई की तारीख',
      negotiable: 'मूल्य वार्ता योग्य',
      organic: 'जैविक',
      quantity: 'मात्रा',
      addToCart: 'कार्ट में डालें',
      negotiate: 'मूल्य वार्ता करें',
      buyNow: 'अभी खरीदें',
      aboutFarmer: 'किसान के बारे में',
      verified: 'सत्यापित किसान',
      sales: 'सफल बिक्री',
      rating: 'रेटिंग',
      description: 'विवरण',
      viewMore: 'इस किसान से और देखें',
    },
  };

  const t = content[currentLanguage];

  const relatedProducts = mockProducts.filter(
    (p) => p.farmerId === product.farmerId && p.id !== product.id
  ).slice(0, 3);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className={currentLanguage === 'hi' ? 'font-hindi' : ''}>{t.back}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted mb-4">
              <img
                src={product.images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {/* Image Navigation */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isOrganic && (
                  <Badge className="bg-success text-success-foreground">
                    <Leaf className="w-3 h-3 mr-1" /> {t.organic}
                  </Badge>
                )}
                {product.isNegotiable && (
                  <Badge variant="secondary">
                    💬 {t.negotiable}
                  </Badge>
                )}
              </div>

              {/* Wishlist & Share */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isWishlisted ? 'bg-destructive text-destructive-foreground' : 'bg-background/80 backdrop-blur-sm'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                <button className="w-10 h-10 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${
                      currentImageIndex === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                {product.category}
              </p>
              <h1 className={`text-3xl font-bold text-foreground mb-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {currentLanguage === 'hi' && product.nameHindi ? product.nameHindi : product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold text-primary">{formatPrice(product.price)}</span>
              <span className="text-lg text-muted-foreground">
                {t.perUnit} {product.unit}
              </span>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-muted/50 rounded-xl p-4">
                <p className={`text-sm text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                  {t.minOrder}
                </p>
                <p className="font-semibold">{product.minOrderQuantity} {product.unit}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className={`text-sm text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                  {t.available}
                </p>
                <p className="font-semibold">{product.availableQuantity} {product.unit}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 col-span-2">
                <p className={`text-sm text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                  {t.harvested}
                </p>
                <p className="font-semibold">
                  {new Date(product.harvestDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className={`text-sm font-medium mb-2 block ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.quantity} ({product.unit})
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(product.minOrderQuantity, quantity - 1))}
                  className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-xl font-bold hover:bg-muted/80 transition-colors"
                >
                  -
                </button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(product.minOrderQuantity, parseInt(e.target.value) || 0))}
                  className="w-24 text-center text-lg font-semibold"
                />
                <button
                  onClick={() => setQuantity(Math.min(product.availableQuantity, quantity + 1))}
                  className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-xl font-bold hover:bg-muted/80 transition-colors"
                >
                  +
                </button>
                <div className="flex-1 text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-foreground">
                    {formatPrice(product.price * quantity)}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mb-8">
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className="flex-1 py-6 text-lg"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {t.addToCart}
                </Button>
                {product.isNegotiable && (
                  <Button
                    onClick={handleNegotiate}
                    variant="secondary"
                    className="flex-1 py-6 text-lg"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {t.negotiate}
                  </Button>
                )}
              </div>
              <Button onClick={handleBuyNow} className="w-full py-6 text-lg btn-primary-gradient">
                {t.buyNow}
              </Button>
            </div>

            {/* Farmer Card */}
            <div className="card-elevated p-4 mb-6">
              <h3 className={`font-semibold mb-3 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.aboutFarmer}
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                  {product.farmerAvatar ? (
                    <img src={product.farmerAvatar} alt={product.farmerName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold">
                      {product.farmerName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    {product.farmerName}
                    <span className="verified-badge">
                      <CheckCircle className="w-3 h-3" />
                      {t.verified}
                    </span>
                  </h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {product.farmerLocation}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
                <div>
                  <p className="text-sm text-muted-foreground">{t.rating}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-secondary fill-secondary" />
                    <span className="font-semibold">{product.farmerRating}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.sales}</p>
                  <p className="font-semibold">150+</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className={`font-semibold mb-3 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.description}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className={`text-xl font-bold mb-6 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
              {t.viewMore}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((p) => (
                <Link key={p.id} to={`/product/${p.id}`} className="card-product">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{p.name}</h3>
                    <p className="text-primary font-bold">
                      {formatPrice(p.price)}/{p.unit}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
