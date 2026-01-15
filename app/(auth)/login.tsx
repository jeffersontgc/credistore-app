import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../../context/AuthContext";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(loginInput: { email: $email, password: $password }) {
      access_token
      user {
        uuid
        email
        roles
      }
    }
  }
`;

const loginSchema = z.object({
  email: z.string().email({ message: "Correo electrónico inválido" }),
  password: z.string().min(1, { message: "Contraseña requerida" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

import { LoginMutation, LoginMutationVariables } from "@/types/graphql";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [loginMutation, { loading, error }] = useMutation<
    LoginMutation,
    LoginMutationVariables
  >(LOGIN_MUTATION);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await loginMutation({
        variables: {
          email: data.email,
          password: data.password,
        },
      });

      if (result.data?.login?.access_token) {
        await signIn(result.data.login.access_token);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-gray-100 p-6">
      <View className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg">
        <View className="items-center mb-8">
          <Text className="text-3xl font-bold text-indigo-600">CrediStore</Text>
          <Text className="text-gray-500 mt-2">Iniciar Sesión</Text>
        </View>

        {error && (
          <View className="mb-4 p-3 bg-red-100 rounded-lg">
            <Text className="text-red-600 text-center">{error.message}</Text>
          </View>
        )}

        <View className="space-y-4">
          <View>
            <Text className="text-gray-700 font-medium mb-1">
              Correo Electrónico
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:border-indigo-500"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="admin@credistore.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </Text>
            )}
          </View>

          <View>
            <Text className="text-gray-700 font-medium mb-1">Contraseña</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 focus:border-indigo-500"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="••••••••"
                  secureTextEntry
                />
              )}
            />
            {errors.password && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </Text>
            )}
          </View>

          <TouchableOpacity
            className="w-full bg-indigo-600 p-4 rounded-xl mt-6 active:bg-indigo-700 items-center"
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">Ingresar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
