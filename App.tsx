
import React, { useState, useEffect, useRef } from 'react';
import { Card, Suit, Rank, Turn, GameStatistics, Difficulty, LeaderboardEntry, CardBackStyle, GameState, NetworkRole, NetworkPayload } from './types';
import { SUITS, RANKS } from './constants';
import CardComponent from './components/CardComponent';
import VictoryModal from './components/VictoryModal';
import StatsModal from './components/StatsModal';
import RulesModal from './components/RulesModal';
import SettingsModal from './components/SettingsModal';
import SuitSelector from './components/SuitSelector';
import LeaderboardModal from './components/LeaderboardModal';
import LobbyModal from './components/LobbyModal';
import RecapPanel from './components/RecapPanel';
import Confetti from './components/Confetti';
import ParticleBurst from './components/ParticleBurst';
import { SoundManager } from './utils/sound';
import { getAICommentary, getAIHint } from './services/aiService';
import { LiveService } from './services/liveService';

// --- Backgrounds (Optimized) ---
const BG_GOAT = 'url("https://images.unsplash.com/photo-1524024973431-2ad916746881?w=800&q=60")';
const BG_GIRAFFE = 'url("https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=800&q=60")';
const BG_RHINO = 'url("https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=800&q=60")';
const BG_LION = 'url("https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=800&q=60")';

// --- Avatars ---
const AVATAR_COMPUTER = 'https://images.unsplash.com/photo-1535378437327-b7107b7706ab?w=150&q=80'; // Robot
const AVATAR_WOMAN = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80';
const AVATAR_MAN = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80';

const INITIAL_STATS: GameStatistics = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalMovesInWonGames: 0,
  coins: 100, // Start with a bonus
  unlockedItems: [CardBackStyle.Classic] // Default unlocked
};

// --- SCALING CONSTANTS ---
const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

interface MotivationalSticker {
    id: number;
    emoji: string;
    text: string;
    color: string;
}

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({ suit, rank, isFaceUp: false, id: `${rank}-${suit}-${Math.random()}` });
    });
  });
  return deck;
};

const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper Component for Score Display
const ScoreBoard: React.FC<{ wins: number; losses: number }> = ({ wins, losses }) => (
  <div className="absolute top-6 left-6 bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-white shadow-2xl z-30 flex flex-col gap-1 select-none transform transition-all hover:bg-black/50 hover:scale-105">
    <div className="text-[10px] font-black text-yellow-500 uppercase tracking-widest text-center mb-1 drop-shadow-md">Lifetime Stats</div>
    <div className="flex gap-6 justify-center items-center px-1">
        <div className="flex flex-col items-center">
            <span className="text-3xl font-black text-green-400 drop-shadow-md filter">{wins}</span>
            <span className="text-[10px] font-bold text-green-100 uppercase tracking-wide">Wins</span>
        </div>
        <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
        <div className="flex flex-col items-center">
            <span className="text-3xl font-black text-red-400 drop-shadow-md filter">{losses}</span>
            <span className="text-[10px] font-bold text-red-100 uppercase tracking-wide">Losses</span>
        </div>
    </div>
  </div>
);

declare var Peer: any;

const App: React.FC = () => {
  // --- Game State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [deck, setDeck] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [computerHand, setComputerHand] = useState<Card[]>([]);
  const [turn, setTurn] = useState<Turn>(Turn.Player);
  const [activeSuit, setActiveSuit] = useState<Suit | null>(null);
  const [drawPenalty, setDrawPenalty] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Medium);
  const [history, setHistory] = useState<string[]>([]);
  
  // --- Multiplayer State ---
  const [networkRole, setNetworkRole] = useState<NetworkRole>('none');
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('');
  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);
  const activeCallRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [opponentAvatar, setOpponentAvatar] = useState(AVATAR_COMPUTER);

  // --- Voice State ---
  const [isMicActive, setIsMicActive] = useState(false);
  const liveServiceRef = useRef<LiveService | null>(null);

  // --- Customization State ---
  const [cardBack, setCardBack] = useState<CardBackStyle>(() => {
    return (localStorage.getItem('matatu-card-back') as CardBackStyle) || CardBackStyle.Classic;
  });
  const [autoChangeBack, setAutoChangeBack] = useState<boolean>(() => {
    const stored = localStorage.getItem('matatu-auto-back');
    return stored === null ? true : stored === 'true';
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
      return localStorage.getItem('matatu-muted') === 'true';
  });

  // --- UI State ---
  const [showStats, setShowStats] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLobby, setShowLobby] = useState(false);
  const [showSuitSelector, setShowSuitSelector] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const [winner, setWinner] = useState<'player' | 'computer' | null>(null);
  const [toast, setToast] = useState<{msg: string, emoji: string, visible: boolean}>({msg:'', emoji: '🦁', visible:false});
  const [turnCount, setTurnCount] = useState(0);
  const [bgImage, setBgImage] = useState<string | null>(null); // Null means use default Papyrus CSS
  const [isDrawAnimating, setIsDrawAnimating] = useState(false);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [activeSticker, setActiveSticker] = useState<MotivationalSticker | null>(null);
  
  // --- AI Feature State ---
  const [aiCommentary, setAiCommentary] = useState<string>('');
  const [hintMessage, setHintMessage] = useState<string | null>(null);
  const [isGettingHint, setIsGettingHint] = useState(false);

  // --- Drag & Drop State ---
  const [draggingCard, setDraggingCard] = useState<Card | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  
  // New state for invalid move return animation
  const [returningCard, setReturningCard] = useState<{
      card: Card;
      startPos: { x: number; y: number };
      targetPos: { x: number; y: number };
  } | null>(null);

  const [isOverDiscard, setIsOverDiscard] = useState(false);
  const dragStartRef = useRef<{x: number, y: number} | null>(null);
  const dragOffsetRef = useRef({x: 0, y: 0});
  // Store the initial client rect of the card being dragged to animate it back
  const dragOriginalRectRef = useRef<{x: number, y: number} | null>(null);
  const discardPileRef = useRef<HTMLDivElement>(null);
  
  // --- Scaling State ---
  const [scale, setScale] = useState(1);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  
  // --- Timer State ---
  const startTimeRef = useRef<number>(0);
  const [gameDuration, setGameDuration] = useState(0);

  // --- Stats Persistence ---
  const [stats, setStats] = useState<GameStatistics>(() => {
    const stored = localStorage.getItem('matatu-stats');
    if (stored) {
        const parsed = JSON.parse(stored);
        return {
            ...INITIAL_STATS,
            ...parsed,
            coins: parsed.coins ?? 100,
            unlockedItems: parsed.unlockedItems ?? [CardBackStyle.Classic]
        };
    }
    return INITIAL_STATS;
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const stored = localStorage.getItem('matatu-leaderboard');
    return stored ? JSON.parse(stored) : [];
  });

  // Calculate derived stats for display
  const wins = stats.gamesWon;
  const losses = stats.gamesPlayed - stats.gamesWon;

  // --- Auto Resize Logic ---
  useEffect(() => {
    const handleResize = () => {
        if (!gameAreaRef.current) return;
        const { clientWidth, clientHeight } = gameAreaRef.current;
        
        const scaleX = clientWidth / GAME_WIDTH;
        const scaleY = clientHeight / GAME_HEIGHT;
        const newScale = Math.min(scaleX, scaleY, 1.2); 
        
        setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    const t = setTimeout(handleResize, 100);
    return () => {
        window.removeEventListener('resize', handleResize);
        clearTimeout(t);
    };
  }, []);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('matatu-card-back', cardBack);
  }, [cardBack]);

  useEffect(() => {
    localStorage.setItem('matatu-auto-back', String(autoChangeBack));
  }, [autoChangeBack]);

  useEffect(() => {
    localStorage.setItem('matatu-muted', String(isMuted));
    SoundManager.muted = isMuted;
  }, [isMuted]);
  
  useEffect(() => {
      localStorage.setItem('matatu-stats', JSON.stringify(stats));
  }, [stats]);

  // --- Avatar Selection ---
  useEffect(() => {
    if (networkRole === 'none') {
        setOpponentAvatar(AVATAR_COMPUTER);
    } else {
        // Randomly assign a Male or Female avatar for the opponent
        // Use a consistent choice if possible (e.g. based on peerId length), but random is fine for now
        setOpponentAvatar(Math.random() > 0.5 ? AVATAR_WOMAN : AVATAR_MAN);
    }
  }, [networkRole]);

  // --- Voice Cleanup ---
  useEffect(() => {
      return () => {
          if (liveServiceRef.current) liveServiceRef.current.disconnect();
          if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
      };
  }, []);

  // --- AI Timer ---
  useEffect(() => {
    if (networkRole === 'none' && isPlaying && turn === Turn.Computer && !winner) {
      setIsComputerThinking(true);
      const delay = difficulty === Difficulty.Easy ? 800 : 1200; 
      const timer = setTimeout(() => {
        playComputerTurn();
        setIsComputerThinking(false);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setIsComputerThinking(false);
    }
  }, [turn, isPlaying, winner, networkRole, turnCount]);

  // --- Background Progression & Toast Logic ---
  const showToast = (msg: string, emoji: string = 'ℹ️', speak = false) => {
      setToast({ msg, emoji, visible: true });
      if (speak && !isMicActive) SoundManager.speak(msg);
      setTimeout(() => setToast({msg: '', emoji: '🦁', visible: false}), 2500);
  };
  
  const triggerSticker = (specificEmoji?: string) => {
      const stickers = [
          { emoji: '🦁', text: 'BE A HUNTER', color: 'text-yellow-400' },
          { emoji: '🐅', text: 'GO WILD', color: 'text-orange-400' },
          { emoji: '🦓', text: 'EARN STRIPES', color: 'text-white' },
          { emoji: '🐺', text: 'LAUGH LAST', color: 'text-gray-300' },
          { emoji: '⚡', text: 'POWER MOVER', color: 'text-blue-400' },
          { emoji: '🔥', text: 'ON FIRE', color: 'text-red-500' },
      ];
      
      let selected;
      if (specificEmoji) {
           selected = stickers.find(s => s.emoji === specificEmoji) || stickers[0];
      } else {
           selected = stickers[Math.floor(Math.random() * stickers.length)];
      }

      setActiveSticker({ ...selected, id: Date.now() });
      SoundManager.playFlipSound(); 
      
      setTimeout(() => setActiveSticker(null), 3000);
  };

  useEffect(() => {
    let newBg = null;
    let triggerMsg = '';
    let triggerEmoji = '';

    if (winner === 'player') {
        newBg = BG_LION;
        if (bgImage !== BG_LION) {
            triggerMsg = "Wao you Lion!";
            triggerEmoji = "🦁";
        }
    } else if (turnCount >= 40) {
        newBg = BG_RHINO;
        if (bgImage !== BG_RHINO) {
            triggerMsg = "Tough as a Rhino!";
            triggerEmoji = "🦏";
        }
    } else if (turnCount >= 15) {
        newBg = BG_GIRAFFE;
        if (bgImage !== BG_GIRAFFE) {
            triggerMsg = "Standing Tall!";
            triggerEmoji = "🦒";
        }
    } else if (turnCount >= 5) {
        newBg = BG_GOAT;
        if (bgImage !== BG_GOAT) {
            triggerMsg = "You Goat!";
            triggerEmoji = "🐐";
        }
    }

    if (newBg !== bgImage) {
        setBgImage(newBg);
        if (triggerMsg && networkRole === 'none') {
            showToast(triggerMsg, triggerEmoji, true);
        }
    }
  }, [turnCount, winner, bgImage, networkRole]);

  // --- AI Commentary Trigger ---
  const triggerCommentary = async (action: 'play' | 'draw' | 'win' | 'lose' | 'penalty', card?: Card) => {
    if (isMicActive) return;
    if (networkRole !== 'none') return;
    
    setAiCommentary('');
    const text = await getAICommentary(action, card, playerHand.length);
    if (text) {
      setAiCommentary(text);
      setTimeout(() => setAiCommentary(''), 5000);
    }
  };
  
  const handleGetHint = async () => {
    if (isGettingHint || !isPlaying) return;
    if (turn !== Turn.Player) {
       setHintMessage("Wait for your turn!");
       setTimeout(() => setHintMessage(null), 2000);
       return;
    }

    setIsGettingHint(true);
    setHintMessage("Thinking...");
    
    const top = discardPile[discardPile.length - 1];
    const validMoves = playerHand.filter(c => isValidMove(c, top, activeSuit, drawPenalty));
    const hint = await getAIHint(playerHand, top, activeSuit, validMoves);
    
    setHintMessage(hint);
    setIsGettingHint(false);
  };

  // --- Voice Interaction Logic ---
  const toggleMic = async () => {
      if (isMicActive) {
          setIsMicActive(false);
          if (liveServiceRef.current) {
              liveServiceRef.current.disconnect();
              liveServiceRef.current = null;
          }
          if (activeCallRef.current) activeCallRef.current.close();
          if (localStreamRef.current) {
              localStreamRef.current.getTracks().forEach(t => t.stop());
              localStreamRef.current = null;
          }
      } else {
          try {
              if (networkRole === 'none') {
                  liveServiceRef.current = new LiveService();
                  await liveServiceRef.current.connect((status) => {
                      if (status) setIsMicActive(true);
                      else {
                           setIsMicActive(false);
                           showToast("Live Connection Failed", '⚠️');
                      }
                  });
              } else {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                  localStreamRef.current = stream;
                  setIsMicActive(true);
                  if (connRef.current && connRef.current.peer) {
                      const call = peerRef.current.call(connRef.current.peer, stream);
                      activeCallRef.current = call;
                      call.on('stream', (remoteStream: MediaStream) => {
                          if (remoteAudioRef.current) {
                              remoteAudioRef.current.srcObject = remoteStream;
                              remoteAudioRef.current.play();
                          }
                      });
                  }
              }
          } catch (e) {
              console.error(e);
              showToast("Microphone Error", '🎤');
          }
      }
  };

  // --- Network Logic ---
  const initPeer = () => {
      if (peerRef.current) peerRef.current.destroy();
      const peer = new Peer(null, { debug: 2 });
      peer.on('open', (id: string) => setPeerId(id));
      peer.on('connection', (conn: any) => {
          setConnectionStatus('Connected to Opponent!');
          connRef.current = conn;
          setNetworkRole('host');
          setupConnectionEvents(conn);
          setShowLobby(false);
          setTimeout(() => startGame(), 500);
      });
      peer.on('call', (call: any) => {
          navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then((stream) => {
                localStreamRef.current = stream;
                call.answer(stream);
                activeCallRef.current = call;
                setIsMicActive(true);
                call.on('stream', (remoteStream: MediaStream) => {
                    if (remoteAudioRef.current) {
                        remoteAudioRef.current.srcObject = remoteStream;
                        remoteAudioRef.current.play();
                    }
                });
            })
            .catch((err) => console.error('Failed to get local stream', err));
      });
      peer.on('disconnected', () => { if (!peer.destroyed) peer.reconnect(); });
      peer.on('close', () => { setPeerId(null); setConnectionStatus(''); setNetworkRole('none'); });
      peer.on('error', (err: any) => console.error('PeerJS Error:', err));
      peerRef.current = peer;
  };

  const connectToPeer = (id: string) => {
      if (!peerRef.current) return;
      setConnectionStatus('Connecting...');
      const conn = peerRef.current.connect(id);
      conn.on('open', () => {
          setConnectionStatus('Connected!');
          connRef.current = conn;
          setNetworkRole('guest');
          setupConnectionEvents(conn);
          setShowLobby(false);
      });
  };

  const setupConnectionEvents = (conn: any) => {
      conn.on('data', (data: NetworkPayload) => {
          if (data.type === 'SYNC' && data.state) {
              setDeck(data.state.deck);
              setDiscardPile(data.state.discardPile);
              setPlayerHand(data.state.playerHand);
              setComputerHand(data.state.computerHand);
              setTurn(data.state.turn);
              setActiveSuit(data.state.activeSuit);
              setDrawPenalty(data.state.drawPenalty);
              setTurnCount(data.state.turnCount);
              setIsPlaying(true);
              if (data.state.winner) {
                   setWinner(data.state.winner);
                   setIsPlaying(false);
                   SoundManager.playWinSound();
              } else {
                   setWinner(null);
              }
          }
          else if (data.type === 'MOVE' && data.move) {
              handleRemoteMove(data.move);
          }
      });
      conn.on('close', () => {
          setConnectionStatus('Opponent Disconnected');
          setIsPlaying(false);
          setNetworkRole('none');
          alert("Opponent disconnected.");
      });
  };

  const broadcastState = (overrideState?: Partial<GameState>) => {
      if (networkRole !== 'host' || !connRef.current) return;
      const currentState: GameState = {
          deck, discardPile, playerHand, computerHand, turn, activeSuit, drawPenalty, turnCount, winner, ...overrideState 
      };
      connRef.current.send({ type: 'SYNC', state: currentState });
  };

  useEffect(() => {
      if (networkRole === 'host' && isPlaying) {
          const t = setTimeout(() => broadcastState(), 50);
          return () => clearTimeout(t);
      }
  }, [deck, discardPile, playerHand, computerHand, turn, activeSuit, drawPenalty, winner]);

  const handleRemoteMove = (move: { action: string, cardId?: string, suit?: Suit }) => {
      if (networkRole !== 'host') return;
      if (move.action === 'play' && move.cardId) {
          const card = computerHand.find(c => c.id === move.cardId);
          if (card) {
               playCard(card, computerHand, Turn.Computer);
               if (move.suit) {
                   setActiveSuit(move.suit);
                   setTurn(Turn.Player);
               }
          }
      } 
      else if (move.action === 'draw') handleDrawButton(true);
  };

  // --- Game Logic ---

  const getRandomCardBack = (current: CardBackStyle): CardBackStyle => {
      const availableStyles = stats.unlockedItems.filter(s => s !== current);
      const pool = availableStyles.length > 0 ? availableStyles : [current];
      return pool[Math.floor(Math.random() * pool.length)];
  };

  const saveHistory = () => {
    if (networkRole !== 'none') return;
    const currentState: GameState = {
        deck: JSON.parse(JSON.stringify(deck)),
        discardPile: JSON.parse(JSON.stringify(discardPile)),
        playerHand: JSON.parse(JSON.stringify(playerHand)),
        computerHand: JSON.parse(JSON.stringify(computerHand)),
        turn,
        activeSuit,
        drawPenalty,
        turnCount
    };
    setHistory(prev => [...prev, JSON.stringify(currentState)]);
  };

  const handleUndo = () => {
      if (history.length === 0 || networkRole !== 'none') return;
      const previousStateString = history[history.length - 1];
      const previousState: GameState = JSON.parse(previousStateString);
      setDeck(previousState.deck);
      setDiscardPile(previousState.discardPile);
      setPlayerHand(previousState.playerHand);
      setComputerHand(previousState.computerHand);
      setTurn(previousState.turn);
      setActiveSuit(previousState.activeSuit);
      setDrawPenalty(previousState.drawPenalty);
      setTurnCount(previousState.turnCount);
      setHistory(prev => prev.slice(0, -1));
      setToast({msg: '', emoji: '🦁', visible: false});
      SoundManager.playDrawSound();
  };

  const startGame = () => {
    if (autoChangeBack) setCardBack(prev => getRandomCardBack(prev));
    const newDeck = shuffleDeck(createDeck());
    const pHand = newDeck.splice(0, 7).map(c => ({...c, isFaceUp: true}));
    const cHand = newDeck.splice(0, 7).map(c => ({...c, isFaceUp: networkRole === 'none' ? false : true}));
    
    let startCard = newDeck.pop()!;
    startCard.isFaceUp = true;
    
    const initialState = {
        deck: newDeck,
        playerHand: pHand,
        computerHand: cHand,
        discardPile: [startCard],
        turn: Turn.Player,
        activeSuit: null,
        drawPenalty: startCard.rank === Rank.Two ? 2 : 0,
        turnCount: 0,
        winner: null
    };

    setDeck(initialState.deck);
    setPlayerHand(initialState.playerHand);
    setComputerHand(initialState.computerHand);
    setDiscardPile(initialState.discardPile);
    setTurn(initialState.turn);
    setActiveSuit(initialState.activeSuit);
    setDrawPenalty(initialState.drawPenalty);
    setWinner(null);
    setTurnCount(0);
    setHistory([]);
    setIsPlaying(true);
    setBgImage(null); // Reset to Papyrus
    setAiCommentary('');
    setHintMessage(null);
    setIsComputerThinking(false);
    setActiveSticker(null);
    
    startTimeRef.current = Date.now();
    setGameDuration(0);
    SoundManager.playFlipSound();
    if (networkRole === 'host') broadcastState({ ...initialState, winner: undefined }); 
  };

  const goHome = () => {
    setWinner(null);
    setIsPlaying(false);
    setBgImage(null); // Reset to Papyrus
    setAiCommentary('');
    setHintMessage(null);
    setIsComputerThinking(false);
    if (isMicActive) toggleMic();
  };

  const drawCard = (target: Turn, count = 1) => {
      if (target === Turn.Player) setIsDrawAnimating(true);
      setTimeout(() => setIsDrawAnimating(false), 200);

      let currentDeck = [...deck];
      let currentDiscard = [...discardPile];
      let drawn: Card[] = [];

      if (currentDeck.length === 0) {
          if (currentDiscard.length <= 1) return []; 
          const top = currentDiscard[currentDiscard.length - 1];
          const rest = currentDiscard.slice(0, currentDiscard.length - 1);
          const newDeck = shuffleDeck(rest).map(c => ({...c, isFaceUp: false}));
          currentDeck = newDeck;
          currentDiscard = [top];
      }

      drawn = currentDeck.splice(0, count);
      drawn.forEach(c => c.isFaceUp = true); 

      setDeck(currentDeck);
      setDiscardPile(currentDiscard);

      if (target === Turn.Player) setPlayerHand(prev => [...prev, ...drawn]);
      else setComputerHand(prev => [...prev, ...drawn]);
      
      SoundManager.playDrawSound();
      return drawn;
  };

  const handleDrawButton = (isRemoteGuest = false) => {
      setHintMessage(null);
      const activeRole = isRemoteGuest ? Turn.Computer : Turn.Player;
      if (networkRole === 'guest' && !isRemoteGuest) {
          if (turn === Turn.Computer && connRef.current) connRef.current.send({ type: 'MOVE', move: { action: 'draw' }});
          return;
      }
      if (networkRole === 'none' && turn !== Turn.Player) return;
      if (networkRole === 'host' && turn !== activeRole) return;
      if (networkRole === 'none') saveHistory();
      
      const nextTurn = activeRole === Turn.Player ? Turn.Computer : Turn.Player;
      if (drawPenalty > 0) {
          drawCard(activeRole, drawPenalty);
          if (activeRole === Turn.Player) triggerCommentary('penalty');
          setDrawPenalty(0);
          setTurn(nextTurn);
          showToast(`Took penalty! Drew ${drawPenalty} cards.`, '⚠️');
      } else {
          drawCard(activeRole, 1);
          if (activeRole === Turn.Player && Math.random() < 0.3) triggerCommentary('draw');
          setTurn(nextTurn);
      }
  };

  const isValidMove = (card: Card, topCard: Card, currentActiveSuit: Suit | null, currentPenalty: number) => {
      if (card.rank === Rank.Jack) return true;
      if (currentPenalty > 0) return card.rank === Rank.Two;
      const targetSuit = currentActiveSuit || topCard.suit;
      if (card.suit === targetSuit) return true;
      if (card.rank === topCard.rank) return true;
      return false;
  };

  const playCard = (card: Card, hand: Card[], who: Turn) => {
      const newHand = hand.filter(c => c.id !== card.id);
      
      if (who === Turn.Player) {
          setHintMessage(null); 
          triggerCommentary('play', card);
          const isPowerCard = card.rank === Rank.Jack || card.rank === Rank.Two || card.rank === Rank.Eight;
          const isLastOne = newHand.length === 1;
          if (isPowerCard) triggerSticker(card.rank === Rank.Jack ? '🐅' : (card.rank === Rank.Eight ? '🐺' : '⚡'));
          else if (isLastOne) triggerSticker('🔥');
          else if (Math.random() < 0.1) triggerSticker();
      }

      card.isFaceUp = true; 
      setDiscardPile(prev => [...prev, card]);
      
      if (who === Turn.Player) setPlayerHand(newHand);
      else setComputerHand(newHand);

      SoundManager.playDropSound();
      if (who === Turn.Player) SoundManager.playPlayerMoveSound();
      else {
          SoundManager.playComputerMoveSound();
          SoundManager.playFlipSound(); 
      }

      setTurnCount(c => c + 1);

      if (newHand.length === 0) {
          handleWin(who);
          return;
      }

      let nextTurn = who === Turn.Player ? Turn.Computer : Turn.Player;
      if (card.rank === Rank.Jack) {
          if (who === Turn.Player) {
              if (networkRole === 'host' || networkRole === 'none') {
                  setShowSuitSelector(true);
                  return; 
              }
          } else {
              if (networkRole === 'none') {
                  const suitCounts = { [Suit.Hearts]: 0, [Suit.Diamonds]: 0, [Suit.Clubs]: 0, [Suit.Spades]: 0 };
                  computerHand.forEach(c => suitCounts[c.suit]++);
                  const bestSuit = Object.keys(suitCounts).reduce((a, b) => suitCounts[a as Suit] > suitCounts[b as Suit] ? a : b) as Suit;
                  setActiveSuit(bestSuit);
                  showToast(`Opponent chose ${bestSuit}`, '🃏');
                  setTurn(Turn.Player);
                  return;
              } else if (networkRole === 'host') return; 
          }
      } 
      else if (card.rank === Rank.Eight) {
          showToast("Skipped!", '🚫');
          nextTurn = who;
      } 
      else if (card.rank === Rank.Two) setDrawPenalty(p => p + 2);

      setActiveSuit(null);
      setTurn(nextTurn);
  };

  // --- Drag & Drop Handlers ---

  const handlePointerDown = (e: React.PointerEvent, card: Card) => {
    const isMyTurn = (networkRole === 'guest' && turn === Turn.Computer) || 
                     (networkRole !== 'guest' && turn === Turn.Player);
    
    if (winner || !isMyTurn) return;

    e.preventDefault();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragOffsetRef.current = { x: offsetX, y: offsetY };
    // Capture the original position of the card so we can animate back if needed
    dragOriginalRectRef.current = { x: rect.left, y: rect.top };
    
    setDraggingCard(null); 
    
    const onPointerMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - dragStartRef.current!.x;
        const dy = moveEvent.clientY - dragStartRef.current!.y;
        
        if (!draggingCard && Math.sqrt(dx*dx + dy*dy) > 10) {
            setDraggingCard(card);
            SoundManager.playDragSound();
        }

        if (draggingCard || Math.sqrt(dx*dx + dy*dy) > 10) {
             setDragPos({
                 x: moveEvent.clientX - dragOffsetRef.current.x,
                 y: moveEvent.clientY - dragOffsetRef.current.y
             });

             if (discardPileRef.current) {
                 const discardRect = discardPileRef.current.getBoundingClientRect();
                 const mx = moveEvent.clientX;
                 const my = moveEvent.clientY;
                 
                 if (mx >= discardRect.left && mx <= discardRect.right &&
                     my >= discardRect.top && my <= discardRect.bottom) {
                     setIsOverDiscard(true);
                 } else {
                     setIsOverDiscard(false);
                 }
             }
        }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
        const dx = upEvent.clientX - dragStartRef.current!.x;
        const dy = upEvent.clientY - dragStartRef.current!.y;
        const wasDrag = Math.sqrt(dx*dx + dy*dy) > 10;
        
        if (wasDrag) {
            if (discardPileRef.current) {
                 const discardRect = discardPileRef.current.getBoundingClientRect();
                 const mx = upEvent.clientX;
                 const my = upEvent.clientY;
                 
                 if (mx >= discardRect.left && mx <= discardRect.right &&
                     my >= discardRect.top && my <= discardRect.bottom) {
                     handleDropPlay(card);
                     setDraggingCard(null); // Success, remove drag overlay immediately
                 } else {
                     // Invalid drop location, trigger return animation
                     SoundManager.playDrawSound();
                     const currentX = upEvent.clientX - dragOffsetRef.current.x;
                     const currentY = upEvent.clientY - dragOffsetRef.current.y;
                     const target = dragOriginalRectRef.current || { x: currentX, y: currentY };
                     
                     setReturningCard({
                         card,
                         startPos: { x: currentX, y: currentY },
                         targetPos: target
                     });
                     setDraggingCard(null);
                     
                     // Clear return animation after transition
                     setTimeout(() => {
                         setReturningCard(null);
                     }, 300); // Match CSS transition duration
                 }
            }
        } else {
            handleCardClick(card);
            setDraggingCard(null);
        }

        setIsOverDiscard(false);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleCardClick = (card: Card) => attemptPlayMove(card);
  const handleDropPlay = (card: Card) => attemptPlayMove(card);

  const attemptPlayMove = (card: Card) => {
      if (networkRole === 'guest') {
          if (turn !== Turn.Computer) return;
          const top = discardPile[discardPile.length - 1];
          if (isValidMove(card, top, activeSuit, drawPenalty)) {
              if (card.rank === Rank.Jack) setShowSuitSelector(true); 
              else connRef.current?.send({ type: 'MOVE', move: { action: 'play', cardId: card.id } });
          } else SoundManager.playDrawSound();
          return;
      }
      if (turn !== Turn.Player) return;
      const top = discardPile[discardPile.length - 1];
      if (isValidMove(card, top, activeSuit, drawPenalty)) {
          if (networkRole === 'none') saveHistory();
          playCard(card, playerHand, Turn.Player);
      } else SoundManager.playDrawSound();
  };

  const handleSuitSelect = (suit: Suit) => {
      setShowSuitSelector(false);
      if (networkRole === 'guest') {
          const jack = computerHand.find(c => c.rank === Rank.Jack); 
          if (jack) connRef.current?.send({ type: 'MOVE', move: { action: 'play', cardId: jack.id, suit: suit } });
      } else {
           setActiveSuit(suit);
           setTurn(Turn.Computer);
           if (networkRole === 'host') broadcastState({ activeSuit: suit, turn: Turn.Computer });
      }
  };

  const playComputerTurn = () => {
      if (winner || networkRole !== 'none') return;
      const top = discardPile[discardPile.length - 1];
      let selectedMove: Card | null = null;
      
      const getBestSuit = (hand: Card[]) => {
          const counts = { [Suit.Hearts]: 0, [Suit.Diamonds]: 0, [Suit.Clubs]: 0, [Suit.Spades]: 0 };
          hand.forEach(c => counts[c.suit]++);
          return Object.keys(counts).reduce((a, b) => counts[a as Suit] > counts[b as Suit] ? a : b) as Suit;
      };

      if (drawPenalty > 0) {
          const two = computerHand.find(c => c.rank === Rank.Two);
          if (two) {
              showToast("Computer stacked +2!", '💥');
              playCard(two, computerHand, Turn.Computer);
              return;
          } else {
              drawCard(Turn.Computer, drawPenalty);
              setDrawPenalty(0);
              setTurn(Turn.Player);
              showToast(`Computer took +${drawPenalty}`, '🤣');
              return;
          }
      }
      const validMoves = computerHand.filter(c => isValidMove(c, top, activeSuit, 0));
      if (validMoves.length === 0) {
          drawCard(Turn.Computer, 1);
          setTurn(Turn.Player);
          return;
      }

      if (difficulty === Difficulty.Easy) {
          selectedMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      } 
      else if (difficulty === Difficulty.Medium) {
          validMoves.sort((a, b) => {
              if (a.rank === Rank.Eight) return -1;
              if (b.rank === Rank.Two) return -1;
              if (a.rank === Rank.Jack) return 1;
              return 0;
          });
          selectedMove = validMoves[0];
      }
      else if (difficulty === Difficulty.Hard) {
          if (validMoves.length >= 1 && computerHand.length === 1) selectedMove = validMoves[0];
          else {
              const bestSuit = getBestSuit(computerHand);
              const nonJacks = validMoves.filter(c => c.rank !== Rank.Jack);
              const candidates = nonJacks.length > 0 ? nonJacks : validMoves;
              candidates.sort((a, b) => {
                  let scoreA = 0, scoreB = 0;
                  if (a.rank === Rank.Eight) scoreA += 20;
                  if (b.rank === Rank.Eight) scoreB += 20;
                  if (a.rank === Rank.Two) scoreA += 15;
                  if (b.rank === Rank.Two) scoreB += 15;
                  if (a.suit === bestSuit) scoreA += 5;
                  if (b.suit === bestSuit) scoreB += 5;
                  return scoreB - scoreA;
              });
              selectedMove = candidates[0];
          }
      }
      if (selectedMove) playCard(selectedMove, computerHand, Turn.Computer);
  };

  const handleWin = (who: Turn) => {
      let winnerName: 'player' | 'computer' = 'player';
      if (who === Turn.Player) {
          winnerName = 'player';
          triggerCommentary('win');
          triggerSticker('🦁');
      }
      else {
          winnerName = 'computer';
          triggerCommentary('lose');
      }
      setWinner(winnerName);
      setIsPlaying(false);
      SoundManager.playWinSound();
      
      const endTime = Date.now();
      const duration = Math.floor((endTime - startTimeRef.current) / 1000);
      setGameDuration(duration);

      const amIWinner = (networkRole === 'none' && who === Turn.Player) || 
                        (networkRole === 'host' && who === Turn.Player) ||
                        (networkRole === 'guest' && who === Turn.Computer);

      if (amIWinner) {
          setStats(prev => {
              const newStats = {
                  ...prev,
                  gamesPlayed: prev.gamesPlayed + 1,
                  gamesWon: prev.gamesWon + 1,
                  currentStreak: prev.currentStreak + 1,
                  longestStreak: Math.max(prev.longestStreak, prev.currentStreak + 1),
                  totalMovesInWonGames: (prev.totalMovesInWonGames || 0) + turnCount,
                  coins: (prev.coins || 0) + 50 
              };
              localStorage.setItem('matatu-stats', JSON.stringify(newStats));
              return newStats;
          });
          showToast("+50 Coins Earned!", "💰");
      } else {
           setStats(prev => {
              const newStats = {
                  ...prev,
                  gamesPlayed: prev.gamesPlayed + 1,
                  currentStreak: 0,
                  coins: (prev.coins || 0) + 10 
              };
              localStorage.setItem('matatu-stats', JSON.stringify(newStats));
              return newStats;
          });
          showToast("+10 Coins for playing", "🪙");
      }
  };

  const saveLeaderboardEntry = (name: string) => {
      const amIWinner = (networkRole === 'none' && winner === 'player') || 
                        (networkRole === 'host' && winner === 'player') ||
                        (networkRole === 'guest' && winner === 'computer');
      if (amIWinner) {
          const newEntry: LeaderboardEntry = {
              id: Date.now().toString(),
              playerName: name,
              time: gameDuration,
              moves: turnCount,
              difficulty: networkRole !== 'none' ? Difficulty.Hard : difficulty, 
              date: new Date().toISOString(),
              isOnline: networkRole !== 'none'
          };
          const newLeaderboard = [...leaderboard, newEntry]
              .sort((a, b) => a.time - b.time || a.moves - b.moves)
              .slice(0, 50);
          setLeaderboard(newLeaderboard);
          localStorage.setItem('matatu-leaderboard', JSON.stringify(newLeaderboard));
      }
  };

  const handleVictoryClose = (playerName: string, action: 'new' | 'home') => {
      saveLeaderboardEntry(playerName);
      if (action === 'new') {
          if (networkRole !== 'none') {
             if (networkRole === 'host') startGame();
             else showToast("Waiting for Host to restart...", '⏳');
          } else startGame();
      }
      else goHome();
  };

  const getHandStyle = (index: number, total: number, isPlayer: boolean) => {
      // Improved Fanning Logic
      const maxWidth = 700; 
      const baseSpread = 45;
      const spread = Math.min(baseSpread, maxWidth / total);
      
      const arcStrength = total > 5 ? 7 : 4; 
      const center = (total - 1) / 2;
      const x = (index - center) * spread;
      const rotate = (index - center) * arcStrength;
      const y = Math.abs(index - center) * (total > 5 ? 5 : 3) + (total > 8 ? 15 : 0); 

      return {
          transform: `translateX(${x}px) translateY(${y}px) rotate(${rotate}deg)`,
          zIndex: index,
          transformOrigin: isPlayer ? 'center bottom' : 'center top'
      };
  };

  const myHand = networkRole === 'guest' ? computerHand : playerHand;
  const oppHand = networkRole === 'guest' ? playerHand : computerHand;
  
  const isMyTurn = (networkRole === 'guest' && turn === Turn.Computer) || 
                   (networkRole !== 'guest' && turn === Turn.Player);

  // Background Styles for Papyrus Mat
  const papyrusStyle = {
      backgroundColor: '#e3d5b0', 
      backgroundImage: `
          repeating-linear-gradient(45deg, #d4c5a0 25%, transparent 25%, transparent 75%, #d4c5a0 75%, #d4c5a0), 
          repeating-linear-gradient(45deg, #d4c5a0 25%, #e3d5b0 25%, #e3d5b0 75%, #d4c5a0 75%, #d4c5a0)
      `,
      backgroundPosition: '0 0, 10px 10px',
      backgroundSize: '20px 20px',
      boxShadow: 'inset 0 0 100px rgba(0,0,0,0.3)' 
  };

  return (
    <div 
        className="w-screen h-screen flex overflow-hidden font-sans bg-cover bg-center transition-all duration-500 relative"
        style={bgImage ? { backgroundImage: bgImage } : papyrusStyle}
    >
      <audio ref={remoteAudioRef} autoPlay className="hidden" />

      {/* Modals */}
      {winner === 'player' && <Confetti />}
      {winner && (
          <VictoryModal 
            moves={turnCount} 
            time={gameDuration} 
            onNewGame={(name) => handleVictoryClose(name, 'new')} 
            onHome={(name) => handleVictoryClose(name, 'home')}
            winner={winner}
          />
      )}
      {showStats && <StatsModal stats={stats} onClose={() => setShowStats(false)} />}
      {showLeaderboard && (
          <LeaderboardModal 
            entries={leaderboard} 
            stats={stats} 
            onClose={() => setShowLeaderboard(false)} 
          />
      )}
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      {showSuitSelector && <SuitSelector onSelect={handleSuitSelect} />}
      <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          cardBack={cardBack}
          setCardBack={setCardBack}
          autoChangeBack={autoChangeBack}
          setAutoChangeBack={setAutoChangeBack}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          stats={stats}
          updateStats={setStats}
          onShowToast={showToast}
      />
      <RecapPanel 
         isOpen={showRecap} 
         onClose={() => setShowRecap(false)} 
         discardPile={discardPile}
         cardBack={cardBack}
      />
      <LobbyModal 
         isOpen={showLobby}
         onClose={() => setShowLobby(false)}
         onHost={initPeer}
         onJoin={connectToPeer}
         onPlayAI={() => {
             setShowLobby(false);
             setNetworkRole('none');
             startGame();
         }}
         peerId={peerId}
         connectionStatus={connectionStatus}
      />
      
      {/* Toast */}
      {toast.visible && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-white/90 px-6 py-2 rounded-full shadow-lg border-2 border-yellow-400 flex items-center animate-bounce">
                <span className="text-3xl mr-3">{toast.emoji}</span>
                <span className="font-bold text-xl text-gray-900">{toast.msg}</span>
            </div>
        </div>
      )}

      {/* Motivational Sticker Overlay */}
      {activeSticker && (
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 pointer-events-none z-[100] flex flex-col items-center justify-center animate-sticker-fade">
              <div className="animate-pop-in flex flex-row items-center justify-center gap-3 bg-black/70 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shadow-2xl">
                  <div className="text-3xl filter drop-shadow-md animate-bounce">{activeSticker.emoji}</div>
                  <div className={`text-lg font-black uppercase tracking-wider ${activeSticker.color} font-sans`}>
                      {activeSticker.text}
                  </div>
              </div>
          </div>
      )}
      
      {/* DRAGGED CARD OVERLAY */}
      {draggingCard && (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            <div 
                style={{
                    position: 'absolute',
                    left: dragPos.x,
                    top: dragPos.y,
                    transform: `scale(${scale * 1.1}) rotate(5deg)`,
                    transformOrigin: 'top left',
                }}
            >
                <CardComponent 
                    card={draggingCard} 
                    cardBackStyle={cardBack}
                    className="shadow-2xl"
                    size="lg"
                />
            </div>
        </div>
      )}

      {/* RETURN ANIMATION OVERLAY */}
      {returningCard && (
        <div className="fixed inset-0 pointer-events-none z-[100]">
             <div
                style={{
                    position: 'absolute',
                    left: returningCard.startPos.x,
                    top: returningCard.startPos.y,
                    transform: `translate(${returningCard.targetPos.x - returningCard.startPos.x}px, ${returningCard.targetPos.y - returningCard.startPos.y}px) rotate(0deg) scale(${scale})`,
                    transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                    transformOrigin: 'top left'
                }}
             >
                  <CardComponent 
                    card={returningCard.card} 
                    cardBackStyle={cardBack}
                    className="shadow-2xl opacity-80"
                    size="lg"
                />
             </div>
        </div>
      )}

      {/* Main Game Area (Scaling Container) */}
      <div 
        ref={gameAreaRef}
        className="flex-grow relative flex items-center justify-center overflow-hidden p-4 z-10"
      >
        <div 
            style={{ 
                width: GAME_WIDTH, 
                height: GAME_HEIGHT, 
                transform: `scale(${scale})`, 
            }} 
            className="relative bg-black/5 rounded-3xl border border-white/5 shadow-2xl flex flex-col justify-between"
        >
        
        {/* ScoreBoard Display */}
        <ScoreBoard wins={wins} losses={losses} />

        {!isPlaying && !winner ? (
            // Start Screen (Centered)
            <div className="absolute inset-0 flex items-center justify-center z-50">
                <div className="bg-black/40 p-8 rounded-3xl text-center backdrop-blur-sm border border-white/20 shadow-xl max-w-xl animate-enter-from-top">
                    <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 mb-2">
                        Matatu King Savannah Edition
                    </h1>
                    <p className="text-gray-200 mb-6 text-lg">Landscape Edition</p>
                    <div className="flex gap-4 justify-center">
                        <button onClick={startGame} className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black text-xl font-bold rounded-full shadow-lg transform hover:scale-105 transition-all">
                            vs Computer
                        </button>
                        <button onClick={() => setShowLobby(true)} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xl font-bold rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-2">
                            <span>👥</span> Play Online
                        </button>
                    </div>
                    <div className="mt-4">
                        <button onClick={() => setShowRules(true)} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full shadow-lg text-sm">
                            Rules
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            // Game Board Content
            <>
                {/* AI Commentary Bubble */}
                {aiCommentary && !isMicActive && (
                    <div className="absolute top-24 right-[20%] animate-in fade-in zoom-in slide-in-from-top duration-300 z-40 max-w-xs">
                        <div className="relative bg-white p-4 rounded-2xl shadow-xl border-2 border-black">
                            <p className="font-bold text-gray-800 text-sm leading-tight">"{aiCommentary}"</p>
                            <div className="absolute -top-2 left-4 w-4 h-4 bg-white border-t-2 border-l-2 border-black transform rotate-45"></div>
                        </div>
                    </div>
                )}

                {/* Opponent Hand (Top) */}
                <div className="relative w-full h-32 flex justify-center pt-8 pointer-events-none">
                    {/* Opponent Avatar */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-[200px] z-50 flex flex-col items-center">
                         <div className="w-16 h-16 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                             <img src={opponentAvatar} alt="Opponent" className="w-full h-full object-cover" />
                         </div>
                    </div>

                    <div className="relative flex justify-center items-center h-full">
                        {oppHand.map((card, i) => (
                            <div 
                                key={card.id} 
                                className={`absolute transition-all duration-300 ${isComputerThinking ? 'animate-computer-thinking' : ''}`} 
                                style={{
                                    ...getHandStyle(i, oppHand.length, false),
                                    animationDelay: `${i * 0.1}s` 
                                }}
                            >
                                <CardComponent 
                                    card={card} 
                                    className="scale-75 origin-top"
                                    cardBackStyle={cardBack}
                                    size="lg"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="absolute top-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20 z-10">
                        {networkRole !== 'none' ? 'Opponent' : 'Computer'}: {oppHand.length} cards
                    </div>
                    {isComputerThinking && (
                        <div className="absolute top-16 bg-white/90 text-gray-900 px-4 py-1.5 rounded-full text-sm font-bold shadow-xl border-2 border-yellow-400 z-50 flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                           <span className="animate-spin text-lg">⚙️</span> Thinking...
                        </div>
                    )}
                </div>

                {/* Center Table */}
                <div className="flex-1 flex items-center justify-center space-x-12 z-0">
                     {/* Deck */}
                    <div 
                        className={`relative group cursor-pointer ${isDrawAnimating ? 'animate-draw-click' : ''}`} 
                        onClick={() => handleDrawButton(false)}
                    >
                         {deck.length > 0 ? (
                            <div className={`w-24 h-36 rounded-xl shadow-lg flex items-center justify-center transition-transform hover:scale-105 card-back-${cardBack.toLowerCase()}`}>
                                <span className="text-white font-bold text-sm bg-black/30 px-2 rounded">DRAW</span>
                            </div>
                        ) : (
                            <div className="w-24 h-36 border-2 border-dashed border-white/30 rounded-xl flex items-center justify-center">
                                <span className="text-white/50">Empty</span>
                            </div>
                        )}
                        {drawPenalty > 0 && isMyTurn && (
                            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-yellow-300 font-bold whitespace-nowrap animate-bounce bg-black/60 px-2 rounded">
                                Take +{drawPenalty}
                            </div>
                        )}
                    </div>

                    {/* Discard Pile */}
                    <div 
                        ref={discardPileRef}
                        className={`relative w-24 h-36 transition-all duration-300 rounded-xl ${isOverDiscard ? 'ring-4 ring-yellow-400 scale-105 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : ''}`}
                    >
                        {discardPile.slice(-5).map((card, i) => (
                            <div key={card.id} className="absolute top-0 left-0" style={{ transform: `rotate(${(i % 2 === 0 ? 2 : -2) + (i*1)}deg)` }}>
                                <CardComponent 
                                    card={card} 
                                    className={i === discardPile.slice(-5).length - 1 ? "animate-land" : ""}
                                    size="lg"
                                />
                                {i === discardPile.slice(-5).length - 1 && turnCount > 0 && <ParticleBurst />}
                            </div>
                        ))}
                         {/* Active Suit */}
                        {activeSuit && (
                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white px-4 py-1 rounded-full shadow-lg border-2 border-purple-500 flex items-center animate-pulse z-20">
                                <span className="text-xs mr-2 text-gray-500 uppercase font-bold">Target</span>
                                <span className={`text-2xl leading-none ${[Suit.Hearts, Suit.Diamonds].includes(activeSuit) ? 'text-red-600' : 'text-black'}`}>{activeSuit}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* My Hand (Bottom) */}
                <div className="relative w-full h-48 flex justify-center items-end pb-8">
                    {/* Watermark "Player Profile" Area */}
                    {!bgImage && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 pointer-events-none select-none z-0">
                             <h1 
                                style={{
                                    fontFamily: '"Times New Roman", Times, serif',
                                    fontSize: '16px',
                                    color: '#C5B358', // Grey-Golden
                                    textShadow: '0px 1px 1px rgba(0,0,0,0.5)',
                                }}
                                className="font-bold tracking-widest uppercase opacity-90"
                             >
                                MATATU KING
                             </h1>
                        </div>
                    )}

                    <div className="relative flex justify-center items-end h-40 w-[80%] max-w-4xl touch-none">
                        {myHand.map((card, i) => {
                             const isMyRoleTurn = isMyTurn;
                             const canPlay = isMyRoleTurn && isValidMove(card, discardPile[discardPile.length-1], activeSuit, drawPenalty);
                             const isBeingDragged = draggingCard?.id === card.id;
                             const isReturning = returningCard?.card.id === card.id;

                             // Hide card if dragging OR animating return
                             const isHidden = isBeingDragged || isReturning;

                             return (
                                <div 
                                    key={card.id} 
                                    className={`absolute transition-all duration-200 ${isHidden ? 'opacity-0' : 'opacity-100'} ${canPlay && !isHidden ? 'hover:z-50 hover:-translate-y-6' : ''}`} 
                                    style={getHandStyle(i, myHand.length, true)}
                                    onPointerDown={(e) => handlePointerDown(e, card)}
                                >
                                    <CardComponent 
                                        card={card} 
                                        isPlayable={canPlay}
                                        className="shadow-md touch-none"
                                        cardBackStyle={cardBack}
                                        size="lg"
                                    />
                                </div>
                             );
                        })}
                    </div>
                    {isMyTurn && (
                        <div className="absolute bottom-40 bg-yellow-400 text-black px-4 py-1 rounded-full font-bold shadow-lg animate-pulse border-2 border-white pointer-events-none">
                            YOUR TURN
                        </div>
                    )}
                    {networkRole !== 'none' && !isMyTurn && (
                        <div className="absolute bottom-40 bg-gray-700 text-white px-4 py-1 rounded-full font-bold shadow-lg border-2 border-gray-500">
                            Waiting for Opponent...
                        </div>
                    )}
                </div>
            </>
        )}
        </div>
      </div>

      {/* Right Sidebar HUD */}
      <div className="w-16 h-full bg-black/40 backdrop-blur-sm border-l border-white/10 flex flex-col items-center py-4 space-y-4 z-20 shrink-0">
          
          {(isPlaying || networkRole !== 'none') && (
            <button 
                onClick={toggleMic}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg transition-all ${
                    isMicActive 
                    ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-400/50' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title={networkRole === 'none' ? 'Talk to Semsa' : 'Voice Chat'}
            >
                {isMicActive ? '🎙️' : '🎤'}
            </button>
          )}
          
          <div className="w-8 h-px bg-white/20 my-2"></div>
          <button 
            onClick={handleUndo} 
            disabled={history.length === 0 || networkRole !== 'none'}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${history.length === 0 || networkRole !== 'none' ? 'bg-gray-600/50 text-white/30' : 'bg-orange-500 text-white hover:bg-orange-400 shadow-lg'}`}
          >
              ↩️
          </button>
          <button onClick={() => setShowRecap(prev => !prev)} className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center text-xl shadow-lg">
              📜
          </button>
          <button onClick={() => setShowLeaderboard(true)} className="w-10 h-10 rounded-full bg-yellow-600 hover:bg-yellow-500 text-white flex items-center justify-center text-xl shadow-lg">
              🏆
          </button>
          <div className="relative">
            <button 
                onClick={handleGetHint} 
                disabled={isGettingHint || !isPlaying}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg transition-all ${isGettingHint ? 'bg-yellow-800 text-gray-400' : 'bg-yellow-400 hover:bg-yellow-300 text-white'}`}
            >
                {isGettingHint ? '...' : '💡'}
            </button>
            {hintMessage && (
                <div className="absolute right-12 top-0 w-64 p-3 bg-white text-gray-800 rounded-lg shadow-2xl border-2 border-yellow-400 text-sm z-50 animate-in fade-in slide-in-from-right">
                    <div className="font-bold text-yellow-600 mb-1 flex justify-between">
                        <span>Coach Semsa:</span>
                        <button onClick={() => setHintMessage(null)} className="text-gray-400 hover:text-black">✕</button>
                    </div>
                    {hintMessage}
                </div>
            )}
          </div>
          <div className="flex-grow"></div>
          <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center shadow-lg">
             ⚙️
          </button>
          <button onClick={() => setShowRules(true)} className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center shadow-lg">
              ?
          </button>
          <button onClick={networkRole !== 'none' ? () => { if(confirm('Disconnect?')) goHome(); } : startGame} className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-500 text-white flex items-center justify-center shadow-lg text-xs font-bold">
              {networkRole !== 'none' ? 'EXT' : 'RST'}
          </button>
      </div>
    </div>
  );
};

export default App;
