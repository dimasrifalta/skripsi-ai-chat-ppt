import {throttle} from '@/utils';
import {IconClearAll} from '@tabler/icons-react';
import {useTranslation} from 'next-i18next';
import {FC, memo, MutableRefObject, useEffect, useRef, useState} from 'react';
import {ChatInput} from './ChatInput';
import {ChatLoader} from './ChatLoader';
import {ChatMessage} from './ChatMessage';
import {KeyValuePair, Message} from "@/types/chat";
import {Conversation} from "@/types/conversation";
import {KeyConfiguration} from "@/types/keyConfiguration";
import {IndexGallery} from "@/components/Chat/IndexGallery";
import {IndexFormTabs} from "@/components/Chat/IndexFormTabs";
import {Button} from "@/components/ui/button";
import {Eraser, FileUp, Heart} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Props {
  conversation: Conversation;
  keyConfiguration: KeyConfiguration;
  messageIsStreaming: boolean;
  loading: boolean;
  onSend: (message: Message, deleteCount?: number) => void;
  onUpdateConversation: (
    conversation: Conversation,
    data: KeyValuePair,
  ) => void;
  onEditMessage: (message: Message, messageIndex: number) => void;
  stopConversationRef: MutableRefObject<boolean>;
  handleKeyConfigurationValidation: () => boolean;
  isShowIndexFormTabs: boolean;
  handleShowIndexFormTabs: (isShowIndexFormTabs: boolean) => void;
  
}

export const Chat: FC<Props> = memo(
  ({
     conversation,
     keyConfiguration,
     messageIsStreaming,
     loading,
     onSend,
     onUpdateConversation,
     onEditMessage,
     stopConversationRef,
     handleKeyConfigurationValidation,
     isShowIndexFormTabs,
     handleShowIndexFormTabs,
   }) => {
    const {t} = useTranslation('chat');
    const [currentMessage, setCurrentMessage] = useState<Message>();
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
    const [chatInputContent, setChatInputContent] = useState<string>('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollDown = () => {
      if (autoScrollEnabled) {
        messagesEndRef.current?.scrollIntoView(true);
      }
    };
    const throttledScrollDown = throttle(scrollDown, 250);

    const handleChatInputContent = (content: string) => {
      setChatInputContent(content);
    }

    useEffect(() => {
      throttledScrollDown();
      setCurrentMessage(
        conversation.messages[conversation.messages.length - 2],
      );
    }, [conversation.messages, throttledScrollDown]);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setAutoScrollEnabled(entry.isIntersecting);
          if (entry.isIntersecting) {
            textareaRef.current?.focus();
          }
        },
        {
          root: null,
          threshold: 0.5,
        },
      );
      const messagesEndElement = messagesEndRef.current;
      if (messagesEndElement) {
        observer.observe(messagesEndElement);
      }
      return () => {
        if (messagesEndElement) {
          observer.unobserve(messagesEndElement);
        }
      };
    }, [messagesEndRef]);

    const onDownloadFileUpload = async () => {
      
      try {
        console.log(conversation);
        const res = await fetch(`/api/files/?filename=${conversation.index.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) {
          throw new Error(`download file failed:, ${conversation.index.id}`);
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        //get full file name with extension from response header
        const contentDisposition = res.headers.get('Content-Disposition');
        console.log(contentDisposition);
        const fileName = contentDisposition?.split('filename=')[1]?.replace(/"/g, '');
        a.download = fileName ? fileName : conversation.index.id;
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.log(e);
      }
      
    };


    return (
      <>
        {isShowIndexFormTabs ? (
          <IndexFormTabs
            keyConfiguration={keyConfiguration}
            handleKeyConfigurationValidation={handleKeyConfigurationValidation}
            handleShowIndexFormTabs={handleShowIndexFormTabs}
          />
        ) : (
          <div className="overflow-none relative flex-1 bg-white dark:bg-[#343541]">
            <>
              <div
                className="max-h-full overflow-x-hidden"
                ref={chatContainerRef}
              >
                {conversation.index?.name.length === 0 &&
                conversation.messages.length === 0 ? (
                  <>
                    <IndexGallery
                      keyConfiguration={keyConfiguration}
                      handleKeyConfigurationValidation={
                        handleKeyConfigurationValidation
                      }
                      handleShowIndexFormTabs={handleShowIndexFormTabs}
                      onIndexChange={(index) =>
                        onUpdateConversation(conversation, {
                          key: 'index',
                          value: index,
                        })
                      }
                    />
                  </>
                ) : (
                  <>
                    <div className="bg-neutral-20 flex items-center justify-center border border-b-neutral-300 py-2 text-lg text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                      {conversation.index.name}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="link">
                            <Eraser className="w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you sure you want to clear all messages?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete all messages in this
                              conversation.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                onUpdateConversation(conversation, {
                                  key: 'messages',
                                  value: [],
                                })
                              }
                            >
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <Card className="relative mx-auto mt-4 text-base md:max-w-2xl">
                      <CardHeader>
                        <CardTitle>Outline</CardTitle>
                        <CardDescription>
                          Here outline of the conversation
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {conversation.index.questions?.map(
                          (question, index) => (
                            <p
                              className="mb-2 cursor-pointer underline"
                              key={index}
                              onClick={() => handleChatInputContent(question)}
                            >
                              {index + 1}. {question}
                            </p>
                          ),
                        )}
                      </CardContent>
                    </Card>

                    <div className="bg-neutral-20 flex items-center justify-center border border-b-neutral-300 py-2 text-lg text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                      <Button variant="link" >
                        <FileUp className="mr-2" /> Generate PPT
                      </Button>

                      <Button variant="link" onClick={() => onDownloadFileUpload()}>
                        <FileUp className="mr-2" /> Download File Upload
                      </Button>
                    </div>

                    {conversation.messages.map((message, index) => (
                      <ChatMessage
                        key={index}
                        message={message}
                        messageIndex={index}
                        onEditMessage={onEditMessage}
                      />
                    ))}

                    {loading && <ChatLoader />}

                    <div
                      className="h-[162px] bg-white dark:bg-[#343541]"
                      ref={messagesEndRef}
                    />
                  </>
                )}
              </div>

              <ChatInput
                stopConversationRef={stopConversationRef}
                textareaRef={textareaRef}
                messageIsStreaming={messageIsStreaming}
                conversationIsEmpty={conversation.messages.length > 0}
                onSend={(message) => {
                  setCurrentMessage(message);
                  onSend(message);
                }}
                onRegenerate={() => {
                  if (currentMessage) {
                    onSend(currentMessage, 2);
                  }
                }}
                handleKeyConfigurationValidation={
                  handleKeyConfigurationValidation
                }
                chatInputContent={chatInputContent}
                handleChatInputContent={handleChatInputContent}
              />
            </>
          </div>
        )}
      </>
    );
  },
);
Chat.displayName = 'Chat';
