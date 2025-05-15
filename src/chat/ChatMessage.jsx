import React, { useState, useEffect, useRef } from "react";
import {
  Avatar,
  Icon,
  Textarea,
  Loading,
  Tooltip,
  Button,
  Popover,
} from "@/components";
import { RobotOutlined, UserOutlined, DeleteOutlined } from "@ant-design/icons";
import { CopyIcon, ScrollView, Error, EmptyChat, ChatHelp } from "./component";
import { MessageRender } from "./MessageRender";
import { ConfigInfo } from "./ConfigInfo";
import { useGlobal } from "./context";
import { useMesssage, useSendKey, useOptions } from "./hooks";
import { dateFormat } from "./utils";
import avatar from "@/assets/images/avatar-gpt.png";
import styles from "./style/message.module.less";
import { classnames } from "../components/utils";
import { AuthModal } from "./component/AuthModal";
import { AdminPanel } from "./component/AdminPanel";
import { CreateProfileModal } from "./component/CreateProfileModal";
import { useAuth } from "./context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "./context/firebase.js";
import { sendChatMessage } from "./service/chat";
import { notification, Tooltip as AntdTooltip, Drawer, Modal } from "antd";
import { Button as AntButton, FloatButton, message as antMessage } from "antd"; // <-- Added FloatButton import
// import { insertToMongoDB } from './service/mongodb';

// Helper function to get message preview
const getMessagePreview = (messages) => {
  if (messages && messages.length > 0 && messages[0].content) {
    const content = messages[0].content;
    return content.substring(0, 10) + (content.length > 10 ? '...' : '');
  }
  return "New Chat";
};

// New ConversationItem component
function ConversationItem({ item, index, chat, currentChat, is, setState }) {
  const originalIndex = chat.findIndex((c) => c === item);
  
  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    Modal.confirm({
      title: 'Delete Conversation',
      content: 'Are you sure you want to delete this conversation?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => {
        try {
          const chatCopy = [...chat];
          chatCopy.splice(originalIndex, 1);
          
          // If we're deleting the current chat, switch to another one
          if (currentChat === originalIndex) {
            const newCurrentChat = originalIndex > 0 ? originalIndex - 1 : 0;
            setState({ 
              chat: chatCopy,
              currentChat: chatCopy.length > 0 ? newCurrentChat : 0
            });
          } else {
            // If we're deleting a chat with an index less than the current one,
            // we need to adjust the currentChat index
            const newCurrentChat = originalIndex < currentChat ? currentChat - 1 : currentChat;
            setState({ 
              chat: chatCopy,
              currentChat: chatCopy.length > 0 ? newCurrentChat : 0
            });
          }
          
          // Close the drawer if there are no more conversations
          if (chatCopy.length === 0) {
            setState({ is: { ...is, drawerVisible: false } });
          }
          
          antMessage.success('Conversation deleted successfully');
        } catch (error) {
          console.error('Error deleting conversation:', error);
          antMessage.error('Failed to delete conversation');
        }
      }
    });
  };

  return (
    <div
      key={originalIndex}
      className={classnames(
        styles.drawer_conversation_item,
        currentChat === originalIndex && styles.drawer_conversation_active
      )}
      onClick={() => {
        setState({ currentChat: originalIndex });
      }}
    >
      <div className={styles.drawer_conversation_title}>
        {getMessagePreview(item.messages)}
      </div>
      <div className={styles.drawer_conversation_messages}>
        {item.messages?.length || 0} messages
      </div>
      <div className={styles.drawer_conversation_date}>
        {new Date(
          item.messages[item.messages.length - 1]?.sentTime || item.ct
        ).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })}
      </div>
      <div className={styles.drawer_conversation_delete} onClick={handleDelete}>
        <AntdTooltip title="Delete conversation" placement="left">
          <DeleteOutlined style={{ fontSize: '16px' }} />
        </AntdTooltip>
      </div>
    </div>
  );
}

export function MessageHeader() {
  const { is, setIs, clearMessage, options, chat, currentChat, setState } =
    useGlobal();
  const { message } = useMesssage();
  const { messages = [] } = message || {};
  const columnIcon = is.sidebar ? "column-close" : "column-open";
  const { setGeneral } = useOptions();

  const { currentUser } = useAuth();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [adminPanelVisible, setAdminPanelVisible] = useState(false);
  const [createProfileModalVisible, setCreateProfileModalVisible] =
    useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  // Show auth modal on page load if user is not logged in
  useEffect(() => {
    if (!currentUser) {
      setAuthModalVisible(true);
    }
  }, []);

  const checkUserProfile = async () => {
    if (currentUser) {
      try {
        const response = await fetch(
          `http://65.109.233.16:3001/api/profiles/check/${currentUser.uid}`
        );
        const data = await response.json();
        setHasProfile(data.exists);
      } catch (error) {
        console.error("Error checking profile:", error);
        setHasProfile(false);
      }
    }
  };

  useEffect(() => {
    checkUserProfile();
  }, [currentUser, createProfileModalVisible]);

  const handleLoginClick = () => {
    setAuthModalVisible(true);
  };

  const handleSignUpSuccess = () => {
    setCreateProfileModalVisible(true);
  };

  const handleProfileModalClose = () => {
    setCreateProfileModalVisible(false);
    checkUserProfile();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      notification.success({
        message: "Success",
        description: "User logged out successfully",
        placement: "topRight",
      });
      setAuthModalVisible(true);
    } catch (error) {
      console.error("Error signing out:", error);
      notification.error({
        message: "Error",
        description: "Failed to log out. Please try again.",
        placement: "topRight",
      });
    }
  };

  // Check if user is admin (replace with your admin check logic)
  const isAdmin = currentUser?.email === "admin@example.com";

  const handleAdminPanelClick = () => {
    setAdminPanelVisible(true);
  };

  const handleInsert = async () => {
    try {
      const response = await fetch("http://65.109.233.16:3001/api/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Test message",
          timestamp: new Date(),
          userId: currentUser?.uid || "anonymous",
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }
      console.log("Successfully inserted document:", data.result);
    } catch (error) {
      console.error("Failed to insert document:", error);
    }
  };

  return (
    <div className={classnames(styles.header)}>
      <Button
        type="icon"
        icon={columnIcon}
        onClick={() => setIs({ sidebar: !is.sidebar })}
      />
      {/* <Button type="icon" icon={columnIcon} onClick={handleInsert} /> */}
      <div className={styles.header_title}>
        {message?.title}
        <div className={styles.length}>{messages.length} messages</div>
      </div>
      <div className={styles.header_bar}>
        {currentUser && (
          <div style={{ marginRight: "10px" }}>
            {!hasProfile && (
              <Button
                type="primary"
                onClick={() => setCreateProfileModalVisible(true)}
                className={styles.createProfileButton}
              >
                Create Profile
              </Button>
            )}
          </div>
        )}
        {currentUser ? (
          <div className={styles.userInfo}>
            <Avatar src={currentUser.photoURL || avatar} size={32} />
            <span className={styles.userName}>
              {currentUser.displayName || currentUser.email}
            </span>
            {isAdmin && (
              <Button
                type="text"
                onClick={handleAdminPanelClick}
                className={styles.adminButton}
              >
                Admin Panel
              </Button>
            )}

            <AntdTooltip title="Clear Chat" placement="bottom">
              <Icon
                className={styles.icon}
                type="clear"
                onClick={clearMessage}
                style={{ marginRight: "8px" }}
              />
            </AntdTooltip>

            {/* <AntdTooltip title="Chat History" placement="bottom">
              <Icon
                className={styles.icon}
                type="history"
                onClick={() => setState({ is: { ...is, drawerVisible: true } })}
                style={{ marginRight: "8px" }}
              />
            </AntdTooltip> */}

            <AntButton danger onClick={handleLogout}>
              Logout
            </AntButton>
          </div>
        ) : (
          <Button type="primary" onClick={handleLoginClick}>
            Register into Danora
          </Button>
        )}
      </div>
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSignUpSuccess={handleSignUpSuccess}
      />
      <AdminPanel
        visible={adminPanelVisible}
        onClose={() => setAdminPanelVisible(false)}
      />
      <CreateProfileModal
        visible={createProfileModalVisible}
        onClose={handleProfileModalClose}
      />
      <Drawer
        title={`${
          chat[currentChat]?.persona?.title || "Untitled"
        } Conversations`}
        placement="right"
        onClose={() => setState({ is: { ...is, drawerVisible: false } })}
        visible={is.drawerVisible}
        width={320}
      >
        <div className={styles.drawer_conversations}>
          <div className={styles.drawer_header}>
            <AntButton
              type="primary"
              block
              size="large"
              onClick={() => {
                const newChat = {
                  title: chat[currentChat]?.persona?.title,
                  id: Date.now(),
                  messages: [],
                  ct: Date.now(),
                  icon: [2, "files"],
                  persona: chat[currentChat]?.persona,
                };
                setState({
                  chat: [...chat, newChat],
                  currentChat: chat.length,
                });
                setState({ is: { ...is, drawerVisible: false } });
              }}
              style={{ marginBottom: "16px" }}
            >
              + New Chat
            </AntButton>
          </div>
          {chat
            .filter((item) => {
              const currentPersona = chat[currentChat]?.persona?.title;
              const itemPersona = item.persona?.title;
              return (
                currentPersona && 
                itemPersona && 
                currentPersona === itemPersona &&
                (item.messages?.length > 0)
              );
            })
            .map((item, index) => (
              <ConversationItem
                key={index}
                item={item}
                index={index}
                chat={chat}
                currentChat={currentChat}
                is={is}
                setState={setState}
              />
            ))}
          {!chat.some((item) => {
            const currentPersona = chat[currentChat]?.persona?.title;
            const itemPersona = item.persona?.title;
            return (
              currentPersona && itemPersona && currentPersona === itemPersona
            );
          }) && (
            <div className={styles.drawer_empty}>
              No conversations with{" "}
              {chat[currentChat]?.persona?.title || "this persona"} yet
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}

export function EditorMessage() {
  return (
    <div>
      <Textarea rows="3" />
    </div>
  );
}

export function MessageItem(props) {
  const { content, sentTime, role, suggestions, onSuggestionClick } = props;
  const { setMessage } = useGlobal();
  return (
    <div className={classnames(styles.item, styles[role])}>
      {role === "user" ? (
        <div
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#1890ff",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UserOutlined style={{ fontSize: "20px", color: "white" }} />
        </div>
      ) : (
        <div
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#52c41a",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RobotOutlined style={{ fontSize: "20px", color: "white" }} />
        </div>
      )}
      <div className={classnames(styles.item_content, styles[`item_${role}`])}>
        <div className={styles.item_inner}>
          <div className={styles.item_tool}>
            <div className={styles.item_bar}>
              {role === "user" ? (
                <React.Fragment>{/* User message actions */}</React.Fragment>
              ) : (
                <CopyIcon value={content} />
              )}
            </div>
          </div>
          <MessageRender>{content}</MessageRender>
          {role === "assistant" && suggestions && suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  type="text"
                  className={styles.suggestion_button}
                  onClick={() => {
                    // Optionally update the textarea with the suggestion...
                    setMessage(suggestion);
                    // Immediately send the suggestion as a message
                    if (onSuggestionClick) {
                      onSuggestionClick(suggestion);
                    }
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MessageBar({ handleSendMessage }) {
  const { is, options, typeingMessage, setMessage, setIs } = useGlobal();
  useSendKey(handleSendMessage, options.general.command);

  // Modified handleClick: explicitly pass the current message text
  const handleClick = (e) => {
    e.preventDefault();
    if (typeingMessage?.content?.trim()) {
      handleSendMessage(typeingMessage.content);
    }
  };

  return (
    <div className={styles.bar}>
      {is.thinking && (
        <div className={styles.bar_tool}>
          <div className={styles.bar_loading}>
            <div className="flex-c">
              <span>Thinking</span> <Loading />
            </div>
          </div>
        </div>
      )}
      <div
        className={styles.bar_inner}
        style={{ marginLeft: "40px", marginRight: "40px" }}
      >
        <div
          className={styles.bar_type}
          style={{ marginLeft: "20px", marginRight: "20px" }}
        >
          <Textarea
            transparent={true}
            rows="1"
            value={typeingMessage?.content || ""}
            onFocus={() => setIs({ inputing: true })}
            onBlur={() => setIs({ inputing: false })}
            placeholder="Ask me anything..."
            onChange={(value) => setMessage(value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className={styles.notoSansTextarea}
          />
        </div>
        <div className={styles.bar_actions}>
          <Button
            type="primary"
            onClick={handleClick}
            className={styles.send_button}
            disabled={is.thinking || !typeingMessage?.content?.trim()}
            icon="send"
          ></Button>
        </div>
      </div>
    </div>
  );
}

export function MessageContainer({ handleSendMessage }) {
  const { message } = useMesssage();
  const { messages = [] } = message || {};
  return (
    <>
      {messages.length ? (
        <div className={styles.container}>
          {messages.map((item, index) => (
            <MessageItem
              key={index}
              {...item}
              onSuggestionClick={handleSendMessage}
            />
          ))}
        </div>
      ) : (
        <ChatHelp />
      )}
    </>
  );
}

export function ChatMessage() {
  const {
    is,
    typeingMessage,
    setMessage,
    clearTypeing,
    setIs,
    chat,
    currentChat,
    setState,
  } = useGlobal();
  const { message } = useMesssage();
  const { messages = [] } = message || {};
  const { currentUser } = useAuth();

  const handleSendMessage = async (overrideMessage) => {
    if (!currentUser) {
      notification.warning({
        message: "Authentication Required",
        description: "Please login to chat with personas.",
        placement: "topRight",
      });
      return;
    }

    const messageContent = overrideMessage || typeingMessage?.content;
    if (!messageContent) return;

    try {
      setIs({ thinking: true });

      // Create the user message object
      const userMessage = {
        role: "user",
        content: messageContent,
        sentTime: new Date().toISOString(),
        id: Date.now(),
        uid: currentUser?.uid || "anonymous",
        userEmail: currentUser?.email || "anonymous",
        persona: chat[currentChat]?.persona || null,
      };

      // Create a temporary assistant message
      const assistantMessage = {
        role: "assistant",
        content: "",
        sentTime: new Date().toISOString(),
        id: Date.now() + 1,
        uid: currentUser?.uid || "anonymous",
        userEmail: currentUser?.email || "anonymous",
        persona: chat[currentChat]?.persona || null,
      };

      // Update chat immediately with both messages
      const updatedMessages = [...messages, userMessage, assistantMessage];
      const updatedChat = [...chat];
      updatedChat[currentChat] = {
        ...chat[currentChat],
        messages: updatedMessages,
      };

      setState({ chat: updatedChat });
      clearTypeing();

      // Build conversation context for API
      const contextMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      contextMessages.push({
        role: userMessage.role,
        content: userMessage.content,
      });

      let finalResponse = ""; // to store the complete response

      try {
        await sendChatMessage(
          messageContent,
          contextMessages,
          async (response, suggestions) => {
            if (response) {
              finalResponse = response;
              // Clean up response if needed
              const cleanResponse = response
                .replace(/What kind of pasta.*$/, "")
                .trim();

              const finalAssistantMessage = {
                ...assistantMessage,
                content: cleanResponse,
                suggestions: suggestions || [],
              };

              const latestMessages = [
                ...messages,
                userMessage,
                finalAssistantMessage,
              ];
              const newChat = [...chat];
              newChat[currentChat] = {
                ...chat[currentChat],
                messages: latestMessages,
              };

              setState({ chat: newChat });
            }

            if (suggestions) {
              // Store both messages in MongoDB
              try {
                const userResponse = await fetch(
                  "http://65.109.233.16:3001/api/chats/store",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...userMessage,
                      conversationId: currentChat,
                      timestamp: new Date().toISOString(),
                    }),
                  }
                );
                if (!userResponse.ok) {
                  throw new Error("Failed to store user message");
                }
                console.log("User message stored successfully");

                const assistantResponse = await fetch(
                  "http://65.109.233.16:3001/api/chats/store",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...assistantMessage,
                      content: finalResponse,
                      conversationId: currentChat,
                      timestamp: new Date().toISOString(),
                    }),
                  }
                );
                if (!assistantResponse.ok) {
                  throw new Error("Failed to store assistant message");
                }
                console.log("Assistant message stored successfully");
              } catch (error) {
                console.error("Failed to store messages:", error);
              }
            }
          },
          chat[currentChat]?.persona
        );
      } catch (error) {
        console.error("Chat error:", error);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIs({ thinking: false });
    }
  };

  return (
    <React.Fragment>
      <div className={styles.message}>
        <MessageHeader />
        <ScrollView>
          <MessageContainer handleSendMessage={handleSendMessage} />
          {is.thinking && <Loading />}
        </ScrollView>
        <MessageBar handleSendMessage={handleSendMessage} />

        {/* FloatButton that shows only when drawer is closed */}
        {!is.drawerVisible && (
          <AntdTooltip title="Chat History" placement="left">
            <FloatButton
              icon={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <Icon
                    onClick={() => {
                      if (!currentUser) {
                        antMessage.error("Please login");
                        return;
                      }
                      setState({ is: { ...is, drawerVisible: true } });
                    }}
                    type="history"
                    style={{
                      fontSize: "20px",
                      margin: 0,
                      padding: 0,
                    }}
                  />
                </div>
              }
              type="primary"
              style={{
                zIndex: 0,
                right: 24,
                top: 120,
                width: "44px",
                height: "44px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => {
                if (!currentUser) {
                  antMessage.error("Please login");
                  return;
                }
                setState({ is: { ...is, drawerVisible: true } });
              }}
            />
          </AntdTooltip>
        )}

        <Drawer
          title={`${
            chat[currentChat]?.persona?.title || "Untitled"
          } Conversations`}
          placement="right"
          onClose={() => setState({ is: { ...is, drawerVisible: false } })}
          visible={is.drawerVisible}
          width={320}
        >
          <div className={styles.drawer_conversations}>
            <div className={styles.drawer_header}>
              <AntButton
                type="primary"
                block
                size="large"
                onClick={() => {
                  const newChat = {
                    title: chat[currentChat]?.persona?.title,
                    id: Date.now(),
                    messages: [],
                    ct: Date.now(),
                    icon: [2, "files"],
                    persona: chat[currentChat]?.persona,
                  };
                  setState({
                    chat: [...chat, newChat],
                    currentChat: chat.length,
                  });
                  setState({ is: { ...is, drawerVisible: false } });
                }}
                style={{ marginBottom: "16px" }}
              >
                + New Chat
              </AntButton>
            </div>
            {chat
              .filter((item) => {
                const currentPersona = chat[currentChat]?.persona?.title;
                const itemPersona = item.persona?.title;
                return (
                  currentPersona &&
                  itemPersona &&
                  currentPersona === itemPersona &&
                  item.messages?.length > 0 // Filter out conversations with 0 messages
                );
              })
              .map((item, index) => (
                <ConversationItem
                  key={index}
                  item={item}
                  index={index}
                  chat={chat}
                  currentChat={currentChat}
                  is={is}
                  setState={setState}
                />
              ))}
            {!chat.some((item) => {
              const currentPersona = chat[currentChat]?.persona?.title;
              const itemPersona = item.persona?.title;
              return (
                currentPersona && itemPersona && currentPersona === itemPersona
              );
            }) && (
              <div className={styles.drawer_empty}>
                No conversations with{" "}
                {chat[currentChat]?.persona?.title || "this persona"} yet
              </div>
            )}
          </div>
        </Drawer>
      </div>
    </React.Fragment>
  );
}
