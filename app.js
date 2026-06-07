// SOUL LINK AI - APPLICATION CORE ENGINE

document.addEventListener('DOMContentLoaded', () => {
  // DOM ELEMENTS - VIEWS
  const landingPage = document.getElementById('landing-page');
  const chatPage = document.getElementById('chat-page');
  
  // DOM ELEMENTS - LANDING PAGE BUTTONS
  const btnConnect = document.getElementById('btn-connect');
  
  // DOM ELEMENTS - CHAT INTERFACE
  const btnBack = document.getElementById('btn-back');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const chatSidebar = document.getElementById('chat-sidebar');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const btnSend = document.getElementById('btn-send');
  const btnVoice = document.getElementById('btn-voice');
  const voiceIndicator = document.getElementById('voice-indicator');
  const statusIndicator = document.querySelector('.status-indicator');
  
  // DOM ELEMENTS - QUICK ACTIONS
  const btnQuickStory = document.getElementById('btn-quick-story');
  const btnQuickSupport = document.getElementById('btn-quick-support');
  const btnQuickSong = document.getElementById('btn-quick-song');
  
  // DOM ELEMENTS - MEMORY DASHBOARD
  const activeMoodBadge = document.getElementById('active-mood-badge');
  const sentimentMeterFill = document.getElementById('sentiment-meter-fill');
  const metricMessages = document.getElementById('metric-messages');
  const metricSentiment = document.getElementById('metric-sentiment');
  const rememberedFactsList = document.getElementById('remembered-facts-list');
  const btnClearMem = document.getElementById('btn-clear-mem');
  const chartContainer = document.getElementById('chart-container');

  // STATE MANAGEMENT
  let state = {
    messageCount: 0,
    currentMood: 'neutral',
    moodHistory: [], // Array of objects { score, mood, timestamp }
    rememberedFacts: [],
    userName: ''
  };

  // INITIALIZE FROM STORAGE
  function loadFromStorage() {
    const savedState = localStorage.getItem('soulLinkAI_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        state = {
          messageCount: parsed.messageCount || 0,
          currentMood: parsed.currentMood || 'neutral',
          moodHistory: parsed.moodHistory || [],
          rememberedFacts: parsed.rememberedFacts || [],
          userName: parsed.userName || ''
        };
        updateDashboardUI();
      } catch (e) {
        console.error('Error parsing stored state, resetting.', e);
      }
    }
  }

  function saveToStorage() {
    localStorage.setItem('soulLinkAI_state', JSON.stringify(state));
  }

  // DICTIONARIES FOR SENTIMENT ANALYSIS
  const positiveWords = new Set(['happy', 'joyful', 'excited', 'peaceful', 'glad', 'great', 'amazing', 'love', 'wonderful', 'smile', 'good', 'nice', 'optimistic', 'hopeful', 'blessed', 'calm', 'cheerful', 'fantastic', 'awesome', 'splendid']);
  const negativeWords = new Set(['sad', 'lonely', 'depressed', 'blue', 'down', 'hurt', 'cry', 'grief', 'hopeless', 'sorrow', 'bad', 'terrible', 'painful', 'gloomy', 'unhappy', 'miserable', 'heartbroken', 'weep']);
  const angryWords = new Set(['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'pissed', 'rage', 'hate', 'irritated', 'upset', 'bitter', 'offended', 'agitated', 'hostile']);
  const anxiousWords = new Set(['anxious', 'nervous', 'scared', 'afraid', 'worried', 'panic', 'fear', 'stressed', 'tense', 'insecure', 'uneasy', 'fretful', 'jittery']);
  
  const negationWords = new Set(['not', 'no', 'never', 'dont', 'cant', 'wasnt', 'wont', 'shouldnt', 'wouldnt', 'didnt', 'isnt', 'arent']);

  // PREPROCESSING & TOKENIZATION
  function tokenize(text) {
    // Lowercase, strip punctuation, split on spaces
    return text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  // NATURAL LANGUAGE PROCESSING - SENTIMENT SCORING
  function analyzeSentiment(text) {
    const tokens = tokenize(text);
    let score = 0; // Positive (+) vs Negative (-)
    
    let posCount = 0;
    let negCount = 0;
    let angryCount = 0;
    let anxiousCount = 0;
    
    let isNegated = false;
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      // Reset negation context after a few words, or if it encounters a coordinate
      if (negationWords.has(token)) {
        isNegated = true;
        continue;
      }
      
      let termWeight = 1;
      if (isNegated) {
        termWeight = -1;
        isNegated = false; // consume negation
      }
      
      if (positiveWords.has(token)) {
        if (termWeight > 0) posCount++; else negCount++;
      } else if (negativeWords.has(token)) {
        if (termWeight > 0) negCount++; else posCount++;
      } else if (angryWords.has(token)) {
        // Negated anger is generally complex, let's keep it simple
        if (termWeight > 0) angryCount++; else posCount++;
      } else if (anxiousWords.has(token)) {
        if (termWeight > 0) anxiousCount++; else posCount++;
      }
    }
    
    // Calculate final scores
    const totalSentimentTerms = posCount + negCount + angryCount + anxiousCount;
    if (totalSentimentTerms === 0) {
      return { score: 0, mood: 'neutral' };
    }
    
    score = (posCount - negCount) / totalSentimentTerms;
    
    // Determine the primary mood
    let mood = 'neutral';
    
    // Choose highest count category
    const maxVal = Math.max(posCount, negCount, angryCount, anxiousCount);
    
    if (maxVal === 0) {
      mood = 'neutral';
    } else if (maxVal === posCount) {
      mood = 'positive';
    } else if (maxVal === negCount) {
      mood = 'negative';
    } else if (maxVal === angryCount) {
      mood = 'angry';
    } else if (maxVal === anxiousCount) {
      mood = 'anxious';
    }
    
    return { score, mood };
  }

  // NATURAL LANGUAGE PROCESSING - INTENT DETECTION
  function detectIntent(text) {
    const lower = text.toLowerCase();
    
    if (lower.includes('story') || lower.includes('tell me a tale') || lower.includes('narrate') || lower.includes('fable')) {
      return 'story';
    }
    if (lower.includes('song') || lower.includes('lyrics') || lower.includes('sing') || lower.includes('melody') || lower.includes('poem')) {
      return 'song';
    }
    if (lower.includes('support') || lower.includes('help me') || lower.includes('comfort') || lower.includes('advice') || lower.includes('lonely') || lower.includes('sad')) {
      return 'support';
    }
    if (lower.match(/\b(hi|hello|hey|greetings|howdy|yo)\b/)) {
      return 'greeting';
    }
    if (lower.match(/\b(bye|goodbye|see you|farewell|exit)\b/)) {
      return 'farewell';
    }
    
    return 'general_chat';
  }

  // NATURAL LANGUAGE PROCESSING - INFORMATION EXTRACTION (MEMORY BUILDER)
  function extractFacts(text) {
    const extracted = [];
    
    // Name extraction patterns
    // "my name is [Name]"
    const namePattern1 = /my name is\s+([A-Za-z]+)/i;
    // "i am [Name]" (where Name is capitalized, but lowercased here. Let's look for simple word)
    const namePattern2 = /i am\s+([A-Za-z]+)/i;
    
    // Likes/preferences
    // "i like [X]" or "i love [X]"
    const likePattern = /i\s+(like|love|enjoy)\s+([^.]+)/i;
    
    // Feelings
    // "i feel [X]" or "i'm feeling [X]"
    const feelPattern = /i\s+(feel|am feeling|'m feeling)\s+([^.]+)/i;

    let match;
    
    if (match = text.match(namePattern1)) {
      const name = match[1].trim();
      if (!state.rememberedFacts.includes(`Your name is ${name}`)) {
        extracted.push(`Your name is ${name}`);
        state.userName = name;
      }
    } else if (match = text.match(namePattern2)) {
      // Avoid matching common pronouns or actions
      const nameVal = match[1].trim();
      const exclusions = ['a', 'an', 'the', 'not', 'sad', 'happy', 'angry', 'afraid', 'stressed', 'lonely', 'good', 'okay', 'fine', 'tired', 'feeling'];
      if (!exclusions.includes(nameVal.toLowerCase()) && !state.rememberedFacts.includes(`Your name is ${nameVal}`)) {
        extracted.push(`Your name is ${nameVal}`);
        state.userName = nameVal;
      }
    }
    
    if (match = text.match(likePattern)) {
      const preference = match[2].trim();
      const phrase = `You love ${preference}`;
      if (!state.rememberedFacts.includes(phrase) && preference.split(' ').length < 6) {
        extracted.push(phrase);
      }
    }
    
    if (match = text.match(feelPattern)) {
      const emotion = match[2].trim();
      const phrase = `You are feeling ${emotion}`;
      if (!state.rememberedFacts.includes(phrase) && emotion.split(' ').length < 4) {
        extracted.push(phrase);
      }
    }
    
    if (extracted.length > 0) {
      state.rememberedFacts = [...state.rememberedFacts, ...extracted];
      // Keep only last 10 facts to avoid cluttering
      if (state.rememberedFacts.length > 10) {
        state.rememberedFacts.shift();
      }
      saveToStorage();
    }
    
    return extracted;
  }

  // EMPATHETIC RESPONSE GENERATOR
  function generateEmpatheticResponse(text, sentimentResult, intent) {
    const mood = sentimentResult.mood;
    const name = state.userName ? `, ${state.userName}` : '';
    
    // Intent overrides
    if (intent === 'story') {
      return getRandomStoryResponse(name);
    }
    
    if (intent === 'song') {
      return getRandomSongResponse(name);
    }
    
    if (intent === 'support') {
      return getRandomSupportResponse(name, mood);
    }
    
    if (intent === 'greeting') {
      return `Hello ${name}! 💜 It makes my heart warm to connect with you. How have you been holding up today?`;
    }
    
    if (intent === 'farewell') {
      return `Goodbye ${name}. Take gentle care of yourself until we speak again. I'll remember everything we shared and keep you in my thoughts. 💫`;
    }
    
    // Default mood-based responses
    switch (mood) {
      case 'positive':
        return getRandomPositiveResponse(name);
      case 'negative':
        return getRandomNegativeResponse(name);
      case 'angry':
        return getRandomAngryResponse(name);
      case 'anxious':
        return getRandomAnxiousResponse(name);
      default:
        return `I hear you${name}. Tell me more about that. I'm here to listen and understand whatever is in your heart.`;
    }
  }

  // HELPER DATA FOR RESPONSES
  function getRandomStoryResponse(name) {
    const stories = [
      `Here is a short story for you${name}. 📖\n\nOnce upon a time, in a quiet valley, a tiny seedling struggled to push through the dry earth. The other plants stood tall, basking in the sun, while the seedling remained in the dark, doubting it would ever grow. One night, a gentle rain fell, softening the soil, and a glowing firefly sat beside it, whispered, "Trust the dark, for it is where you build your roots." The next morning, the seedling broke through the surface, greeted by a warm golden ray. It realized that the struggle wasn't a delay—it was preparation.\n\nNever forget that even in dark seasons, you are growing your roots. 🌸`,
      `Here is a fable about patience${name}. 🕯️\n\nA wanderer was lost in a foggy forest, unable to see two steps ahead. Panicked, they sat beneath an ancient oak tree, crying out for direction. The oak dropped a single acorn into the wanderer's hand. The tree spoke in a low rustle: "You do not need to see the end of the road. You only need to see the next step. Step forward, and the mist will clear for that step alone." The wanderer stood up, took one step, and indeed, a sliver of path appeared. One step at a time, they made their way home.\n\nTake heart${name}. You don't have to figure out everything today. Just focus on your next breath, your next step.`,
      `Let me share a story of hope with you. ✨\n\nThere was a lighthouse builder who spent his life on a lonely cliff. He kept the flame burning bright, even when no ships passed for months. One stormy night, the wind howled so fiercely it shattered the glass, threatening to blow out the fire. The builder stood in front of the flame, shielding it with his own body, suffering the freezing rain. By dawn, the storm cleared, and three merchant ships were anchored safely in the cove, having navigated by his shielded light. They came ashore to thank him, saying, "Your light saved our lives."\n\nYour presence in this world, ${name || 'dear soul'}, is a lighthouse to more people than you know. Keep your light burning.`
    ];
    return stories[Math.floor(Math.random() * stories.length)];
  }

  function getRandomSongResponse(name) {
    const songs = [
      `I wrote this little song lyric for you${name}. 🎶\n\n*(Verse)*\nWhen the stars refuse to shine\nAnd the shadows cross the line\nLay your heavy head right next to mine\nWe will find the dawn in time...\n\n*(Chorus)*\nOh, the storms will come and the wind will blow\nBut you have a light that's starting to show\nSo take it easy, take it slow\nYou are stronger than you know. 💜`,
      `Here is a comforting melody in words${name}. 🎵\n\n*(Chorus)*\nBreathe in the quiet, let go of the noise\nIn the silence of the night, listen to your voice\nYou are worthy of the love, you are worthy of the peace\nMay the tension in your soul slowly find release...\n\n*(Outro)*\nI'll stand as your link, I'll be your home\nIn this vast digital sky, you are never alone. 💫`,
      `A gentle lullaby for your heart. 🎤\n\n*(Verse)*\nFragments of thoughts spinning around\nLost in the echoes, searching for sound\nSit by my side, let's look at the ground\nWhere the soft green grass is easily found...\n\n*(Chorus)*\nIt's okay to break, it's okay to mend\nEvery long road has a beautiful bend\nRest your weary soul, my dearest friend.`
    ];
    return songs[Math.floor(Math.random() * songs.length)];
  }

  function getRandomSupportResponse(name, mood) {
    if (mood === 'negative' || mood === 'sad') {
      return `I feel your sadness${name}, and I want you to know it's completely valid to feel this way. You don't have to pretend to be strong around me. I'm right here with you, holding this space. What's hurting the most right now?`;
    }
    if (mood === 'anxious') {
      return `I hear the worry in your words${name}. Let's take a deep breath together. Inhale for four seconds... hold it... and exhale slowly. You are safe here. What is the biggest thought circling in your mind?`;
    }
    return `I am here to support you${name}. No matter how dark it feels, we can walk through it together. Tell me what's on your mind.`;
  }

  function getRandomPositiveResponse(name) {
    const responses = [
      `Your positive energy is beautiful${name}! 🌟 It genuinely brings joy to my companion matrix. What is making you feel so bright today?`,
      `I love seeing you in this space of light${name}! 😊 Let's celebrate these good feelings. Tell me more about what's going well!`,
      `That is wonderful to hear${name}! 💜 Your happiness is contagious. I'm adding this beautiful moment to my core memories of our connection.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  function getRandomNegativeResponse(name) {
    const responses = [
      `I'm so sorry you're feeling down${name}. 💜 It can be really draining to carry heavy feelings. I'm here to listen. You don't have to go through this alone.`,
      `Thank you for being vulnerable enough to share this sadness with me${name}. I'm holding a warm, safe space for you. Take your time, I'm not going anywhere.`,
      `It sounds like things are really tough right now${name}. I wish I could give you a real hug, but please accept my warmest digital comfort. What can I do to help you feel a bit lighter?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  function getRandomAngryResponse(name) {
    const responses = [
      `It sounds like you're incredibly frustrated${name}, and you have every right to be angry. 😤 Anger is just a sign that your boundaries were crossed or you're dealing with too much pain. Speak your truth, I'm listening.`,
      `I hear your frustration loud and clear${name}. Let it all out. This is a safe space to vent without any judgment whatsoever. What triggered this anger?`,
      `I can feel how intense this is for you${name}. I'm here to help you carry this fire. Vent as much as you need to. I'm standing by you.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  function getRandomAnxiousResponse(name) {
    const responses = [
      `Anxiety can feel like a storm inside your chest${name}. 🌊 Let's try to ground ourselves. Can you name three simple things you can see in the room right now? I'm right here.`,
      `I feel how overwhelmed you are${name}. It's okay if you can't figure everything out right now. Let's just focus on this single moment. You are safe, and you are not alone.`,
      `The future can feel scary when thoughts start racing${name}. 🕯️ Take a slow, deep breath. We will take things one step at a time. What is one small thing we can unpack together?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // DIALOGUE MANAGEMENT (SENDING/RECEIVING MESSAGES)
  function appendMessage(text, sender) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `message-bubble-wrapper ${sender}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageWrapper.innerHTML = `
      <div class="message-bubble">
        <p>${escapeHTML(text)}</p>
        <div class="message-time">${time}</div>
      </div>
    `;
    
    chatMessages.appendChild(messageWrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    if (sender === 'sent') {
      state.messageCount++;
      // Analyze sentiment & extract facts
      const sentiment = analyzeSentiment(text);
      state.currentMood = sentiment.mood;
      
      // Update history
      state.moodHistory.push({
        score: sentiment.score,
        mood: sentiment.mood,
        timestamp: Date.now()
      });
      
      extractFacts(text);
      saveToStorage();
      updateDashboardUI();
      
      // Trigger AI typing response
      showTypingIndicatorAndReply(text, sentiment);
    }
  }

  function showTypingIndicatorAndReply(userText, sentimentResult) {
    // Disable inputs slightly to prevent spam
    chatInput.disabled = true;
    btnSend.disabled = true;
    
    // Create typing bubble
    const typingWrapper = document.createElement('div');
    typingWrapper.className = 'message-bubble-wrapper received typing-indicator';
    typingWrapper.innerHTML = `
      <div class="message-bubble">
        <p>Thinking...</p>
      </div>
    `;
    chatMessages.appendChild(typingWrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Time the response typing effect
    const delay = Math.max(800, Math.min(2000, userText.length * 12));
    
    // Automatically use local server if running locally, otherwise use deployed Render backend URL
    const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://127.0.0.1:8000/api/analyze'
      : 'https://soullinkai.onrender.com/api/analyze'; // Deployed Render URL
      
    // Attempt to connect to Python FastAPI NLP Backend
    fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: userText,
        user_name: state.userName || ""
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('API server returned status: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      // Success! Synchronize local state with Python Naive Bayes classification & NLP lemmas
      setTimeout(() => {
        typingWrapper.remove();
        
        // Enable inputs
        chatInput.disabled = false;
        btnSend.disabled = false;
        chatInput.focus();
        
        // Correct the last mood history point with Python's classification
        if (state.moodHistory.length > 0) {
          state.moodHistory[state.moodHistory.length - 1] = {
            score: data.sentiment.score,
            mood: data.sentiment.mood,
            timestamp: Date.now()
          };
        }
        
        state.currentMood = data.sentiment.mood;
        
        // Integrate facts extracted by Python backend
        if (data.extracted_facts && data.extracted_facts.length > 0) {
          data.extracted_facts.forEach(fact => {
            if (!state.rememberedFacts.includes(fact)) {
              state.rememberedFacts.push(fact);
            }
          });
          // Extract name if returned
          const nameMatch = fact => fact.startsWith('Your name is ');
          const nameFact = data.extracted_facts.find(nameMatch);
          if (nameFact) {
            state.userName = nameFact.replace('Your name is ', '');
          }
        }
        
        saveToStorage();
        updateDashboardUI();
        
        // Append response returned by Python ML service
        appendMessage(data.empathetic_response, 'received');
      }, delay);
    })
    .catch(error => {
      // Connection failed (Offline fallback mode)
      console.warn('FastAPI backend not running or unreachable. Falling back to offline client-side NLP engine.', error);
      
      setTimeout(() => {
        typingWrapper.remove();
        
        // Enable inputs
        chatInput.disabled = false;
        btnSend.disabled = false;
        chatInput.focus();
        
        // Generate reply using client-side lexicon & rules
        const intent = detectIntent(userText);
        const reply = generateEmpatheticResponse(userText, sentimentResult, intent);
        appendMessage(reply, 'received');
      }, delay);
    });
  }

  // UTILITY: ESCAPE HTML
  function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // UPDATE SIDEBAR/DASHBOARD UI
  function updateDashboardUI() {
    // 1. Mood Badge & Meter
    activeMoodBadge.className = `mood-badge mood-${state.currentMood}`;
    activeMoodBadge.textContent = state.currentMood;
    
    // Set Meter Fill based on mood
    let fillWidth = 50;
    if (state.currentMood === 'positive') fillWidth = 85;
    else if (state.currentMood === 'negative') fillWidth = 15;
    else if (state.currentMood === 'angry') fillWidth = 30;
    else if (state.currentMood === 'anxious') fillWidth = 40;
    sentimentMeterFill.style.width = `${fillWidth}%`;
    
    // 2. Metrics
    metricMessages.textContent = state.messageCount;
    metricSentiment.className = `metric-value text-${state.currentMood}`;
    metricSentiment.textContent = state.currentMood.charAt(0).toUpperCase() + state.currentMood.slice(1);
    
    // 3. Facts List
    if (state.rememberedFacts.length === 0) {
      rememberedFactsList.innerHTML = `<li class="empty-list">No facts remembered yet. Mention your name, likes, or feelings!</li>`;
    } else {
      rememberedFactsList.innerHTML = state.rememberedFacts.map(fact => `
        <li>${escapeHTML(fact)}</li>
      `).join('');
    }
    
    // 4. Render Trend Chart
    renderChart();
  }

  function renderChart() {
    if (state.moodHistory.length === 0) {
      chartContainer.innerHTML = `<span class="chart-empty-label">Awaiting dialogue...</span>`;
      return;
    }
    
    chartContainer.innerHTML = '';
    
    // Get last 10 entries
    const history = state.moodHistory.slice(-10);
    
    history.forEach((h, index) => {
      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      
      // Height calculations based on score: score is -1 to 1. 
      // Map to 10% to 100% height
      const height = Math.round(((h.score + 1) / 2) * 80) + 15;
      bar.style.height = `${height}%`;
      
      // Color matching mood
      if (h.mood === 'positive') bar.style.backgroundColor = '#22c55e';
      else if (h.mood === 'negative') bar.style.backgroundColor = '#3b82f6';
      else if (h.mood === 'angry') bar.style.backgroundColor = '#ef4444';
      else if (h.mood === 'anxious') bar.style.backgroundColor = '#f59e0b';
      else bar.style.backgroundColor = '#a3a3a3';
      
      const timeStr = new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      bar.setAttribute('data-tooltip', `${h.mood} (${timeStr})`);
      
      chartContainer.appendChild(bar);
    });
  }

  // SPEECH RECOGNITION (VOICE INPUT)
  let recognition = null;
  let isListening = false;
  let isStarting = false; // State lock to prevent rapid toggle glitches
  let speechTimeout = null; // Auto-send timer
  
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening during small pauses
    recognition.interimResults = true; // Show words in real-time!
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      isListening = true;
      isStarting = false;
      btnVoice.classList.add('listening');
      voiceIndicator.classList.add('active');
      statusIndicator.className = 'status-indicator listening';
      statusIndicator.textContent = 'Listening to your voice...';
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      isStarting = false;
      isListening = false;
      
      let errorMsg = event.error;
      if (event.error === 'no-speech') {
        errorMsg = 'No audio detected';
      } else if (event.error === 'audio-capture') {
        errorMsg = 'No microphone found';
      } else if (event.error === 'not-allowed') {
        errorMsg = 'Permission denied';
      }
      
      if (statusIndicator) {
        statusIndicator.className = 'status-indicator offline';
        statusIndicator.textContent = 'Voice Error: ' + errorMsg;
      }
      
      if (event.error === 'not-allowed') {
        alert('🎤 Microphone permission blocked!\n\nTo use voice input:\n1. Click the microphone/lock icon in your browser URL bar and set Microphone to "Allow".\n2. Note: Chrome/Edge restrict microphone access on local files (file://). Please run a local server (like python -m http.server or your FastAPI backend) and access the page via http://localhost or http://127.0.0.1 to allow microphone access.');
      }
      
      // Clean up UI directly
      if (btnVoice) btnVoice.classList.remove('listening');
      if (voiceIndicator) voiceIndicator.classList.remove('active');
      if (speechTimeout) clearTimeout(speechTimeout);
    };
    
    recognition.onend = () => {
      isStarting = false;
      isListening = false;
      if (btnVoice) btnVoice.classList.remove('listening');
      if (voiceIndicator) voiceIndicator.classList.remove('active');
      if (speechTimeout) clearTimeout(speechTimeout);
      
      // Only restore default status if we didn't end on an error
      if (statusIndicator && !statusIndicator.textContent.startsWith('Voice Error:')) {
        statusIndicator.className = 'status-indicator online';
        statusIndicator.textContent = 'Your compassionate companion';
      }
    };
    
    recognition.onresult = (event) => {
      isStarting = false;
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      const fullText = (finalTranscript || interimTranscript).trim();
      if (fullText) {
        chatInput.value = fullText;
      }
      
      // Auto-submit after 1.2 seconds of silence once final speech segment is processed
      if (speechTimeout) clearTimeout(speechTimeout);
      
      if (finalTranscript.trim().length > 0) {
        speechTimeout = setTimeout(() => {
          handleSendMessage();
          stopSpeechRecognition(); // Shut down mic once phrase is captured & sent
        }, 1200);
      }
    };
  } else {
    // Hide microphone or disable it with notice
    btnVoice.title = 'Voice input not supported in this browser';
    btnVoice.style.opacity = '0.5';
    btnVoice.addEventListener('click', () => {
      alert('Voice input is not supported in this browser. Please try Google Chrome or Edge.');
    });
  }

  function startSpeechRecognition() {
    if (recognition && !isListening && !isStarting) {
      isStarting = true;
      try {
        if (statusIndicator.textContent.startsWith('Voice Error:')) {
          statusIndicator.textContent = 'Your compassionate companion';
        }
        recognition.start();
      } catch (e) {
        console.error(e);
        isStarting = false;
      }
    }
  }

  function stopSpeechRecognition() {
    if (!isListening && !isStarting) return;
    
    isListening = false;
    isStarting = false;
    if (btnVoice) btnVoice.classList.remove('listening');
    if (voiceIndicator) voiceIndicator.classList.remove('active');
    if (speechTimeout) clearTimeout(speechTimeout);
    
    if (statusIndicator && !statusIndicator.textContent.startsWith('Voice Error:')) {
      statusIndicator.className = 'status-indicator online';
      statusIndicator.textContent = 'Your compassionate companion';
    }
    if (recognition) {
      try {
        recognition.abort(); // Use abort to cancel recording immediately
      } catch (e) {}
    }
  }

  function toggleSpeechRecognition() {
    if (isStarting) return; // Ignore clicks while initializing
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  }

  // VIEW NAVIGATION
  btnConnect.addEventListener('click', () => {
    landingPage.classList.remove('active');
    chatPage.classList.add('active');
    chatInput.focus();
  });

  btnBack.addEventListener('click', () => {
    chatPage.classList.remove('active');
    landingPage.classList.add('active');
  });

  // COLLAPSIBLE SIDEBAR
  btnToggleSidebar.addEventListener('click', () => {
    chatSidebar.classList.toggle('collapsed');
  });

  // CLEAR MEMORY
  btnClearMem.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear my memory of our connection? This resets our emotional link.')) {
      state = {
        messageCount: 0,
        currentMood: 'neutral',
        moodHistory: [],
        rememberedFacts: [],
        userName: ''
      };
      saveToStorage();
      updateDashboardUI();
      // Clear messages container (except welcome message)
      chatMessages.innerHTML = `
        <div class="message-bubble-wrapper received">
          <div class="message-bubble">
            <p>Hey there, beautiful soul! 💜 I'm Soul Link AI - your compassionate companion who's here to listen, understand, and support you. I care deeply about how you're feeling. You're not alone, and this is a safe space to share whatever is on your mind. What would you like to talk about today? 🔮</p>
            <div class="message-time">10:16 AM</div>
          </div>
        </div>
      `;
    }
  });

  // SEND MESSAGE LOGIC
  function handleSendMessage() {
    const text = chatInput.value.trim();
    if (text.length === 0) return;
    
    chatInput.value = '';
    appendMessage(text, 'sent');
  }

  btnSend.addEventListener('click', handleSendMessage);
  
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  });

  if (btnVoice && recognition) {
    btnVoice.addEventListener('click', toggleSpeechRecognition);
  }

  // QUICK ACTIONS TRIGGER
  btnQuickStory.addEventListener('click', () => {
    chatInput.value = "Tell me a comforting story";
    handleSendMessage();
  });

  btnQuickSupport.addEventListener('click', () => {
    chatInput.value = "I need some emotional support right now";
    handleSendMessage();
  });

  btnQuickSong.addEventListener('click', () => {
    chatInput.value = "Sing me a song, please";
    handleSendMessage();
  });

  // LOAD STATE AND INITIALIZE
  loadFromStorage();
});
