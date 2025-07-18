import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';


interface Customer {
  _id: string;
  name: string;
  credit: number;
}

interface Product {
  _id: string;
  productName: string;
  pricePerKg: number;
  pricePerPack: number;
}

interface ProductDetail {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface AddSaleProps {
  onClose: () => void;
  onSaleAdded?: () => void;
  onSetSortToRecent?: () => void;
  token: string;
}

export default function AddSale({ onClose, onSaleAdded, onSetSortToRecent, token }: AddSaleProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [currentCredit, setCurrentCredit] = useState(0);
  const [saleType, setSaleType] = useState('kg');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState(0);
  const [updatedCredit, setUpdatedCredit] = useState(0);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const BACKEND_URL = process.env.API_BASE_URL || 'https://api.pamacc.dhanushdev.in';

  const getProductPrice = (product: Product, type: string): number => {
    if (type === 'kg') return product.pricePerKg;
    return product.pricePerPack;
  };

  useEffect(() => {
    if (token) {
      axios.get(`${BACKEND_URL}/api/customers`, { 
        headers: { Authorization: token } 
      })
        .then(res => setCustomers(res.data))
        .catch(err => console.error('Error fetching customers:', err));
      
      axios.get(`${BACKEND_URL}/api/products`, { 
        headers: { Authorization: token } 
      })
        .then(res => setProducts(res.data))
        .catch(err => console.error('Error fetching products:', err));
    }
  }, [token]);

  useEffect(() => {
    setProductDetails(prev =>
      prev.map(item => {
        const product = products.find(p => p._id === item.productId);
        return product ? { ...item, price: getProductPrice(product, saleType) } : item;
      })
    );
  }, [saleType]);

  const handleProductChange = (selected: string[]) => {
    setSelectedProducts(selected);
    const details = selected.map(id => {
      const product = products.find(p => p._id === id);
      if (!product) return null;
      return {
        productId: id,
        productName: product.productName,
        quantity: 0,
        price: getProductPrice(product, saleType)
      };
    }).filter((item): item is ProductDetail => item !== null);
    setProductDetails(details);
  };

  const handleQuantityChange = (index: number, value: string) => {
    const updated = [...productDetails];
    updated[index].quantity = parseFloat(value) || 0;
    setProductDetails(updated);
  };

  const handlePriceChange = (index: number, value: string) => {
    const updated = [...productDetails];
    updated[index].price = parseFloat(value) || 0;
    setProductDetails(updated);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) return setError('Please select a customer');
    if (!productDetails.length) return setError('Please select at least one product');
    if (!token) return setError('Authentication token is missing');
    setIsSubmitting(true); setError('');
    try {
      const data = {
        customerId: selectedCustomer._id,
        saleType,
        products: productDetails,
        totalPrice,
        paymentMethod,
        amountReceived,
        updatedCredit,
        date: new Date(saleDate)
      };
      await axios.post(`${BACKEND_URL}/api/sales`, data, { 
        headers: { Authorization: token } 
      });
      alert('Sale added successfully!');
      onClose();
      onSetSortToRecent?.();
      setTimeout(() => onSaleAdded?.(), 100);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to add sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const total = productDetails.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
    setTotalPrice(total);
  }, [productDetails]);

  useEffect(() => {
    const filtered = customers.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase()));
    setFilteredCustomers(filtered);
  }, [customerName, customers]);

  useEffect(() => {
    if (selectedCustomer) {
      setUpdatedCredit(parseFloat(selectedCustomer.credit as any) + (totalPrice - (amountReceived || 0)));
    } else {
      setUpdatedCredit(totalPrice - amountReceived);
    }
  }, [selectedCustomer, totalPrice, amountReceived]);

  return (
    <View className="flex-1 justify-center items-center bg-black/40 absolute inset-0 z-50">
      <View className="bg-white w-11/12 max-w-xl rounded-3xl shadow-lg p-0 overflow-hidden relative max-h-[95vh]">
        {/* Floating Close Button */}
        <Pressable
          onPress={onClose}
          className="absolute top-3 right-3 z-10 bg-gray-100 rounded-full p-2 shadow"
          style={{ elevation: 3 }}
        >
          <MaterialIcons name="close" size={22} color="#64748b" />
        </Pressable>
        {/* Title */}
        <Text className="text-lg font-bold text-blue-700 text-center pt-7 pb-2">Add Sale</Text>
        <ScrollView className="px-6 pb-6 pt-2" style={{ maxHeight: '80vh' }} contentContainerStyle={{ flexGrow: 1 }}>
          <TextInput
            placeholder="Search Customer"
            value={customerName}
            onChangeText={setCustomerName}
            className="mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
            placeholderTextColor="#888"
          />
          {filteredCustomers.length > 0 && (
            <View className="bg-white border border-gray-200 rounded-xl max-h-40 mb-4">
              <ScrollView>
                {filteredCustomers.map(c => (
                  <Pressable
                    key={c._id}
                    onPress={() => { setSelectedCustomer(c); setCustomerName(c.name); setCurrentCredit(Number(c.credit)); }}
                    className="px-4 py-2 rounded-xl hover:bg-blue-50"
                  >
                    <Text>{c.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
          {selectedCustomer && (
            <>
              <Text className="text-sm text-gray-600 mb-2">Current Credit: ₹{currentCredit.toFixed(2)}</Text>
              <Text className="text-sm mb-1">Sale Date</Text>
              <TextInput
                value={saleDate}
                onChangeText={setSaleDate}
                placeholder="YYYY-MM-DD"
                className="mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
                placeholderTextColor="#888"
              />
              <Text className="text-sm mb-1">Sale Type</Text>
              <View className="flex-row mb-4 gap-2">
                <Pressable
                  onPress={() => setSaleType('kg')}
                  className={`px-4 py-2 rounded-full border ${saleType === 'kg' ? 'bg-blue-100 border-blue-400' : 'bg-gray-100 border-gray-200'}`}
                >
                  <Text className={saleType === 'kg' ? 'font-semibold text-blue-700' : 'text-gray-700'}>KG</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSaleType('pack')}
                  className={`px-4 py-2 rounded-full border ${saleType === 'pack' ? 'bg-blue-100 border-blue-400' : 'bg-gray-100 border-gray-200'}`}
                >
                  <Text className={saleType === 'pack' ? 'font-semibold text-blue-700' : 'text-gray-700'}>Pack</Text>
                </Pressable>
              </View>
              <Text className="text-sm mb-1">Products</Text>
              <View className="border border-gray-200 rounded-xl max-h-40 mb-4 bg-gray-50">
                <ScrollView>
                  {products.map(product => (
                    <Pressable
                      key={product._id}
                      onPress={() => {
                        const isSelected = selectedProducts.includes(product._id);
                        if (isSelected) {
                          setSelectedProducts(prev => prev.filter(id => id !== product._id));
                        } else {
                          setSelectedProducts(prev => [...prev, product._id]);
                        }
                      }}
                      className={`px-4 py-2 rounded-xl mb-1 ${selectedProducts.includes(product._id) ? 'bg-blue-100' : ''}`}
                    >
                      <Text className={selectedProducts.includes(product._id) ? 'font-semibold text-blue-700' : 'text-gray-700'}>
                        {product.productName}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              {productDetails.map((item, idx) => (
                <View key={item.productId} className="bg-white rounded-2xl border border-gray-100 p-3 mb-3 shadow-sm">
                  <Text className="font-medium mb-2 text-blue-700">{item.productName}</Text>
                  <View className="flex-row gap-2 mb-2">
                    <TextInput
                      value={item.quantity.toString()}
                      onChangeText={v => handleQuantityChange(idx, v)}
                      placeholder="Quantity"
                      keyboardType="numeric"
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
                      placeholderTextColor="#888"
                    />
                    <TextInput
                      value={item.price.toString()}
                      onChangeText={v => handlePriceChange(idx, v)}
                      placeholder="Price"
                      keyboardType="numeric"
                      className="flex-1 px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
                      placeholderTextColor="#888"
                    />
                  </View>
                </View>
              ))}
              <Text className="font-semibold text-lg text-center mb-2">Total Price: ₹{totalPrice.toFixed(2)}</Text>
              <TextInput
                value={amountReceived.toString()}
                onChangeText={v => setAmountReceived(parseFloat(v) || 0)}
                placeholder="Amount Received"
                keyboardType="numeric"
                className="mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-black text-base"
                placeholderTextColor="#888"
              />
              <Text className="text-sm text-gray-600 mb-2 text-center">Updated Credit: ₹{updatedCredit.toFixed(2)}</Text>
              <Text className="text-sm mb-1">Payment Method</Text>
              <View className="flex-row gap-2 mb-4">
                <Pressable
                  onPress={() => setPaymentMethod('cash')}
                  className={`flex-1 px-4 py-2 rounded-full border ${paymentMethod === 'cash' ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-200'}`}
                >
                  <Text className={paymentMethod === 'cash' ? 'font-semibold text-green-700' : 'text-gray-700'}>Cash</Text>
                </Pressable>
                <Pressable
                  onPress={() => setPaymentMethod('online')}
                  className={`flex-1 px-4 py-2 rounded-full border ${paymentMethod === 'online' ? 'bg-green-100 border-green-400' : 'bg-gray-100 border-gray-200'}`}
                >
                  <Text className={paymentMethod === 'online' ? 'font-semibold text-green-700' : 'text-gray-700'}>Online</Text>
                </Pressable>
              </View>
              {error ? <Text className="text-red-500 mb-2 text-center">{error}</Text> : null}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-blue-600 py-3 rounded-xl mt-2 active:scale-95 shadow-sm"
              >
                <Text className="text-white text-center font-semibold text-base">
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
