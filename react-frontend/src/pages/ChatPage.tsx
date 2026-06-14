import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { useLocation } from 'react-router-dom';
import { importPrivateKey, importPublicKey, deriveSharedSecret, encryptMessage, decryptMessage } from '../lib/crypto';
import { Lock } from 'lucide-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

export default function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  
  // Get target user from state, or let them pick from connections
  const targetUser = location.state?.targetUser;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [connections, setConnections] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(targetUser || null);
  const [sharedSecret, setSharedSecret] = useState<CryptoKey | null>(null);
  
  const [clashes, setClashes] = useState<any[]>([]);
  const [clashCode, setClashCode] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchAPI('/connections').then(data => {
      setConnections(data.accepted);
      if (!activeChat && data.accepted.length > 0) {
        setActiveChat(data.accepted[0]);
      }
    });
  }, [user]);

  useEffect(() => {
    if (!activeChat || !activeChat.public_key) return;
    
    const deriveKey = async () => {
      try {
        const privKeyPem = localStorage.getItem('private_key');
        if (!privKeyPem) return;
        
        const privKey = await importPrivateKey(privKeyPem);
        const pubKey = await importPublicKey(activeChat.public_key);
        const secret = await deriveSharedSecret(privKey, pubKey);
        setSharedSecret(secret);
      } catch (err) {
        console.error("Failed to derive shared secret", err);
      }
    };
    deriveKey();

    // Fetch Stack Clash status
    fetchAPI(`/connections/${activeChat.user_id}/clashes`).then(data => {
      setClashes(data.clashes || []);
    });
  }, [activeChat]);

  const handleClashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clashCode.trim()) return;
    try {
      await fetchAPI(`/connections/${activeChat.id}/clash`, {
        method: 'POST',
        body: JSON.stringify({ code: clashCode })
      });
      const data = await fetchAPI(`/connections/${activeChat.user_id}/clashes`);
      setClashes(data.clashes || []);
    } catch (err) {
      alert("Failed to submit code");
    }
  };

  useEffect(() => {
    if (!activeChat || !sharedSecret) return;
    const loadMessages = async () => {
      try {
        const data = await fetchAPI(`/messages/${activeChat.user_id}`);
        const decryptedMsgs = await Promise.all(data.map(async (msg: any) => {
          try {
            const dec = await decryptMessage(msg.content, sharedSecret);
            return { ...msg, content: dec };
          } catch(e) {
             return { ...msg, content: '[Failed to decrypt]' };
          }
        }));
        setMessages(decryptedMsgs);
      } catch (err) {
        console.error(err);
      }
    };
    loadMessages();
    
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChat, sharedSecret]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeChat || !sharedSecret) return;
    
    try {
      const encryptedText = await encryptMessage(content, sharedSecret);
      const msg = await fetchAPI('/messages', {
        method: 'POST',
        body: JSON.stringify({ receiverId: activeChat.user_id, content: encryptedText })
      });
      setMessages(prev => [...prev, { ...msg, content }]);
      setContent('');
    } catch (err) {
      alert("Failed to send message");
    }
  };

  const hasISubmitted = clashes.some(c => c.user_id === user?.id);
  const hasTheySubmitted = clashes.some(c => c.user_id === activeChat?.user_id);
  const gateOpen = hasISubmitted && hasTheySubmitted;

  if (!user) return <div className="p-8 text-center mt-16 text-gray-500">Please sign in to access terminal.</div>;

  return (
    <div className="flex h-[calc(100vh-60px)] bg-[#0D1117] text-[#C9D1D9] font-sans">
      
      {/* Activity Bar (VS Code left-most narrow bar) */}
      <div className={`w-12 border-r border-[#30363D] flex-col items-center py-4 bg-[#010409] ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="w-8 h-8 rounded mb-4 flex items-center justify-center text-[#C9D1D9] bg-[#1F6FEB]/20 border-l-2 border-[#58A6FF]">
          📄
        </div>
        <div className="w-8 h-8 rounded mb-4 flex items-center justify-center text-[#8B949E] hover:text-[#C9D1D9] cursor-pointer">
          🔍
        </div>
        <div className="w-8 h-8 rounded mb-4 flex items-center justify-center text-[#8B949E] hover:text-[#C9D1D9] cursor-pointer">
          ⚙️
        </div>
      </div>

      {/* Sidebar Explorer */}
      <div className={`w-full md:w-64 border-r border-[#30363D] flex-col ultra-glass ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#8B949E]">Explorer</div>
        <div className="px-4 py-1 text-xs font-bold flex items-center gap-1 cursor-pointer">
          <span>{'>'}</span> HACKMATCH_NETWORK
        </div>
        <div className="flex-1 overflow-y-auto mt-2">
          {connections.length === 0 ? (
            <p className="text-xs text-[#8B949E] px-8">No connections established.</p>
          ) : (
            <div className="space-y-0.5">
              {connections.map(conn => (
                <button
                  key={conn.id}
                  onClick={() => setActiveChat(conn)}
                  className={`w-full text-left px-8 py-1 flex items-center gap-2 text-sm transition-colors ${
                    activeChat?.user_id === conn.user_id ? 'bg-[#373E47]/50 text-[#C9D1D9]' : 'text-[#8B949E] hover:bg-[#161B22] hover:text-[#C9D1D9]'
                  }`}
                >
                  <span className="text-[#58A6FF]">{"{ }"}</span> {conn.name.replace(/\s+/g, '_').toLowerCase()}.ts
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className={`flex-1 flex-col relative ultra-glass border-l border-white/5 ${activeChat ? 'flex' : 'hidden md:flex'}`}>
        {activeChat ? (
          <>
            {/* Editor Tabs */}
            <div className="flex bg-[#010409] border-b border-[#30363D] overflow-x-auto custom-scrollbar">
              <div className="px-4 py-2 border-r border-[#30363D] bg-[#0D1117] border-t-2 border-t-[#58A6FF] text-[#C9D1D9] flex items-center gap-2 text-sm">
                <span className="md:hidden mr-2 cursor-pointer text-[#8B949E] hover:text-[#C9D1D9]" onClick={() => setActiveChat(null)}>←</span>
                <span className="text-[#58A6FF]">{"{ }"}</span> {activeChat.name.replace(/\s+/g, '_').toLowerCase()}.ts
                <span className="ml-2 text-[#8B949E] hover:bg-[#30363D] rounded-full p-0.5 cursor-pointer" onClick={() => setActiveChat(null)}>✕</span>
              </div>
              <div className="px-4 py-2 border-r border-[#30363D] text-[#8B949E] hover:bg-[#161B22] flex items-center gap-2 text-sm cursor-pointer">
                <span>📝</span> README.md
              </div>
            </div>

            {gateOpen ? (
              <>
                {/* Messages as Code Comments */}
                <div className="flex-1 p-6 overflow-y-auto space-y-1 font-mono text-sm leading-relaxed">
                  <div className="text-[#8B949E] mb-6">
                    {`/**\n * Pair Programming Session\n * Target: ${activeChat.name}\n * Role: ${activeChat.role}\n * Status: Secure Encrypted Channel\n */`}
                  </div>

                  {messages.length === 0 ? (
                    <div className="text-[#8B949E]">// Waiting for input to initiate Pair Programming protocol...</div>
                  ) : (
                    messages.map(msg => {
                      const isMe = msg.sender_id === user.id;
                      const senderName = isMe ? 'You' : activeChat.name;
                      const color = isMe ? 'text-[#58A6FF]' : 'text-[#3FB950]';
                      
                      return (
                        <div key={msg.id} className="flex flex-col hover:bg-[#161B22] px-2 py-0.5 rounded -mx-2">
                          <div className="flex items-start gap-3">
                            <div className="w-12 text-right text-[#8B949E] select-none text-xs leading-5">
                              {/* Fake line numbers based on message id for effect */}
                              {msg.id.substring(0, 3)}
                            </div>
                            <div className="flex-1 text-[#C9D1D9]">
                              <span className={`${color} font-bold mr-2`}>
                                {isMe ? 'console.log(' : `${senderName.replace(/\s+/g, '_')} > `}
                              </span>
                              <span>
                                {isMe ? `"${msg.content}");` : msg.content}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Terminal */}
                <div className="h-48 border-t border-[#30363D] bg-[#0D1117] flex flex-col">
                  <div className="flex px-4 py-2 border-b border-[#30363D] gap-4 text-xs font-mono">
                    <span className="text-[#C9D1D9] border-b border-[#58A6FF] pb-1 cursor-pointer uppercase">Terminal</span>
                    <span className="text-[#8B949E] hover:text-[#C9D1D9] cursor-pointer uppercase">Output</span>
                    <span className="text-[#8B949E] hover:text-[#C9D1D9] cursor-pointer uppercase">Debug Console</span>
                  </div>
                  <form onSubmit={handleSend} className="flex-1 p-2 flex flex-col">
                    <div className="flex items-center gap-2 px-2 text-[#C9D1D9] font-mono text-sm">
                      <span className="text-[#3FB950]">~/hackmatch/chat</span>
                      <span className="text-[#58A6FF]">git:(master)</span>
                      <span className="text-[#8B949E]">✗</span>
                    </div>
                    <div className="flex items-center mt-1 px-2">
                      <span className="text-[#C9D1D9] font-mono text-sm mr-2">$</span>
                      <input
                        type="text"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="echo 'Your message here'"
                        className="flex-1 bg-transparent border-none outline-none text-[#C9D1D9] font-mono text-sm"
                        autoFocus
                      />
                    </div>
                    <button type="submit" className="hidden">Send</button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0D1117]">
                <div className="mb-6 text-6xl">🔒</div>
                <h2 className="text-2xl font-bold text-[#C9D1D9] mb-2 font-mono">Stack Clash Gate</h2>
                <p className="text-[#8B949E] max-w-md mb-8 font-mono text-sm">
                  /* Prove your skills to unlock direct pair programming. */
                </p>
                
                {!hasISubmitted ? (
                  <form onSubmit={handleClashSubmit} className="w-full max-w-lg bg-[#161B22] p-6 rounded-xl border border-[#30363D] text-left shadow-2xl">
                    <div className="flex gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <h3 className="text-[#58A6FF] font-mono mb-2">Challenge: Return True</h3>
                    <p className="text-xs text-[#8B949E] mb-4">Write a brief implementation to verify humanity.</p>
                    <textarea 
                      className="w-full h-32 bg-[#010409] border border-[#30363D] rounded font-mono text-[#3FB950] p-3 focus:border-[#58A6FF] outline-none mb-4 custom-scrollbar text-sm leading-relaxed"
                      placeholder="function isAlive() { return true; }"
                      value={clashCode}
                      onChange={e => setClashCode(e.target.value)}
                    />
                    <button type="submit" className="w-full py-2 bg-[#58A6FF] text-[#0D1117] font-bold rounded hover:bg-[#58A6FF]/80 transition-colors">
                      git commit -m "solution"
                    </button>
                  </form>
                ) : (
                  <div className="text-[#BC8CFF] animate-pulse font-mono bg-[#BC8CFF]/10 border border-[#BC8CFF]/30 p-6 rounded-xl">
                    Push successful. Waiting for remote ({activeChat.name}) to sync...
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-[#0D1117] text-[#8B949E] font-mono">
            <div className="text-6xl mb-4">🐱‍💻</div>
            <div>No editor open</div>
            <div className="text-xs mt-2 opacity-50">Select a connection from the Explorer to initiate pair programming</div>
          </div>
        )}
      </div>
    </div>
  );
}
