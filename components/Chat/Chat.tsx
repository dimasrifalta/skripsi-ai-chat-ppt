import { throttle } from '@/utils';
import { IconClearAll } from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';
import { FC, memo, MutableRefObject, useEffect, useRef, useState } from 'react';
import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { ChatMessage } from './ChatMessage';
import { KeyValuePair, Message } from '@/types/chat';
import { Conversation } from '@/types/conversation';
import { KeyConfiguration } from '@/types/keyConfiguration';
import { IndexGallery } from '@/components/Chat/IndexGallery';
import { IndexFormTabs } from '@/components/Chat/IndexFormTabs';
import { Button } from '@/components/ui/button';
import { Eraser, FileUp, Heart } from 'lucide-react';
import pptxgen from 'pptxgenjs';
import { Progress } from '../ui/progress';

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
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { any } from 'zod';
import path from 'path';

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
    const { t } = useTranslation('chat');
    const [currentMessage, setCurrentMessage] = useState<Message>();
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
    const [chatInputContent, setChatInputContent] = useState<string>('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [isUploadSuccess, setIsUploadSuccess] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    const scrollDown = () => {
      if (autoScrollEnabled) {
        messagesEndRef.current?.scrollIntoView(true);
      }
    };
    const throttledScrollDown = throttle(scrollDown, 250);

    const handleChatInputContent = (content: string) => {
      setChatInputContent(content);
    };

    useEffect(() => {
      const interval = setInterval(() => {
        setUploadProgress((progress) => (progress + 1) % 101);
      }, 50);
      return () => clearInterval(interval);
    }, []);

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
        const res = await fetch(
          `/api/files/?filename=${conversation.index.id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
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
        const fileName = contentDisposition
          ?.split('filename=')[1]
          ?.replace(/"/g, '');
        a.download = fileName ? fileName : conversation.index.id;
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (e) {
        console.log(e);
        alert('file upload tidak ditemukan!!');
      }
    };

    const handlePpt = async () => {
      var topic = '';
      var slideNum = 6;
      var bulletMin = 3;
      var bulletMax = 5;
      var extra = '';
      let powerpoint = '';
      let response: Response;
      const controller = new AbortController();
      let prompt = `
      create a power point script based on context, response should be in a JSON format similar to the following:
      {
          "title": "powerPointTitle",
          "slides": [
              {
                  "title": "titleName",
                  "content": [
                      "string","string","string",...
                  ]
              },
      ...}
    Must be ${slideNum} slides long and each content array should have ${bulletMin}-${bulletMax} bullet points for the slide. ${extra}
      `;
      //   let prompt = `Generate a PowerPoint presentation script in JSON format. The script should have ${slideNum} slides, and each slide should contain between ${bulletMin} and ${bulletMax} bullet points. The JSON structure should be as follows:
      //   {
      //     "title": "powerPointTitle",
      //     "slides": [
      //         {
      //             "title": "titleName",
      //             "content": ["string1", "string2", "string3", ...]
      //         },
      //         ...
      //     ]
      // }
      //  ${extra}
      //   `;

      if (!handleKeyConfigurationValidation()) {
        return;
      }

      response = await fetch(
        `/api/query?message=${prompt}&indexId=${conversation.index.id}`,
        {
          method: 'GET',
          headers: {
            'x-api-type': keyConfiguration.apiType ?? '',
            'x-api-key': keyConfiguration.apiKey ?? '',
            'x-api-model': keyConfiguration.apiModel ?? '',
            'x-azure-api-key': keyConfiguration.azureApiKey ?? '',
            'x-azure-instance-name': keyConfiguration.azureInstanceName ?? '',
            'x-azure-api-version': keyConfiguration.azureApiVersion ?? '',
            'x-azure-deployment-name':
              keyConfiguration.azureDeploymentName ?? '',
            'x-azure-embedding-deployment-name':
              keyConfiguration.azureEmbeddingDeploymentName ?? '',
          },
        },
      );
      if (!response.ok) {
        const message = await response.text();
        console.log('chat failed: ', message);
        alert(`error message: ' ${message}`);
        return;
      }

      if (!response?.body) {
        const message = await response.text();
        console.log('chat failed: ', message);
        alert(`error message: ' ${message}`);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let isFirst = true;
      let text = '';

      while (!done) {
        if (stopConversationRef.current) {
          controller.abort();
          done = true;
          break;
        }
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);

        text += chunkValue;

        if (isFirst) {
          console.log('chat success: ', text);
          isFirst = false;
        }
      }
      await reader.cancel();

      console.log(text);
      powerpoint = JSON.parse(text.replace('\n', ''));
      return powerpoint;
    };

    const generatePowerPoint = async () => {
      // Start the loading indicator
      setIsUploading(true);
      try {
        let powerpoint: any = await handlePpt();

        console.log(powerpoint);

        let pres = new pptxgen();
        let titleSlideRef = pres.addSlide();
        titleSlideRef.addText(powerpoint.title, {
          h: '100%',
          w: '100%',
          align: 'center',
          bold: true,
          fontSize: 50,
        });

        powerpoint.slides.forEach((slide: any) => {
          let slideRef = pres.addSlide();
          let bulletCount = 0;
          slideRef.addText(slide.title, {
            y: 0.5,
            h: 0.5,
            w: '100%',
            align: 'center',
            bold: true,
            fontSize: 24,
          });
          slide.content.forEach((bullet: any) => {
            slideRef.addText(bullet, {
              x: 1.5,
              y: 1.5 + 0.85 * bulletCount,
              h: 0.25,
              bullet: true,
            });
            bulletCount++;
          });
        });

        await pres.writeFile({
          fileName: `${powerpoint.title}.pptx`,
        });
      } catch (err) {
        console.log('error:', err);
        setIsUploading(false);
        setIsUploadSuccess(false);
        alert('Generate PPT gagal. Content tidak sesuai.');
      } finally {
        setIsUploading(false);
        setIsUploadSuccess(true);
        console.log('complete');
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
          <div className="relative flex-1 overflow-visible bg-white dark:bg-[#343541]">
            <>
              <div className="max-h-full overflow-auto" ref={chatContainerRef}>
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

                        {isUploading ? (
                          <>
                            <Progress
                              value={uploadProgress}
                              className="ml-16 w-[75%]"
                            />
                          </>
                        ) : (
                          <>
                            <Button
                              variant="link"
                              onClick={() => generatePowerPoint()}
                            >
                              <FileUp className="mr-2" /> Generate PPT
                            </Button>
                            <Button
                              variant="link"
                              onClick={() => onDownloadFileUpload()}
                            >
                              <FileUp className="mr-2" /> Download File Upload
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>

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
