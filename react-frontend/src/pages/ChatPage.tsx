import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store/useAuth';
import { fetchAPI } from '../lib/api';
import { useLocation } from 'react-router-dom';
import { importPrivateKey, importPublicKey, deriveSharedSecret, encryptMessage, decryptMessage } from '../lib/crypto';
import 'highlight.js/styles/github-dark.css';
import { FileText, Search, Settings, ArrowLeft, X, FileEdit, CornerDownLeft, Lock, Lightbulb, Check, Terminal } from 'lucide-react';

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
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const [clashes, setClashes] = useState<any[]>([]);
  const [clashCode, setClashCode] = useState('');
  const [challenge, setChallenge] = useState<any>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [clashError, setClashError] = useState('');
  const [clashLoading, setClashLoading] = useState(false);

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
      if (data.connectionId) setConnectionId(data.connectionId);
    });

    fetchAPI(`/connections/${activeChat.user_id}/clash/challenge`).then(data => {
      setChallenge(data.challenge);
      setConnectionId(data.connectionId);
      setShowAnswer(false);
      setClashError('');
    }).catch(() => setChallenge(null));
  }, [activeChat]);

  const handleRevealAnswer = async () => {
    if (!activeChat) return;
    try {
      const data = await fetchAPI(`/connections/${activeChat.user_id}/clash/challenge?reveal=true`);
      setChallenge(data.challenge);
      setShowAnswer(true);
    } catch {
      setShowAnswer(true);
    }
  };

  const handleClashSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clashCode.trim() || !connectionId) return;
    setClashLoading(true);
    setClashError('');
    try {
      await fetchAPI(`/connections/${connectionId}/clash`, {
        method: 'POST',
        body: JSON.stringify({ code: clashCode }),
      });
      const data = await fetchAPI(`/connections/${activeChat.user_id}/clashes`);
      setClashes(data.clashes || []);
      setClashCode('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit code';
      setClashError(msg);
    } finally {
      setClashLoading(false);
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
            const isFailed = dec.startsWith('[Encrypted message - Decryption failed');
            return { ...msg, content: dec, failed: isFailed };
          } catch(e: any) {
             return { ...msg, content: `[Encrypted message - Decryption failed: ${e.message}]`, failed: true };
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

  const filteredConnections = connections.filter(conn => 
    conn.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return <div className="p-8 text-center mt-16 text-gray-500">Please sign in to access terminal.</div>;

  return (
    <div className="flex h-[calc(100vh-60px)] bg-[#050505] text-[#C9D1D9] font-sans overflow-hidden relative">
      {/* Background glow for the chat */}
      <div className="absolute inset-0 aurora-bg opacity-20 pointer-events-none"></div>
      
      {/* Activity Bar — always visible on desktop, hidden on mobile when chat is open */}
      <div className={`w-10 sm:w-12 border-r border-[#30363D] flex-col items-center py-4 bg-[#010409] shrink-0 ${!showSidebar && activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div 
          onClick={() => { setShowSidebar(true); setShowSearch(false); }}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded mb-4 flex items-center justify-center cursor-pointer text-sm ${!showSearch ? 'text-[#C9D1D9] bg-[#1F6FEB]/20 border-l-2 border-[#58A6FF]' : 'text-[#8B949E] hover:text-[#C9D1D9]'}`}
        >
          <FileText className="w-4 h-4" />
        </div>
        <div 
          onClick={() => { setShowSidebar(true); setShowSearch(true); }}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded mb-4 flex items-center justify-center cursor-pointer text-sm ${showSearch ? 'text-[#C9D1D9] bg-[#1F6FEB]/20 border-l-2 border-[#58A6FF]' : 'text-[#8B949E] hover:text-[#C9D1D9]'}`}
        >
          <Search className="w-4 h-4" />
        </div>
        <div 
          onClick={() => setShowSettings(true)}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded mb-4 flex items-center justify-center text-[#8B949E] hover:text-[#C9D1D9] cursor-pointer text-sm mt-auto"
        >
          <Settings className="w-4 h-4" />
        </div>
      </div>

      {/* Sidebar Explorer — full-screen on mobile when shown, fixed width on desktop */}
      <div className={`border-r border-[#30363D] flex-col ultra-glass ${showSidebar ? 'flex w-full md:w-64' : 'hidden md:flex md:w-64'} shrink-0 z-10`}>
        <div className="px-3 sm:px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#8B949E]">
          {showSearch ? 'Search' : 'Explorer'}
        </div>
        
        {showSearch ? (
          <div className="px-3 sm:px-4 py-2">
            <input 
              type="text" 
              placeholder="Search connections..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#30363D] rounded px-2 py-1 text-xs text-[#C9D1D9] focus:outline-none focus:border-[#58A6FF]"
              autoFocus
            />
          </div>
        ) : (
          <div className="px-3 sm:px-4 py-1 text-xs font-bold flex items-center gap-1 cursor-pointer text-[#C9D1D9]">
            <span>{'>'}</span> HACKMATCH_NETWORK
          </div>
        )}

        <div className="flex-1 overflow-y-auto mt-2">
          {filteredConnections.length === 0 ? (
            <p className="text-xs text-[#8B949E] px-6 sm:px-8 py-4">
              {showSearch ? 'No matching connections.' : 'No connections established.'}
            </p>
          ) : (
            <div className="space-y-0.5">
              {filteredConnections.map(conn => (
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
                ><ArrowLeft className="w-4 h-4" /></span>
                <span className="text-[#58A6FF]">{"{ }"}</span>
                <span className="truncate max-w-[120px] sm:max-w-none">{activeChat.name.replace(/\s+/g, '_').toLowerCase()}.ts</span>
                <span
                  className="ml-1 text-[#8B949E] hover:bg-[#30363D] rounded-full p-1 cursor-pointer"
                  onClick={() => setShowSidebar(true)}
                ><X className="w-4 h-4" /></span>
              </div>
              <div className="px-3 sm:px-4 py-2 border-r border-[#30363D] text-[#8B949E] hover:bg-[#161B22] flex items-center gap-2 text-xs sm:text-sm cursor-pointer whitespace-nowrap">
                <FileEdit className="w-4 h-4" /> README.md
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
                              {msg.failed ? (
                                <span className="text-red-400 font-bold bg-red-900/20 px-1 py-0.5 rounded text-[10px] sm:text-xs">
                                  {msg.content}
                                </span>
                              ) : (
                                <span className="text-white">
                                  {isMe ? `"${msg.content}");` : msg.content}
                                </span>
                              )}
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
                      <span className="text-[#8B949E]"><X className="w-4 h-4" /></span>
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
                      ><CornerDownLeft className="w-4 h-4" /></button>
                    </div>
                    <button type="submit" className="hidden">Send</button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-transparent z-10 relative">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none"></div>
                <div className="mb-6 text-5xl sm:text-6xl text-glow z-10 text-cyan-400 flex items-center justify-center"><Lock className="w-16 h-16" /></div>
                <h2 className="text-xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2 font-mono z-10 drop-shadow-[0_0_15px_rgba(88,166,255,0.5)]">Stack Clash Gate</h2>
                <p className="text-[#8B949E] max-w-md mb-6 sm:mb-8 font-mono text-xs sm:text-sm px-2 z-10">
                  /* Prove your skills to unlock direct pair programming. */
                </p>
                
                {!hasISubmitted ? (
                  <form onSubmit={handleClashSubmit} className="w-full max-w-lg glass-card p-4 sm:p-6 text-left z-10 mx-2">
                    <div className="flex gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>

                    {challenge ? (
                      <>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="text-violet-400 font-display font-semibold text-base">{challenge.title}</h3>
                          <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">{challenge.language}</span>
                        </div>
                        <p className="text-sm text-slate-300 mb-2 leading-relaxed">{challenge.prompt}</p>
                        <p className="text-xs text-cyan-400/80 font-mono mb-4 flex items-center gap-1"><Lightbulb className="w-4 h-4" /> Hint: {challenge.hint}</p>

                        {showAnswer && challenge.answer && (
                          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                            <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-mono mb-2">Reference Solution</p>
                            <pre className="text-xs text-emerald-300 font-mono whitespace-pre-wrap break-all">{challenge.answer}</pre>
                          </div>
                        )}

                        <textarea
                          className="input-field font-mono text-emerald-400 h-28 sm:h-32 mb-3 resize-none"
                          placeholder="// Write your solution here..."
                          value={clashCode}
                          onChange={e => setClashCode(e.target.value)}
                          spellCheck={false}
                        />

                        {clashError && (
                          <p className="text-red-400 text-xs font-mono mb-3 p-2 bg-red-500/10 rounded-lg border border-red-500/20">{clashError}</p>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2">
                          <button type="submit" disabled={clashLoading} className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-violet-500 text-white font-display font-semibold rounded-[14px] text-sm min-h-[44px] disabled:opacity-50">
                            {clashLoading ? 'Validating...' : 'git commit -m "solution"'}
                          </button>
                          {!showAnswer && (
                            <button type="button" onClick={handleRevealAnswer} className="py-2.5 px-4 border border-white/10 text-slate-400 hover:text-white rounded-[14px] text-sm font-mono min-h-[44px] transition-colors">
                              Reveal Answer
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-600 mt-3 font-mono">Both teammates must submit valid solutions to unlock chat.</p>
                      </>
                    ) : (
                      <p className="text-slate-400 text-sm animate-pulse">Loading challenge...</p>
                    )}
                  </form>
                ) : (
                  <div className="text-violet-300 font-mono glass-card p-4 sm:p-6 text-sm text-center max-w-md z-10 mx-2">
                    <p className="mb-2 flex items-center justify-center gap-1"><Check className="w-4 h-4" /> Push successful</p>
                    <p className="text-slate-400 text-xs">Waiting for {activeChat.name} to submit their solution...</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-transparent text-[#8B949E] font-mono p-6 text-center relative">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-none"></div>
            <div className="text-5xl sm:text-6xl mb-4 text-glow z-10 text-[#8B949E] flex items-center justify-center"><Terminal className="w-16 h-16" /></div>
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
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0D1117] border border-[#30363D] rounded-xl w-full max-w-md p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-[#8B949E] hover:text-[#C9D1D9]"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-[#C9D1D9] mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#58A6FF]" /> Terminal Settings
            </h3>
            
            <div className="space-y-4">
              <div className="bg-[#161B22] p-4 rounded-lg border border-[#30363D]">
                <h4 className="text-sm font-bold text-[#C9D1D9] mb-1">E2E Encryption</h4>
                <p className="text-xs text-[#8B949E] mb-3">Your messages are encrypted end-to-end. If you log out or clear your local storage, your private key is destroyed and old messages become unrecoverable.</p>
                <div className="flex items-center gap-2 text-xs font-mono bg-black/50 p-2 rounded text-[#3FB950]">
                  <Lock className="w-3 h-3" /> Keypair Active
                </div>
              </div>
              
              <div className="bg-[#161B22] p-4 rounded-lg border border-[#30363D]">
                <h4 className="text-sm font-bold text-[#C9D1D9] mb-1">Theme</h4>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-6 h-6 rounded-full border-2 border-[#58A6FF] bg-[#0D1117]"></div>
                  <span className="text-xs text-[#8B949E]">Deep Dark (Default)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
