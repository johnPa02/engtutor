import { useRef, useState, useEffect,ChangeEvent } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Message } from '@/types/speaking';
import SpeechRecognition,{useSpeechRecognition} from 'react-speech-recognition';
import CIcon from '@coreui/icons-react';
import {cilMicrophone,cilMediaStop,cilVolumeHigh} from '@coreui/icons'

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const [write,setWrite] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audio, setAudio] = useState(null);
  const {
    transcript,
    listening,
    resetTranscript
  } = useSpeechRecognition();
  const [messages, setMessages] = useState<Message[]>([]);

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
    if (audio) {
      playSound();
    }
  }, [audio]);

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
    
    setMessages(prevMessages=>[...prevMessages, {
        role: 'user',
        content: question
    }]);

    setLoading(true);
    setQuery('');
    setWrite('')
    try {
      const response = await fetch('/api/generate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages:[...messages,{
            role: 'user',
            content: question
        }],
        }),
      });
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else {
        setMessages(prevMessages=>[
            ...prevMessages,data
          ]
        );
      }
      try {
        const response = await fetch("/api/elevenlabs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: data.content,
          }),
        });

        const { file } = await response.json();
        setAudio(file);
      } catch (error:any) {
        console.log(error.message);
      } finally {
        setLoading(false);
      }
      
      
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
    setLoading(false)
    setWrite(transcript)
    resetTranscript()
  }
  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value)
    setWrite(e.target.value)
  }
  const playSound = () => {
    const audioo = new Audio(`audio/${audio}`);
    audioo.play();
  };
  return (
    <>
      <Layout>
      
        <div className="mx-auto flex flex-col gap-4">
          <main className={styles.main}>
            <p>{query}</p>
            <div className={styles.cloud}>
              <div ref={messageListRef} className={styles.messagelist}>
              <div className={styles.usermessage}>
              <Image

                src="/bot-image.png"
                alt="AI"
                width="40"
                height="40"
                className={styles.boticon}
                priority
              />
              <div className={styles.markdownanswer}>
                <ReactMarkdown linkTarget="_blank">
                I am happy to help you practice your IELTS speaking skills. 
                Let&apos;s start with a topic of your choice. Please share a sentence or 
                a paragraph on the selected topic and I will provide feedback and 
                corrections if needed.
                </ReactMarkdown>
              </div>
              </div>
                {messages.map((message, index) => {
                  let icon;
                  let className;
                  if (message.role === 'assistant') {
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
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    
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
                <button onClick={playSound} className={styles.microphonebutton}><CIcon icon={cilVolumeHigh} /></button>
              
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
