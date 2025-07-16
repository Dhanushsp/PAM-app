import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Pressable } from 'react-native';
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
    <View className="flex-1 justify-center items-center bg-black/50 absolute inset-0 z-50">
      <ScrollView className="bg-white p-5 rounded-lg w-4/5 max-h-[90vh]" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-bold text-blue-700">Add Sale</Text>
          <Pressable onPress={onClose}><Text className="text-gray-400 text-2xl font-bold">&times;</Text></Pressable>
        </View>
        <TextInput
          placeholder="Search Customer"
          value={customerName}
          onChangeText={setCustomerName}
          className="border border-gray-300 rounded px-3 py-2 text-black bg-white mb-2"
          placeholderTextColor="#888"
        />
        {filteredCustomers.length > 0 && (
          <View className="bg-white border rounded max-h-40 mb-2">
            <ScrollView>
              {filteredCustomers.map(c => (
                <Pressable
                  key={c._id}
                  onPress={() => { setSelectedCustomer(c); setCustomerName(c.name); setCurrentCredit(Number(c.credit)); }}
                  className="px-3 py-2 hover:bg-blue-50"
                >
                  <Text>{c.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
        {selectedCustomer && (
          <>
            <Text className="text-sm text-gray-600">Current Credit: ₹{currentCredit.toFixed(2)}</Text>
            <Text className="text-sm">Sale Date</Text>
            <TextInput
              value={saleDate}
              onChangeText={setSaleDate}
              placeholder="YYYY-MM-DD"
              className="border border-gray-300 rounded px-3 py-2 text-black bg-white mb-2"
              placeholderTextColor="#888"
            />
            <Text className="text-sm">Sale Type</Text>
            <View className="border border-gray-300 rounded mb-2">
              <ScrollView horizontal>
                <Pressable
                  onPress={() => setSaleType('kg')}
                  className={`px-3 py-2 ${saleType === 'kg' ? 'bg-blue-100' : ''}`}
                >
                  <Text className={saleType === 'kg' ? 'font-semibold' : ''}>KG</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSaleType('pack')}
                  className={`px-3 py-2 ${saleType === 'pack' ? 'bg-blue-100' : ''}`}
                >
                  <Text className={saleType === 'pack' ? 'font-semibold' : ''}>Pack</Text>
                </Pressable>
              </ScrollView>
            </View>
            <Text className="text-sm">Products</Text>
            <View className="border border-gray-300 rounded max-h-40 mb-2">
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
                    className={`px-3 py-2 ${selectedProducts.includes(product._id) ? 'bg-blue-100' : ''}`}
                  >
                    <Text className={selectedProducts.includes(product._id) ? 'font-semibold' : ''}>
                      {product.productName}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            {productDetails.map((item, idx) => (
              <View key={item.productId} className="bg-gray-50 rounded p-2 space-y-2 mb-2">
                <Text className="font-medium">{item.productName}</Text>
                <TextInput
                  value={item.quantity.toString()}
                  onChangeText={v => handleQuantityChange(idx, v)}
                  placeholder="Quantity"
                  keyboardType="numeric"
                  className="border border-gray-300 rounded px-3 py-2 text-black bg-white mb-1"
                  placeholderTextColor="#888"
                />
                <TextInput
                  value={item.price.toString()}
                  onChangeText={v => handlePriceChange(idx, v)}
                  placeholder="Price"
                  keyboardType="numeric"
                  className="border border-gray-300 rounded px-3 py-2 text-black bg-white"
                  placeholderTextColor="#888"
                />
              </View>
            ))}
            <Text className="font-semibold">Total Price: ₹{totalPrice.toFixed(2)}</Text>
            <TextInput
              value={amountReceived.toString()}
              onChangeText={v => setAmountReceived(parseFloat(v) || 0)}
              placeholder="Amount Received"
              keyboardType="numeric"
              className="border border-gray-300 rounded px-3 py-2 text-black bg-white mb-2"
              placeholderTextColor="#888"
            />
            <Text className="text-sm text-gray-600 mb-2">Updated Credit: ₹{updatedCredit.toFixed(2)}</Text>
            <Text className="text-sm">Payment Method</Text>
            <View className="flex-row mb-2">
              <Pressable
                onPress={() => setPaymentMethod('cash')}
                className={`px-3 py-2 rounded-l ${paymentMethod === 'cash' ? 'bg-blue-100' : 'bg-gray-100'}`}
              >
                <Text className={paymentMethod === 'cash' ? 'font-semibold' : ''}>Cash</Text>
              </Pressable>
              <Pressable
                onPress={() => setPaymentMethod('online')}
                className={`px-3 py-2 rounded-r ${paymentMethod === 'online' ? 'bg-blue-100' : 'bg-gray-100'}`}
              >
                <Text className={paymentMethod === 'online' ? 'font-semibold' : ''}>Online</Text>
              </Pressable>
            </View>
            {error ? <Text className="text-red-500 mb-2">{error}</Text> : null}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-green-600 py-2 rounded-lg mt-2 active:scale-95"
            >
              <Text className="text-white text-center font-semibold">
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
