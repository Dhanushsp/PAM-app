import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_BASE_URL } from '../../lib/config';

interface LoginProps {
  setToken: (token: string) => void;
}

export default function Login({ setToken }: LoginProps) {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!mobile || !password) {
      setError('Please enter mobile and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_BASE_URL}/api/login`, { mobile, password });
      setToken(res.data.token);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
              <View className="bg-white rounded-xl p-6 w-11/12 max-w-sm">
        <Text className="text-2xl font-bold mb-6 text-center text-blue-700">Login</Text>

        <View className="space-y-4">
          <TextInput
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Mobile"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="number-pad"
          />
          <TextInput
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className={`w-full py-2 rounded-lg ${isLoading ? 'bg-gray-400' : 'bg-blue-600'}`}
          >
            <Text className="text-center text-white font-semibold">
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>

        {error ? <Text className="mt-4 text-red-500 text-center">{error}</Text> : null}
      </View>
      </View>
    </SafeAreaView>
  );
}
