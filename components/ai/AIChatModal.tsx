import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { X, Send, Sparkles, Bot, User } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AIService, ChatMessage } from "@/services/aiService";
import { Colors } from "@/constants/Colors";

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
}

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const aiService = API_KEY ? new AIService(API_KEY) : null;
const { width } = Dimensions.get("window");

const SUGGESTION_CHIPS = [
  "💰 Ventas de hoy",
  "⚠️ Deudores vencidos",
  "📦 Stock bajo",
  "📷 Ir al escáner",
  "👥 Ver usuarios",
];

export function AIChatModal({ visible, onClose }: AIChatModalProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      text: "Hola! Soy tu asistente virtual inteligente. 🤖\nPuedes preguntarme sobre tus ventas, inventario, deudas o productos. ¿En qué te ayudo hoy?",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible && messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        500
      );
    }
  }, [visible, messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend =
      typeof textOverride === "string" ? textOverride : inputText;
    if (!textToSend.trim() || isLoading) return;

    if (!aiService) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "model",
          text: "Error: No se ha configurado la API Key de Gemini. Por favor añádela al archivo .env como EXPO_PUBLIC_GEMINI_API_KEY.",
          isError: true,
        },
      ]);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: textToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      // Filter out welcome message and ensure history complies with Gemini API
      // (First message must be 'user')
      const history = messages
        .filter((m) => m.id !== "welcome" && !m.isError)
        .slice(-10);

      const responseText = await aiService.sendMessage(history, userMsg.text);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: responseText,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      console.error("AI Error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: `Error: ${error.message || "Ocurrió un error desconocido"}`,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.container}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <LinearGradient
              colors={["#6366f1", "#4f46e5"]}
              style={styles.header}
            >
              <View style={styles.headerRow}>
                <View style={styles.headerTitleContainer}>
                  <View style={styles.headerIconContainer}>
                    <Sparkles size={24} color="white" />
                  </View>
                  <View>
                    <Text style={styles.headerTitleText}>CrediStore AI</Text>
                    <Text style={styles.headerSubtitleText}>
                      Asistente Inteligente
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X color="white" size={24} />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Chat Area */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatListContent}
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.messageRow,
                    item.role === "user"
                      ? styles.messageRowUser
                      : styles.messageRowModel,
                  ]}
                >
                  {item.role === "model" && (
                    <View style={styles.botAvatar}>
                      <Bot size={16} color={Colors.primary} />
                    </View>
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      item.role === "user"
                        ? styles.messageBubbleUser
                        : item.isError
                        ? styles.messageBubbleError
                        : styles.messageBubbleModel,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        item.role === "user"
                          ? styles.messageTextUser
                          : item.isError
                          ? styles.messageTextError
                          : styles.messageTextModel,
                      ]}
                    >
                      {item.text}
                    </Text>
                  </View>

                  {item.role === "user" && (
                    <View style={styles.userAvatar}>
                      <User size={16} color="#64748b" />
                    </View>
                  )}
                </View>
              )}
            />

            {/* Input Area */}
            <View
              style={[styles.inputArea, { paddingBottom: insets.bottom + 20 }]}
            >
              {/* Suggestion Chips */}
              <View style={{ height: 44, marginBottom: 8 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsContainer}
                >
                  {SUGGESTION_CHIPS.map((chip, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.chip}
                      onPress={() => handleSend(chip)}
                      disabled={isLoading}
                    >
                      <Text style={styles.chipText}>{chip}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  multiline
                  placeholder="Escribe tu pregunta..."
                  placeholderTextColor="#9ca3af"
                  value={inputText}
                  onChangeText={setInputText}
                />
                <TouchableOpacity
                  onPress={() => handleSend()}
                  disabled={isLoading || !inputText.trim()}
                  style={[
                    styles.sendButton,
                    isLoading || !inputText.trim()
                      ? styles.sendButtonDisabled
                      : styles.sendButtonActive,
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator
                      color={inputText.trim() ? "white" : "#64748b"}
                      size="small"
                    />
                  ) : (
                    <Send
                      size={20}
                      color={inputText.trim() ? "white" : "#9ca3af"}
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  container: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    marginTop: 80,
    backgroundColor: "#f9fafb", // gray-50
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 25,
    },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24, // shadow-2xl equivalent approximation for android
  },
  header: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 8,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitleText: {
    color: "white",
    fontWeight: "900",
    fontSize: 20,
  },
  headerSubtitleText: {
    color: "#c7d2fe", // indigo-200
    fontWeight: "bold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.5, // tracking-widest
  },
  closeButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 8,
    borderRadius: 9999, // full
  },
  chatListContent: {
    padding: 20,
    paddingBottom: 100,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowModel: {
    justifyContent: "flex-start",
  },
  botAvatar: {
    backgroundColor: "#e0e7ff", // indigo-100
    width: 32,
    height: 32,
    borderRadius: 16, // full
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  userAvatar: {
    backgroundColor: "#e5e7eb", // gray-200
    width: 32,
    height: 32,
    borderRadius: 16, // full
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    alignSelf: "flex-end",
    marginBottom: 4,
  },
  messageBubble: {
    padding: 16,
    borderRadius: 16,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageBubbleUser: {
    backgroundColor: "#4f46e5", // indigo-600
    borderTopRightRadius: 0,
  },
  messageBubbleError: {
    backgroundColor: "#fef2f2", // red-50
    borderWidth: 1,
    borderColor: "#fee2e2", // red-100
    borderTopLeftRadius: 0,
  },
  messageBubbleModel: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#f3f4f6", // gray-100
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  messageTextUser: {
    color: "white",
    fontWeight: "500",
  },
  messageTextError: {
    color: "#dc2626", // red-600
  },
  messageTextModel: {
    color: "#1f2937", // gray-800
  },
  inputArea: {
    backgroundColor: "white",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6", // gray-100
    paddingBottom: 32, // fallback/initial
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#f9fafb", // gray-50
    borderWidth: 1,
    borderColor: "#e5e7eb", // gray-200
    borderRadius: 24,
    padding: 8,
    paddingLeft: 16,
  },
  textInput: {
    flex: 1,
    color: "#1f2937", // gray-900 (approx) or 800
    fontSize: 18,
    minHeight: 44,
    maxHeight: 128,
    marginBottom: 4,
  },
  sendButton: {
    padding: 12,
    borderRadius: 9999, // full
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: "#e5e7eb", // gray-200
  },
  sendButtonActive: {
    backgroundColor: "#4f46e5", // indigo-600
    shadowColor: "#c7d2fe", // indigo-200
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  chipsContainer: {
    paddingHorizontal: 0,
    paddingRight: 16,
  },
  chip: {
    backgroundColor: "#eff6ff", // blue-50
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe", // blue-200
    justifyContent: "center",
  },
  chipText: {
    color: "#2563eb", // blue-600
    fontWeight: "600",
    fontSize: 13,
  },
});
