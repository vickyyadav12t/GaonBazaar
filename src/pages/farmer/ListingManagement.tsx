import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Filter, Package, TrendingUp } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAppSelector } from '@/hooks/useRedux';
import { mockProducts } from '@/data/mockData';
import { Product, CropCategory } from '@/types';
import { useToast } from '@/hooks/use-toast';

const ListingManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [listings, setListings] = useState(mockProducts.filter(p => p.farmerId === 'farmer-1'));

  const [newProduct, setNewProduct] = useState({
    name: '',
    nameHindi: '',
    category: 'vegetables' as CropCategory,
    description: '',
    price: '',
    unit: 'kg',
    minOrderQuantity: '',
    availableQuantity: '',
    harvestDate: '',
    isOrganic: false,
    isNegotiable: true,
  });

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || listing.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleStatusToggle = (productId: string) => {
    setListings(prev => prev.map(p => {
      if (p.id === productId) {
        const newStatus = p.status === 'active' ? 'hidden' : 'active';
        toast({
          title: newStatus === 'active' 
            ? (currentLanguage === 'en' ? 'Listing Activated' : 'लिस्टिंग सक्रिय')
            : (currentLanguage === 'en' ? 'Listing Hidden' : 'लिस्टिंग छिपाई गई'),
        });
        return { ...p, status: newStatus as 'active' | 'hidden' | 'sold_out' };
      }
      return p;
    }));
  };

  const handleDelete = (productId: string) => {
    setListings(prev => prev.filter(p => p.id !== productId));
    toast({
      title: currentLanguage === 'en' ? 'Listing Deleted' : 'लिस्टिंग हटाई गई',
      variant: 'destructive',
    });
  };

  const handleAddProduct = () => {
    const product: Product = {
      id: `prod-${Date.now()}`,
      farmerId: 'farmer-1',
      farmerName: 'Rajesh Kumar',
      farmerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      farmerRating: 4.8,
      farmerLocation: 'Ludhiana, Punjab',
      name: newProduct.name,
      nameHindi: newProduct.nameHindi,
      category: newProduct.category,
      description: newProduct.description,
      images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600'],
      price: parseFloat(newProduct.price),
      unit: newProduct.unit as 'kg' | 'quintal' | 'ton' | 'piece' | 'dozen',
      minOrderQuantity: parseInt(newProduct.minOrderQuantity),
      availableQuantity: parseInt(newProduct.availableQuantity),
      harvestDate: newProduct.harvestDate,
      isOrganic: newProduct.isOrganic,
      isNegotiable: newProduct.isNegotiable,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      views: 0,
      inquiries: 0,
    };

    setListings(prev => [product, ...prev]);
    setIsAddDialogOpen(false);
    toast({
      title: currentLanguage === 'en' ? 'Listing Added Successfully!' : 'लिस्टिंग सफलतापूर्वक जोड़ी गई!',
    });
    
    // Reset form
    setNewProduct({
      name: '',
      nameHindi: '',
      category: 'vegetables',
      description: '',
      price: '',
      unit: 'kg',
      minOrderQuantity: '',
      availableQuantity: '',
      harvestDate: '',
      isOrganic: false,
      isNegotiable: true,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/10 text-success">{currentLanguage === 'en' ? 'Active' : 'सक्रिय'}</Badge>;
      case 'sold_out':
        return <Badge className="bg-destructive/10 text-destructive">{currentLanguage === 'en' ? 'Sold Out' : 'बिक गया'}</Badge>;
      case 'hidden':
        return <Badge className="bg-muted text-muted-foreground">{currentLanguage === 'en' ? 'Hidden' : 'छिपा हुआ'}</Badge>;
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {currentLanguage === 'en' ? 'My Listings' : 'मेरी लिस्टिंग'}
            </h1>
            <p className="text-muted-foreground">
              {currentLanguage === 'en' ? 'Manage your crop listings' : 'अपनी फसल लिस्टिंग प्रबंधित करें'}
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary-gradient">
                <Plus className="w-5 h-5 mr-2" />
                {currentLanguage === 'en' ? 'Add New Listing' : 'नई लिस्टिंग जोड़ें'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{currentLanguage === 'en' ? 'Add New Listing' : 'नई लिस्टिंग जोड़ें'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Product Name (English)' : 'उत्पाद नाम (अंग्रेज़ी)'}</Label>
                    <Input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="e.g., Fresh Tomatoes"
                    />
                  </div>
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Product Name (Hindi)' : 'उत्पाद नाम (हिंदी)'}</Label>
                    <Input
                      value={newProduct.nameHindi}
                      onChange={(e) => setNewProduct({ ...newProduct, nameHindi: e.target.value })}
                      placeholder="जैसे, ताज़ा टमाटर"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>{currentLanguage === 'en' ? 'Category' : 'श्रेणी'}</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value as CropCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vegetables">{currentLanguage === 'en' ? 'Vegetables' : 'सब्जियां'}</SelectItem>
                      <SelectItem value="fruits">{currentLanguage === 'en' ? 'Fruits' : 'फल'}</SelectItem>
                      <SelectItem value="grains">{currentLanguage === 'en' ? 'Grains' : 'अनाज'}</SelectItem>
                      <SelectItem value="pulses">{currentLanguage === 'en' ? 'Pulses' : 'दालें'}</SelectItem>
                      <SelectItem value="spices">{currentLanguage === 'en' ? 'Spices' : 'मसाले'}</SelectItem>
                      <SelectItem value="dairy">{currentLanguage === 'en' ? 'Dairy' : 'डेयरी'}</SelectItem>
                      <SelectItem value="other">{currentLanguage === 'en' ? 'Other' : 'अन्य'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{currentLanguage === 'en' ? 'Description' : 'विवरण'}</Label>
                  <Textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder={currentLanguage === 'en' ? 'Describe your product...' : 'अपने उत्पाद का वर्णन करें...'}
                    rows={3}
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Price (₹)' : 'कीमत (₹)'}</Label>
                    <Input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="100"
                    />
                  </div>
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Unit' : 'इकाई'}</Label>
                    <Select
                      value={newProduct.unit}
                      onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="quintal">Quintal</SelectItem>
                        <SelectItem value="ton">Ton</SelectItem>
                        <SelectItem value="piece">Piece</SelectItem>
                        <SelectItem value="dozen">Dozen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Min Order' : 'न्यूनतम ऑर्डर'}</Label>
                    <Input
                      type="number"
                      value={newProduct.minOrderQuantity}
                      onChange={(e) => setNewProduct({ ...newProduct, minOrderQuantity: e.target.value })}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Available Quantity' : 'उपलब्ध मात्रा'}</Label>
                    <Input
                      type="number"
                      value={newProduct.availableQuantity}
                      onChange={(e) => setNewProduct({ ...newProduct, availableQuantity: e.target.value })}
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Harvest Date' : 'कटाई की तारीख'}</Label>
                    <Input
                      type="date"
                      value={newProduct.harvestDate}
                      onChange={(e) => setNewProduct({ ...newProduct, harvestDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newProduct.isOrganic}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, isOrganic: checked })}
                    />
                    <Label>{currentLanguage === 'en' ? 'Organic' : 'जैविक'}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newProduct.isNegotiable}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, isNegotiable: checked })}
                    />
                    <Label>{currentLanguage === 'en' ? 'Price Negotiable' : 'कीमत पर बातचीत संभव'}</Label>
                  </div>
                </div>

                <Button onClick={handleAddProduct} className="btn-primary-gradient mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  {currentLanguage === 'en' ? 'Add Listing' : 'लिस्टिंग जोड़ें'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{listings.length}</p>
              <p className="text-sm text-muted-foreground">{currentLanguage === 'en' ? 'Total' : 'कुल'}</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{listings.filter(l => l.status === 'active').length}</p>
              <p className="text-sm text-muted-foreground">{currentLanguage === 'en' ? 'Active' : 'सक्रिय'}</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{listings.reduce((sum, l) => sum + l.views, 0)}</p>
              <p className="text-sm text-muted-foreground">{currentLanguage === 'en' ? 'Views' : 'व्यूज'}</p>
            </div>
          </div>
          <div className="card-elevated p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{listings.reduce((sum, l) => sum + l.inquiries, 0)}</p>
              <p className="text-sm text-muted-foreground">{currentLanguage === 'en' ? 'Inquiries' : 'पूछताछ'}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={currentLanguage === 'en' ? 'Search listings...' : 'लिस्टिंग खोजें...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{currentLanguage === 'en' ? 'All Status' : 'सभी स्थिति'}</SelectItem>
              <SelectItem value="active">{currentLanguage === 'en' ? 'Active' : 'सक्रिय'}</SelectItem>
              <SelectItem value="sold_out">{currentLanguage === 'en' ? 'Sold Out' : 'बिक गया'}</SelectItem>
              <SelectItem value="hidden">{currentLanguage === 'en' ? 'Hidden' : 'छिपा हुआ'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Listings Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredListings.map((listing) => (
            <div key={listing.id} className="card-elevated overflow-hidden">
              <div className="relative">
                <img
                  src={listing.images[0]}
                  alt={listing.name}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute top-2 right-2">
                  {getStatusBadge(listing.status)}
                </div>
                {listing.isOrganic && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-success text-white">
                      {currentLanguage === 'en' ? 'Organic' : 'जैविक'}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-1">{listing.name}</h3>
                <p className="text-lg font-bold text-primary">
                  ₹{listing.price.toLocaleString()}/{listing.unit}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" /> {listing.views}
                  </span>
                  <span>{listing.availableQuantity} {listing.unit} available</span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusToggle(listing.id)}
                    className="flex-1"
                  >
                    {listing.status === 'active' ? (
                      <><EyeOff className="w-4 h-4 mr-1" /> {currentLanguage === 'en' ? 'Hide' : 'छिपाएं'}</>
                    ) : (
                      <><Eye className="w-4 h-4 mr-1" /> {currentLanguage === 'en' ? 'Show' : 'दिखाएं'}</>
                    )}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(listing.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {currentLanguage === 'en' ? 'No listings found' : 'कोई लिस्टिंग नहीं मिली'}
            </h3>
            <p className="text-muted-foreground">
              {currentLanguage === 'en' ? 'Try adjusting your search or filters' : 'अपनी खोज या फ़िल्टर बदलें'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ListingManagement;
