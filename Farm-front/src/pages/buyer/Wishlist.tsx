import Layout from '@/components/layout/Layout';
import ProductCard from '@/components/product/ProductCard';
import { useAppSelector } from '@/hooks/useRedux';

const Wishlist = () => {
  const { currentLanguage } = useAppSelector((s) => s.language);
  const items = useAppSelector((s) => s.wishlist.items);

  return (
    <Layout>
      <div className="min-h-screen bg-[linear-gradient(rgba(251,247,235,0.97),rgba(251,247,235,0.97)),linear-gradient(rgba(138,79,42,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(138,79,42,0.07)_1px,transparent_1px)] bg-[size:auto,24px_24px,24px_24px]">
        <div className="container mx-auto min-w-0 px-3 py-5 sm:px-4 sm:py-6">
        <div className="mb-6">
          <h1 className={`text-2xl font-bold text-[#2f3a2f] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
            {currentLanguage === 'en' ? 'Wishlist' : 'इच्छा-सूची'}
          </h1>
          <p className={`text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
            {currentLanguage === 'en'
              ? 'Products you saved for later.'
              : 'आपके द्वारा बाद के लिए सहेजे गए उत्पाद।'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-8 text-center shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
            <p className={`text-lg font-semibold text-[#2f3a2f] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
              {currentLanguage === 'en' ? 'Your wishlist is empty' : 'आपकी इच्छा-सूची खाली है'}
            </p>
            <p className={`mt-2 text-sm text-[#6f6552] ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
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
      </div>
    </Layout>
  );
};

export default Wishlist;

