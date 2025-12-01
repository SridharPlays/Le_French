import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import { ArrowLeft, CheckCircle, XCircle, Trophy, HelpCircle, Mic } from 'lucide-react';
import { Client } from "@gradio/client";
import { MediaRecorder as WavMediaRecorder, register } from 'extendable-media-recorder';
import { connect } from 'extendable-media-recorder-wav-encoder';

// Utility: Shuffle Array
const shuffleArray = (array) => {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const ExercisePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [exercise, setExercise] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); 
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Stats
  const [mistakesCount, setMistakesCount] = useState(0); 

  // Match State
  const [matchLeft, setMatchLeft] = useState([]);
  const [matchRight, setMatchRight] = useState([]);
  const [matchSelection, setMatchSelection] = useState({ left: null, right: null });
  const [matchedPairs, setMatchedPairs] = useState([]); // Array of IDs

  // Jumbled Sentence State
  const [jumbledWords, setJumbledWords] = useState([]);
  const [constructedSentence, setConstructedSentence] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null); // For Drag and Drop

  // Speaking State
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [speakingResult, setSpeakingResult] = useState(null);
  const [recorderReady, setRecorderReady] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  // Initialize WAV Encoder once
  useEffect(() => {
    const initWavEncoder = async () => {
      try {
        await register(await connect());
      } catch (error) {
        // Ignore if already registered
      }
      setRecorderReady(true);
    };
    initWavEncoder();
  }, []);

  // Fetch Exercise Data
  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const res = await api.get(`/exercise/${id}`);
        setExercise(res.data);
      } catch (err) {
        alert("Failed to load exercise");
        navigate('/');
      }
    };
    fetchExercise();
  }, [id, navigate]);

  // Reset state when question changes
  useEffect(() => {
    if (!exercise) return;
    const currentQ = exercise.questions[currentQIndex];
    
    setUserAnswer('');
    setFeedback(null);
    setSpeakingResult(null);
    setAudioUrl(null);
    setMatchedPairs([]);

    // 1. Setup Jumbled Sentence
    if (currentQ.question_type === 'jumbled_sentence') {
      const words = currentQ.content.sentence.split(' ');
      // Create objects with unique IDs for drag-drop keys
      const shuffled = shuffleArray(words.map((w, i) => ({ id: `word-${i}-${Math.random()}`, word: w })));
      setJumbledWords(shuffled);
      setConstructedSentence([]);
    }

    // 2. Setup Match Pairs (Shuffle Right Side)
    if (currentQ.question_type === 'match') {
      const pairs = currentQ.content.pairs;
      // pairs = [{left: 'A', right: 'B'}, ...]
      // We use the INDEX as the ID to verify matches
      const leftItems = pairs.map((p, i) => ({ id: i, text: p.left }));
      const rightItems = pairs.map((p, i) => ({ id: i, text: p.right }));
      
      setMatchLeft(leftItems);
      setMatchRight(shuffleArray(rightItems)); // Shuffle only the right side
      setMatchSelection({ left: null, right: null });
    }

  }, [currentQIndex, exercise]);

  // Drag and Drop Handlers for Jumbled
  const handleDragStart = (e, item, source) => {
      setDraggedItem({ item, source });
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, target) => {
      e.preventDefault();
      if (!draggedItem) return;

      if (draggedItem.source === 'pool' && target === 'sentence') {
          // Move from Pool to Sentence
          setJumbledWords(prev => prev.filter(w => w.id !== draggedItem.item.id));
          setConstructedSentence(prev => [...prev, draggedItem.item]);
      } else if (draggedItem.source === 'sentence' && target === 'pool') {
          // Move from Sentence to Pool
          setConstructedSentence(prev => prev.filter(w => w.id !== draggedItem.item.id));
          setJumbledWords(prev => [...prev, draggedItem.item]);
      }
      setDraggedItem(null);
  };

  const handleDragOver = (e) => {
      e.preventDefault();
  };

  // Speaking Logic
  const startRecording = async () => {
    if (!recorderReady) return alert("Recorder not ready.");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mediaRecorderRef.current = new WavMediaRecorder(stream, { mimeType: 'audio/wav' });
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioUrl(URL.createObjectURL(audioBlob));
        await handleAnalysis(audioBlob);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setSpeakingResult(null);
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    }
  };

  const handleAnalysis = async (audioBlob) => {
    setIsAnalyzing(true);
    try {
      const client = await Client.connect("https://sanpro-hhbhebb3d6gpekfk.centralindia-01.azurewebsites.net/");
      const currentQ = exercise.questions[currentQIndex];
      const payload = [
        audioBlob, "Custom", null, currentQ.content.text, "Guest_User", "Web_App", "Student"
      ];
      const response = await client.predict("/run_eval", payload);
      setSpeakingResult(response.data[0]); 
      
      // Auto-mark correct if analysis returns (simplified logic)
      setFeedback('correct');
      setScore(s => s + 1);
    } catch (err) {
      alert("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!exercise) return <div className="p-10 text-center">Loading Game...</div>;
  
  const currentQ = exercise.questions[currentQIndex];
  const isLastQuestion = currentQIndex === exercise.questions.length - 1;

  // Check Answer Logic
  const handleCheckAnswer = () => {
    let isCorrect = false;
    const content = currentQ.content;

    switch (currentQ.question_type) {
      case 'fill_blank':
        if (userAnswer.trim().toLowerCase() === content.answer.toLowerCase()) isCorrect = true;
        break;
      case 'true_false':
        if ((userAnswer === 'true') === content.isTrue) isCorrect = true;
        break;
      case 'story':
        if (userAnswer.trim().toLowerCase() === content.answer.toLowerCase()) isCorrect = true;
        break;
      case 'match':
        if (matchedPairs.length === content.pairs.length) isCorrect = true;
        break;
      case 'jumbled_sentence':
        {
            const userSent = constructedSentence.map(w => w.word).join(' ');
            if (userSent.trim() === content.sentence.trim()) isCorrect = true;
        }
        break;
      default: break;
    }

    if (isCorrect) {
      setFeedback('correct');
      setScore(s => s + 1);
    } else {
      setFeedback('wrong');
      setMistakesCount(prev => prev + 1);
    }
  };

  const handleNext = async () => {
    setFeedback(null);
    setUserAnswer('');
    setMatchedPairs([]);
    setConstructedSentence([]);
    setSpeakingResult(null);

    if (isLastQuestion) await finishExercise();
    else setCurrentQIndex(prev => prev + 1);
  };

  const finishExercise = async () => {
    try {
      await api.post('/progress/complete', {
        lesson_id: exercise.exercise_id.toString(), 
        xp_gained: exercise.xp_reward,
        mistakes: mistakesCount
      });
      setCompleted(true);
    } catch (err) { alert("Error saving progress"); }
  };

  // RENDERERS

  const renderFillBlank = () => {
    const parts = currentQ.content.text.split('___');
    const options = currentQ.content.options || [];

    return (
      <div className="flex flex-col items-center">
        <div className="text-xl text-center font-medium my-8 leading-loose">
          {parts[0]}
          {options.length > 0 ? (
             <span className="inline-block border-b-2 border-blue-600 px-2 min-w-[80px] text-blue-800 font-bold text-center bg-blue-50 mx-2 rounded">
                 {userAnswer || "?"}
             </span>
          ) : (
            <input 
              className="border-b-2 border-gray-400 bg-gray-50 px-2 py-1 mx-2 text-blue-600 font-bold focus:outline-none focus:border-blue-600 w-32 text-center"
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              autoFocus
            />
          )}
          {parts[1]}
        </div>
        
        {/* Render Options if available */}
        {options.length > 0 && (
            <div className="flex flex-wrap gap-4 justify-center mt-4">
                {options.map((opt, i) => (
                    <button 
                        key={i} 
                        onClick={() => setUserAnswer(opt)}
                        className={`px-4 py-2 rounded-lg border-2 font-bold transition ${userAnswer === opt ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50'}`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        )}
      </div>
    );
  };

  const renderJumbledSentence = () => {
    // Helper for click fallback (if not dragging)
    const handleWordClick = (wordObj, fromSource) => {
        if(feedback === 'correct') return;
        if (fromSource) {
            setJumbledWords(prev => prev.filter(w => w.id !== wordObj.id));
            setConstructedSentence(prev => [...prev, wordObj]);
        } else {
            setConstructedSentence(prev => prev.filter(w => w.id !== wordObj.id));
            setJumbledWords(prev => [...prev, wordObj]);
        }
    };

    return (
        <div className="my-8 w-full">
            <div className="text-center text-gray-500 mb-6 font-medium">Drag words to form the sentence:</div>
            
            {/* Drop Zone */}
            <div 
                onDrop={(e) => handleDrop(e, 'sentence')}
                onDragOver={handleDragOver}
                className={`min-h-24 border-2 border-dashed ${constructedSentence.length > 0 ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'} mb-8 flex flex-wrap gap-2 justify-center items-center p-4 rounded-xl transition-colors`}
            >
                {constructedSentence.length === 0 && <span className="text-gray-400 pointer-events-none select-none italic">Drop words here...</span>}
                {constructedSentence.map((w) => (
                    <div 
                        key={w.id} 
                        draggable={!feedback}
                        onDragStart={(e) => handleDragStart(e, w, 'sentence')}
                        onClick={() => handleWordClick(w, false)}
                        className="cursor-grab active:cursor-grabbing px-4 py-2 bg-white border-2 border-blue-500 text-blue-700 font-bold rounded-lg shadow-sm hover:scale-105 transition-transform"
                    >
                        {w.word}
                    </div>
                ))}
            </div>

            {/* Source Pool */}
            <div 
                onDrop={(e) => handleDrop(e, 'pool')}
                onDragOver={handleDragOver}
                className="flex flex-wrap gap-3 justify-center min-h-24 p-6 rounded-xl bg-gray-100 border border-gray-200"
            >
                {jumbledWords.map((w) => (
                    <div 
                        key={w.id} 
                        draggable={!feedback}
                        onDragStart={(e) => handleDragStart(e, w, 'pool')}
                        onClick={() => handleWordClick(w, true)}
                        className="cursor-grab active:cursor-grabbing px-4 py-2 bg-white border-b-4 border-gray-300 text-gray-700 font-bold rounded-lg active:border-b-0 active:mt-1 transition-all hover:bg-gray-50"
                    >
                        {w.word}
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const renderMatch = () => {
    // Match Logic
    const handleMatchClick = (side, id) => {
        const newSel = { ...matchSelection, [side]: id };
        setMatchSelection(newSel);

        // Check if both sides are selected
        if (newSel.left !== null && newSel.right !== null) {
            // Check match (ids should be same for correct match)
            if (newSel.left === newSel.right) {
                setMatchedPairs(prev => [...prev, newSel.left]);
                setMatchSelection({ left: null, right: null });
            } else {
                // Wrong match visual feedback reset
                setTimeout(() => setMatchSelection({ left: null, right: null }), 500);
            }
        }
    };

    return (
      <div className="grid grid-cols-2 gap-8 my-6 w-full">
        <div className="space-y-4">
          <h4 className="text-center text-xs font-bold text-gray-400 uppercase">Term</h4>
          {matchLeft.map((item) => (
            <button 
              key={item.id} 
              disabled={matchedPairs.includes(item.id)}
              onClick={() => handleMatchClick('left', item.id)}
              className={`w-full p-4 rounded-lg border-2 font-bold transition-all text-sm sm:text-base ${
                  matchedPairs.includes(item.id) 
                    ? 'opacity-50 bg-gray-100 border-gray-200 cursor-default text-gray-400' 
                    : matchSelection.left === item.id 
                        ? 'bg-blue-100 border-blue-500 text-blue-700 scale-105 shadow-md' 
                        : 'bg-white border-gray-200 hover:border-blue-300 text-gray-700'
              }`}
            >{item.text}</button>
          ))}
        </div>
        <div className="space-y-4">
          <h4 className="text-center text-xs font-bold text-gray-400 uppercase">Match</h4>
          {matchRight.map((item) => (
            <button 
              key={item.id} 
              disabled={matchedPairs.includes(item.id)}
              onClick={() => handleMatchClick('right', item.id)}
              className={`w-full p-4 rounded-lg border-2 font-bold transition-all text-sm sm:text-base ${
                  matchedPairs.includes(item.id) 
                    ? 'opacity-50 bg-gray-100 border-gray-200 cursor-default text-gray-400' 
                    : matchSelection.right === item.id 
                        ? 'bg-blue-100 border-blue-500 text-blue-700 scale-105 shadow-md' 
                        : 'bg-white border-gray-200 hover:border-blue-300 text-gray-700'
              }`}
            >{item.text}</button>
          ))}
        </div>
      </div>
    );
  };

  const renderTrueFalse = () => (
    <div className="flex gap-4 justify-center my-8 w-full">
      <div className="text-xl font-bold mb-8 w-full text-center">{currentQ.content.statement}</div>
      <div className="flex gap-4 w-full justify-center">
        <button onClick={() => setUserAnswer('true')} className={`flex-1 max-w-[150px] py-4 rounded-xl border-2 font-bold transition ${userAnswer === 'true' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>VRAI (True)</button>
        <button onClick={() => setUserAnswer('false')} className={`flex-1 max-w-[150px] py-4 rounded-xl border-2 font-bold transition ${userAnswer === 'false' ? 'bg-red-100 border-red-500 text-red-800' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>FAUX (False)</button>
      </div>
    </div>
  );

  const renderStory = () => (
    <div className="my-4 w-full">
      <div className="bg-orange-50 p-6 rounded-lg border border-orange-100 text-gray-800 italic mb-6 leading-relaxed text-lg">
        "{currentQ.content.story}"
      </div>
      <p className="font-bold text-center mb-4 text-gray-700">{currentQ.content.question}</p>
      <input 
        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none" 
        placeholder="Type your answer here..." 
        value={userAnswer} 
        onChange={e => setUserAnswer(e.target.value)}
      />
    </div>
  );

  const renderSpeaking = () => (
    <div className="flex flex-col items-center justify-center gap-6 my-8 w-full">
        <div className="bg-rose-50 p-8 rounded-2xl border border-rose-100 text-center w-full">
            <p className="text-xs text-rose-400 font-bold uppercase tracking-wider mb-2">Pronounce this:</p>
            <h3 className="text-3xl font-extrabold text-rose-900 leading-tight">{currentQ.content.text}</h3>
        </div>
        <div className="flex gap-4 items-center mt-4">
            {!isRecording ? (
                <button 
                    onClick={startRecording} 
                    disabled={isAnalyzing || !recorderReady}
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110 ${isAnalyzing ? 'bg-gray-300 cursor-not-allowed' : 'bg-linear-to-br from-rose-500 to-red-700 text-white shadow-rose-500/40'}`}
                >
                    <Mic className="w-8 h-8" />
                </button>
            ) : (
                <button onClick={stopRecording} className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center shadow-lg animate-pulse ring-4 ring-rose-200">
                    <div className="w-8 h-8 bg-white rounded-md"></div>
                </button>
            )}
        </div>
        {isAnalyzing && <span className="text-sm font-bold text-rose-600 animate-bounce mt-2">Analyzing Audio...</span>}
        {speakingResult && <div className="w-full bg-white border border-gray-200 rounded-xl p-4 mt-4 prose prose-sm max-w-none shadow-inner"><div dangerouslySetInnerHTML={{ __html: speakingResult }} /></div>}
    </div>
  );

  // FINAL SUCCESS SCREEN
  if (completed) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full animate-fade-in border border-yellow-100">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Trophy className="w-12 h-12 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Lesson Complete!</h1>
          
          <div className="grid grid-cols-2 gap-4 mb-6 mt-8">
             <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Accuracy</div>
                <div className="text-2xl font-bold text-gray-800">{Math.round((score / exercise.questions.length)*100)}%</div>
             </div>
             <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <div className="text-xs text-red-500 uppercase font-bold mb-1">Mistakes</div>
                <div className="text-2xl font-bold text-red-700">{mistakesCount}</div>
             </div>
          </div>
          <div className="bg-green-50 text-green-800 p-4 rounded-lg font-bold mb-8 border border-green-100 flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5"/> +{exercise.xp_reward} XP Earned
          </div>
          <button onClick={() => navigate('/')} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg transform active:scale-95">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // GAME SCREEN
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition"><ArrowLeft /></button>
        <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 mx-4 overflow-hidden">
          <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${((currentQIndex) / exercise.questions.length) * 100}%` }}></div>
        </div>
        <div className="font-bold text-gray-600 w-16 text-right text-sm">{currentQIndex + 1} / {exercise.questions.length}</div>
      </div>

      {/* Question Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-10 relative min-h-[450px] flex flex-col">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2 border-b pb-4">
              <HelpCircle className="w-4 h-4"/> {currentQ.question_type.replace('_', ' ')}
            </h2>

            <div className="flex-1 flex flex-col justify-center">
              {currentQ.question_type === 'fill_blank' && renderFillBlank()}
              {currentQ.question_type === 'true_false' && renderTrueFalse()}
              {currentQ.question_type === 'match' && renderMatch()}
              {currentQ.question_type === 'story' && renderStory()}
              {currentQ.question_type === 'jumbled_sentence' && renderJumbledSentence()}
              {currentQ.question_type === 'speaking' && renderSpeaking()}
            </div>

            {/* Footer / Actions */}
            <div className="border-t pt-6 mt-6">
              {currentQ.question_type === 'speaking' ? (
                  feedback === 'correct' && (
                    <button onClick={handleNext} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-md transition-all transform active:scale-95">
                        {isLastQuestion ? 'Finish Lesson' : 'Next Question'}
                    </button>
                  )
              ) : (
                  !feedback ? (
                    <button onClick={handleCheckAnswer} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-md transition-all transform active:scale-95">
                      Check Answer
                    </button>
                  ) : (
                    <div className={`p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in ${feedback === 'correct' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex items-center gap-3 font-bold text-lg">
                        {feedback === 'correct' ? <CheckCircle className="w-8 h-8 text-green-600"/> : <XCircle className="w-8 h-8 text-red-600"/>}
                        <span className={feedback === 'correct' ? "text-green-800" : "text-red-800"}>
                            {feedback === 'correct' ? "Excellent job!" : "Not quite right..."}
                        </span>
                      </div>
                      <button onClick={handleNext} className={`w-full sm:w-auto px-8 py-3 rounded-lg font-bold text-white shadow-sm transition-transform transform active:scale-95 ${feedback === 'correct' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                        {isLastQuestion ? 'Finish' : 'Next'}
                      </button>
                    </div>
                  )
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExercisePlayer;