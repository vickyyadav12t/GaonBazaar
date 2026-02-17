import { Link } from 'react-router-dom';
import { Star, MapPin, CheckCircle, Eye } from 'lucide-react';
import { Product } from '@/types';
import { Badge } from '@/components/ui/badge';
import { useAppSelector } from '@/hooks/useRedux';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { currentLanguage } = useAppSelector((state) => state.language);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link to={`/product/${product.id}`}>
      <div className="card-product group animate-fade-in hover:scale-[1.02] transition-all duration-300 hover:shadow-lg">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 animate-slide-in-left">
            {product.isOrganic && (
              <Badge className="bg-success text-success-foreground animate-bounce-in" style={{ animationDelay: '0.1s' }}>
                🌿 Organic
              </Badge>
            )}
            {product.isNegotiable && (
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground animate-bounce-in" style={{ animationDelay: '0.2s' }}>
                💬 Negotiable
              </Badge>
            )}
          </div>
          {/* Views */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-foreground/70 text-background text-xs px-2 py-1 rounded-full">
            <Eye className="w-3 h-3" />
            {product.views}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category */}
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {product.category}
          </p>

          {/* Name */}
          <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-1">
            {currentLanguage === 'hi' && product.nameHindi ? product.nameHindi : product.name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-1 mb-3">
            <span className="price-tag">{formatPrice(product.price)}</span>
            <span className="text-sm text-muted-foreground">/{product.unit}</span>
          </div>

          {/* Farmer Info */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                {product.farmerAvatar ? (
                  <img src={product.farmerAvatar} alt={product.farmerName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-medium">
                    {product.farmerName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                  {product.farmerName}
                  <CheckCircle className="w-3.5 h-3.5 text-primary fill-primary/20" />
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {product.farmerLocation}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-secondary">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">{product.farmerRating}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
