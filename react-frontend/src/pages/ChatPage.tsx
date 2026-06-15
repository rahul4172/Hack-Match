import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { useLocation } from 'react-router-dom';
import { importPrivateKey, importPublicKey, deriveSharedSecret, encryptMessage, decryptMessage } from '../lib/crypto';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

export default function ChatPage() {
  const { user } = useAuth();
  const location = useLocation();
  
  const targetUser = location.state?.targetUser;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [connections, setConnections] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(targetUser || null);
  const [sharedSecret, setSharedSecret] = useState<CryptoKey | null>(null);
  const [showSidebar, setShowSidebar] = useState(!targetUser);

  const [clashes, setClashes] = useState<any[]>([]);
  const [clashCode, setClashCode] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchAPI('/connections').then(data => {
      setConnections(data.accepted);
      if (!activeChat && data.accepted.length > 0) {
        setActiveChat(data.accepted[0]);
        setShowSidebar(false);
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

  const selectChat = (conn: any) => {
    setActiveChat(conn);
    setShowSidebar(false);
  };

  const hasISubmitted = clashes.some(c => c.user_id === user?.id);
  const hasTheySubmitted = clashes.some(c => c.user_id === activeChat?.user_id);
  const gateOpen = hasISubmitted && hasTheySubmitted;

  if (!user) return <div className="p-8 text-center mt-16 text-gray-500">Please sign in to access terminal.</div>;

  return (
    <div className="flex h-[calc(100vh-60px)] bg-[#050505] text-[#C9D1D9] font-sans overflow-hidden relative">
      {/* Background glow for the chat */}
      <div className="absolute inset-0 aurora-bg opacity-20 pointer-events-none"></div>
      
      {/* Activity Bar — always visible on desktop, hidden on mobile when chat is open */}
      <div className={`w-10 sm:w-12 border-r border-[#30363D] flex-col items-center py-4 bg-[#010409] shrink-0 ${!showSidebar && activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded mb-4 flex items-center justify-center text-[#C9D1D9] bg-[#1F6FEB]/20 border-l-2 border-[#58A6FF] text-sm">
          📄
        </div>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded mb-4 flex items-center justify-center text-[#8B949E] hover:text-[#C9D1D9] cursor-pointer text-sm">
          🔍
        </div>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded mb-4 flex items-center justify-center text-[#8B949E] hover:text-[#C9D1D9] cursor-pointer text-sm">
          ⚙️
        </div>
      </div>

      {/* Sidebar Explorer — full-screen on mobile when shown, fixed width on desktop */}
      <div className={`border-r border-[#30363D] flex-col ultra-glass ${showSidebar ? 'flex w-full md:w-64' : 'hidden md:flex md:w-64'} shrink-0 z-10`}>
        <div className="px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#8B949E]">Explorer</div>
        <div className="px-3 sm:px-4 py-1 text-xs font-bold flex items-center gap-1 cursor-pointer text-[#C9D1D9]">
          <span>{'>'}</span> HACKMATCH_NETWORK
        </div>
        <div className="flex-1 overflow-y-auto mt-2">
          {connections.length === 0 ? (
            <p className="text-xs text-[#8B949E] px-6 sm:px-8 py-4">No connections established.</p>
          ) : (
            <div className="space-y-0.5">
              {connections.map(conn => (
                <button
                  key={conn.id}
                  onClick={() => selectChat(conn)}
                  className={`w-full text-left px-6 sm:px-8 py-2 flex items-center gap-2 text-sm transition-colors ${
                    activeChat?.user_id === conn.user_id ? 'bg-[#373E47]/50 text-[#C9D1D9]' : 'text-[#8B949E] hover:bg-[#161B22] hover:text-[#C9D1D9]'
                  }`}
                >
                  <span className="text-[#58A6FF] shrink-0">{"{ }"}</span>
                  <span className="truncate">{conn.name.replace(/\s+/g, '_').toLowerCase()}.ts</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className={`flex-col relative ultra-glass border-l border-white/5 min-w-0 ${showSidebar ? 'hidden md:flex' : 'flex'} flex-1 z-10`}>
        {activeChat ? (
          <>
            {/* Editor Tabs */}
            <div className="flex bg-[#010409] border-b border-[#30363D] overflow-x-auto custom-scrollbar shrink-0">
              <div className="px-3 sm:px-4 py-2 border-r border-[#30363D] bg-[#0D1117] border-t-2 border-t-[#58A6FF] text-[#C9D1D9] flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap">
                {/* Back button on mobile */}
                <span
                  className="md:hidden mr-1 cursor-pointer text-[#8B949E] hover:text-[#C9D1D9] text-base leading-none"
                  onClick={() => setShowSidebar(true)}
                >←</span>
                <span className="text-[#58A6FF]">{"{ }"}</span>
                <span className="truncate max-w-[120px] sm:max-w-none">{activeChat.name.replace(/\s+/g, '_').toLowerCase()}.ts</span>
                <span
                  className="ml-1 text-[#8B949E] hover:bg-[#30363D] rounded-full px-1 cursor-pointer"
                  onClick={() => setShowSidebar(true)}
                >✕</span>
              </div>
              <div className="px-3 sm:px-4 py-2 border-r border-[#30363D] text-[#8B949E] hover:bg-[#161B22] flex items-center gap-2 text-xs sm:text-sm cursor-pointer whitespace-nowrap">
                <span>📝</span> README.md
              </div>
            </div>

            {gateOpen ? (
              <>
                {/* Messages as Code Comments */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-1 font-mono text-xs sm:text-sm leading-relaxed">
                  <div className="text-[#8B949E] mb-4 sm:mb-6 hidden sm:block">
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
                        <div key={msg.id} className="flex flex-col hover:bg-white/5 px-3 py-1.5 rounded-md -mx-3 transition-colors duration-200">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="w-8 sm:w-12 text-right text-[#8B949E]/50 select-none text-[10px] sm:text-xs leading-5 shrink-0">
                              {msg.id.substring(0, 3)}
                            </div>
                            <div className="flex-1 text-[#C9D1D9] min-w-0 break-words">
                              <span className={`${color} font-bold mr-1 sm:mr-2 text-glow`}>
                                {isMe ? 'console.log(' : `${senderName.replace(/\s+/g, '_')} > `}
                              </span>
                              <span className="text-white">
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
                <div className="h-36 sm:h-48 border-t border-white/10 bg-black/60 backdrop-blur-md flex flex-col shrink-0">
                  <div className="flex px-3 sm:px-4 py-2 border-b border-[#30363D] gap-3 sm:gap-4 text-xs font-mono overflow-x-auto">
                    <span className="text-[#C9D1D9] border-b border-[#58A6FF] pb-1 cursor-pointer uppercase whitespace-nowrap">Terminal</span>
                    <span className="text-[#8B949E] hover:text-[#C9D1D9] cursor-pointer uppercase whitespace-nowrap">Output</span>
                    <span className="text-[#8B949E] hover:text-[#C9D1D9] cursor-pointer uppercase whitespace-nowrap hidden sm:block">Debug Console</span>
                  </div>
                  <form onSubmit={handleSend} className="flex-1 p-2 flex flex-col">
                    <div className="flex items-center gap-2 px-2 text-[#C9D1D9] font-mono text-xs sm:text-sm">
                      <span className="text-[#3FB950] hidden sm:block">~/hackmatch/chat</span>
                      <span className="text-[#58A6FF] hidden sm:block">git:(master)</span>
                      <span className="text-[#8B949E]">✗</span>
                    </div>
                    <div className="flex items-center mt-1 px-2">
                      <span className="text-[#C9D1D9] font-mono text-xs sm:text-sm mr-2">$</span>
                      <input
                        type="text"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder="echo 'Your message here'"
                        className="flex-1 bg-transparent border-none outline-none text-[#C9D1D9] font-mono text-xs sm:text-sm min-w-0"
                        autoFocus
                      />
                      {/* Send button visible on mobile */}
                      <button
                        type="submit"
                        className="md:hidden ml-2 text-[#58A6FF] text-lg leading-none shrink-0"
                      >↵</button>
                    </div>
                    <button type="submit" className="hidden">Send</button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-transparent z-10 relative">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none"></div>
                <div className="mb-6 text-5xl sm:text-6xl text-glow z-10">🔒</div>
                <h2 className="text-xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2 font-mono z-10 drop-shadow-[0_0_15px_rgba(88,166,255,0.5)]">Stack Clash Gate</h2>
                <p className="text-[#8B949E] max-w-md mb-6 sm:mb-8 font-mono text-xs sm:text-sm px-2 z-10">
                  /* Prove your skills to unlock direct pair programming. */
                </p>
                
                {!hasISubmitted ? (
                  <form onSubmit={handleClashSubmit} className="w-full max-w-lg ultra-glass p-4 sm:p-6 rounded-2xl border border-white/10 text-left shadow-[0_0_40px_rgba(0,0,0,0.8)] z-10 transform transition-all hover:border-cyan-500/50">
                    <div className="flex gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.8)]"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                    </div>
                    <h3 className="text-[#58A6FF] font-mono mb-2 text-sm sm:text-base text-glow">Challenge: Return True</h3>
                    <p className="text-xs text-[#8B949E] mb-4">Write a brief implementation to verify humanity.</p>
                    <textarea 
                      className="w-full h-28 sm:h-32 bg-[#010409] border border-[#30363D] rounded font-mono text-[#3FB950] p-3 focus:border-[#58A6FF] outline-none mb-4 custom-scrollbar text-xs sm:text-sm leading-relaxed"
                      placeholder="function isAlive() { return true; }"
                      value={clashCode}
                      onChange={e => setClashCode(e.target.value)}
                    />
                    <button type="submit" className="w-full py-2 bg-[#58A6FF] text-[#0D1117] font-bold rounded hover:bg-[#58A6FF]/80 transition-colors text-sm">
                      git commit -m "solution"
                    </button>
                  </form>
                ) : (
                  <div className="text-[#BC8CFF] animate-pulse font-mono bg-[#BC8CFF]/10 border border-[#BC8CFF]/30 p-4 sm:p-6 rounded-xl text-sm text-center max-w-md z-10 shadow-[0_0_20px_rgba(188,140,255,0.2)] text-glow">
                    Push successful. Waiting for remote ({activeChat.name}) to sync...
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-transparent text-[#8B949E] font-mono p-6 text-center relative">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none"></div>
            <div className="text-5xl sm:text-6xl mb-4 text-glow z-10">🐱‍💻</div>
            <div className="text-sm sm:text-base z-10 text-white">No editor open</div>
            <div className="text-xs mt-2 opacity-50 max-w-xs">Select a connection from the Explorer to initiate pair programming</div>
            <button
              className="mt-6 md:hidden px-4 py-2 border border-[#30363D] rounded text-xs text-[#8B949E] hover:text-[#C9D1D9] hover:border-[#58A6FF] transition-colors"
              onClick={() => setShowSidebar(true)}
            >
              Open Explorer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
