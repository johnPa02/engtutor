import { useRef, useState, useEffect,ChangeEvent } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import SpeechRecognition,{useSpeechRecognition} from 'react-speech-recognition';
import CIcon from '@coreui/icons-react';
import {cilMicrophone,cilMediaStop} from '@coreui/icons'
export default function PdfChat() {
  const [query, setQuery] = useState<string>('');
  const [write,setWrite] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const {
    transcript,
    listening,
    resetTranscript
  } = useSpeechRecognition();
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    pendingSourceDocs?: Document[];
  }>({
    messages: [
      {
        message: 'Hi, bạn muốn hỏi gì',
        type: 'apiMessage',
      },
    ],
  });

  const { messages } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const textarea = textAreaRef.current;

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (transcript!=''){
      setQuery(write+transcript);
    }
    
  }, [transcript]);

  useEffect(() => {
    messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
  }, [messages]);

  const handleInput = () => {
    if (textarea) {
      textarea.style.height = ''; // Đặt lại chiều cao thành rỗng trước khi tính toán chiều cao mới
      textarea.style.height = `${textarea.scrollHeight}px`; // Thiết lập chiều cao mới dựa trên scrollHeight
    }
  };
  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();
    setError(null);
    if (!query) {
      alert('Đặt câu hỏi ở đây');
      return;
    }
    if (textarea) {
      textarea.style.height = ''; // Đặt lại chiều cao thành rỗng trước khi tính toán chiều cao mới
    }

    const question = query.trim();

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
    }));

    setLoading(true);
    setQuery('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
        }),
      });
      const data = await response.json();
      console.log('data', data);

      if (data.error) {
        setError(data.error);
      } else {
        setMessageState((state) => ({
          ...state,
          messages: [
            ...state.messages,
            {
              type: 'apiMessage',
              message: data.text,
              sourceDocs: data.sourceDocuments,
            },
          ],
        }));
      }
      console.log('messageState', messageState);

      setLoading(false);
      
    } catch (error) {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
      console.log('error', error);
    }
  }

  //prevent empty submissions
  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e);
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }
  };
  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    await SpeechRecognition.startListening({continuous:true});
  };
  const handleStop = async ()=>{
    await SpeechRecognition.stopListening()
    setWrite(transcript)
    resetTranscript()
  }
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value)
    setWrite(e.target.value)
  }

  return (
    <>
      <Layout>
      
        <div className="mx-auto flex flex-col gap-4">
          <main className={styles.main}>
            <p>{transcript}</p>
            <div className={styles.cloud}>
              <div ref={messageListRef} className={styles.messagelist}>
                {messages.map((message, index) => {
                  let icon;
                  let className;
                  if (message.type === 'apiMessage') {
                    icon = (
                      <Image
                        key={index}
                        src="/bot-image.png"
                        alt="AI"
                        width="40"
                        height="40"
                        className={styles.boticon}
                        priority
                      />
                    );
                    className = styles.apimessage;
                  } else {
                    icon = (
                      <Image
                        key={index}
                        src="/usericon.png"
                        alt="Me"
                        width="30"
                        height="30"
                        className={styles.usericon}
                        priority
                      />
                    );
                    // The latest message sent by the user will be animated while waiting for a response
                    className =
                      loading && index === messages.length - 1
                        ? styles.usermessagewaiting
                        : styles.usermessage;
                  }
                  return (
                    <>
                      <div key={`chatMessage-${index}`} className={className}>
                        {icon}
                        <div className={styles.markdownanswer}>
                          <ReactMarkdown linkTarget="_blank">
                            {message.message}
                          </ReactMarkdown>
                        </div>
                      </div>
                      {message.sourceDocs && (
                        <div
                          className="p-5"
                          key={`sourceDocsAccordion-${index}`}
                        >
                          <Accordion
                            type="single"
                            collapsible
                            className="flex-col"
                          >
                            {message.sourceDocs.map((doc, index) => (
                              <div key={`messageSourceDocs-${index}`}>
                                <AccordionItem value={`item-${index}`}>
                                  <AccordionTrigger>
                                    <h3>Trích dẫn {index + 1}</h3>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <ReactMarkdown linkTarget="_blank">
                                      {doc.pageContent}
                                    </ReactMarkdown>
                                  
                                  </AccordionContent>
                                </AccordionItem>
                              </div>
                            ))}
                          </Accordion>
                        </div>
                      )}
                    </>
                    
                  );
                })}
              </div>
            </div>
            <div className={styles.center}>
              <div className={styles.cloudform}>
                <form onSubmit={handleSubmit}>
                  <textarea
                    disabled={loading}
                    onKeyDown={handleEnter}
                    ref={textAreaRef}
                    autoFocus={false}
                    onInput={handleInput}
                    rows={1}
                    maxLength={512}
                    id="userInput"
                    name="userInput"
                    placeholder={
                      loading
                        ? 'Chờ một tí nhá...'
                        : 'Bạn muốn hỏi chi?'
                    }
                    value={query}
                    onChange={handleChange}
                    className={styles.textarea}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.generatebutton}
                  >
                    {loading ? (
                      <div className={styles.loadingwheel}>
                        <LoadingDots color="#000" />
                      </div>
                    ) : (
                      // Send icon SVG in input field
                      <svg
                        viewBox="0 0 20 20"
                        className={styles.svgicon}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                      </svg>
                    )}
                   
                  </button>
                  
                </form>
                {listening? <button onClick={handleStop} className={styles.recordingbutton}><CIcon icon={cilMediaStop} /></button>
                : <button onClick={handleClick} className={styles.microphonebutton}><CIcon icon={cilMicrophone} /></button>}
                
              </div>
              
            </div>
            {error && (
              <div className="border border-red-400 rounded-md p-4">
                <p className="text-red-500">{error}</p>
              </div>
            )}
          </main>
        </div>
        
      </Layout>
    </>
  );
}