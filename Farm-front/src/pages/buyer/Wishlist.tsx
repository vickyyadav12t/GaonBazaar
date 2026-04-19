import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/product/ProductCard';
import { useAppSelector } from '@/hooks/useRedux';

const Wishlist = () => {
  const { currentLanguage } = useAppSelector((s) => s.language);
  const items = useAppSelector((s) => s.wishlist.items);

  return (
    <Layout>
      <div className="container mx-auto min-w-0 px-3 py-5 sm:px-4 sm:py-6">
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
            {currentLanguage === 'en' ? 'Wishlist' : 'इच्छा-सूची'}
          </h1>
          <p className={`text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
            {currentLanguage === 'en'
              ? 'Products you saved for later.'
              : 'आपके द्वारा बाद के लिए सहेजे गए उत्पाद।'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="card-elevated p-8 text-center">
            <p className={`text-lg font-semibold ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
              {currentLanguage === 'en' ? 'Your wishlist is empty' : 'आपकी इच्छा-सूची खाली है'}
            </p>
            <p className={`text-sm text-muted-foreground mt-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
              {currentLanguage === 'en'
                ? 'Tap the heart on a product to save it here.'
                : 'किसी उत्पाद पर दिल (❤️) दबाकर उसे यहाँ सहेजें।'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Wishlist;

