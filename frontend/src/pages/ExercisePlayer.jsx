/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import { ArrowLeft, CheckCircle, XCircle, Trophy, HelpCircle, Mic } from 'lucide-react';
import { Client } from "@gradio/client";
import { MediaRecorder as WavMediaRecorder, register } from 'extendable-media-recorder';
import { connect } from 'extendable-media-recorder-wav-encoder';

const ExercisePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [exercise, setExercise] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null); 
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // New Tracking Stats
  const [mistakesCount, setMistakesCount] = useState(0); 

  // State for Matching Game
  const [matchSelection, setMatchSelection] = useState({ left: null, right: null });
  const [matchedPairs, setMatchedPairs] = useState([]);

  // State for Jumbled Sentence
  const [jumbledWords, setJumbledWords] = useState([]);
  const [constructedSentence, setConstructedSentence] = useState([]);

  // State for Speaking
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
        console.log("✅ WAV Encoder registered");
      } catch (error) {
        // Ignore if already registered
      }
      setRecorderReady(true);
    };
    initWavEncoder();
  }, []);

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

  // When question changes, reset states
  useEffect(() => {
    if (!exercise) return;
    const currentQ = exercise.questions[currentQIndex];
    
    setUserAnswer('');
    setFeedback(null);
    setSpeakingResult(null);
    setAudioUrl(null);

    if (currentQ.question_type === 'jumbled_sentence') {
      const words = currentQ.content.sentence.split(' ');
      for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
      }
      setJumbledWords(words.map((w, i) => ({ id: i, word: w }))); 
      setConstructedSentence([]);
    }
  }, [currentQIndex, exercise]);

  // --- Speaking Logic ---
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
      console.error(err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
  };

  const handleAnalysis = async (audioBlob) => {
    setIsAnalyzing(true);
    try {
      const client = await Client.connect("https://sanpro-hhbhebb3d6gpekfk.centralindia-01.azurewebsites.net/");
      const currentQ = exercise.questions[currentQIndex];
      const payload = [
        audioBlob,
        "Custom",
        null,
        currentQ.content.text, // Reference text
        "Guest_User",
        "Web_App",
        "Student"
      ];
      const response = await client.predict("/run_eval", payload);
      setSpeakingResult(response.data[0]); // Store feedback
      
      // Auto-mark correct if we get a result (simplification)
      setFeedback('correct');
      setScore(s => s + 1);
    } catch (err) {
      console.error(err);
      alert("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!exercise) return <div className="p-10 text-center">Loading Game...</div>;

  const currentQ = exercise.questions[currentQIndex];
  const isLastQuestion = currentQIndex === exercise.questions.length - 1;

  // Check Answer (Standard)
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
        { const userSent = constructedSentence.map(w => w.word).join(' ');
        if (userSent === content.sentence) isCorrect = true;
        break; }
      default:
        break;
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

    if (isLastQuestion) {
      await finishExercise();
    } else {
      setCurrentQIndex(prev => prev + 1);
    }
  };

  const finishExercise = async () => {
    try {
      await api.post('/progress/complete', {
        lesson_id: exercise.exercise_id.toString(), 
        xp_gained: exercise.xp_reward,
        mistakes: mistakesCount
      });
      setCompleted(true);
    } catch (err) {
      alert("Error saving progress");
    }
  };

  // --- RENDERERS ---

  const renderFillBlank = () => {
    const parts = currentQ.content.text.split('___');
    return (
      <div className="text-xl text-center font-medium my-8 leading-loose">
        {parts[0]}
        <input 
          className="border-b-2 border-gray-400 bg-gray-50 px-2 py-1 mx-2 text-blue-600 font-bold focus:outline-none focus:border-blue-600 w-32 text-center"
          value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          autoFocus
        />
        {parts[1]}
      </div>
    );
  };

  const renderTrueFalse = () => (
    <div className="flex gap-4 justify-center my-8">
      <div className="text-xl font-bold mb-4 w-full text-center absolute top-20">{currentQ.content.statement}</div>
      <button onClick={() => setUserAnswer('true')} className={`px-8 py-4 rounded-xl border-2 font-bold ${userAnswer === 'true' ? 'bg-blue-100 border-blue-500' : 'border-gray-200'}`}>VRAI (True)</button>
      <button onClick={() => setUserAnswer('false')} className={`px-8 py-4 rounded-xl border-2 font-bold ${userAnswer === 'false' ? 'bg-blue-100 border-blue-500' : 'border-gray-200'}`}>FAUX (False)</button>
    </div>
  );

  const renderJumbledSentence = () => {
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
        <div className="my-8">
            <div className="text-center text-gray-500 mb-6 font-medium">Construct the sentence:</div>
            <div className="min-h-20 border-b-2 border-gray-300 mb-8 flex flex-wrap gap-2 justify-center items-center p-4 bg-gray-50 rounded-t-xl">
                {constructedSentence.length === 0 && <span className="text-gray-300 italic">Tap words to build...</span>}
                {constructedSentence.map((w) => (
                    <button key={w.id} onClick={() => handleWordClick(w, false)} className="px-4 py-2 bg-white border-2 border-blue-500 text-blue-700 font-bold rounded-lg shadow-sm hover:bg-red-50">
                        {w.word}
                    </button>
                ))}
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
                {jumbledWords.map((w) => (
                    <button key={w.id} onClick={() => handleWordClick(w, true)} className="px-4 py-2 bg-gray-100 border-b-4 border-gray-300 text-gray-700 font-bold rounded-lg active:border-b-0 active:mt-1 transition-all">
                        {w.word}
                    </button>
                ))}
            </div>
        </div>
    );
  };

  const renderMatch = () => {
    const pairs = currentQ.content.pairs;
    if (matchedPairs.length === pairs.length && userAnswer !== 'done') setUserAnswer('done');

    return (
      <div className="grid grid-cols-2 gap-8 my-6">
        <div className="space-y-3">
          {pairs.map((p, i) => (
            <button 
              key={`L-${i}`} disabled={matchedPairs.includes(i)}
              onClick={() => {
                  const newSel = { ...matchSelection, left: { item: p.left, index: i } };
                  setMatchSelection(newSel);
                  if (newSel.right && newSel.right.index === i) { setMatchedPairs([...matchedPairs, i]); setMatchSelection({left:null, right:null}); }
                  else if (newSel.right) setTimeout(() => setMatchSelection({left:null, right:null}), 500);
              }}
              className={`w-full p-4 rounded-lg border-2 font-bold ${matchedPairs.includes(i)?'opacity-0':matchSelection.left?.index===i?'bg-blue-100 border-blue-500':'bg-white'}`}
            >{p.left}</button>
          ))}
        </div>
        <div className="space-y-3">
          {pairs.map((p, i) => (
            <button 
              key={`R-${i}`} disabled={matchedPairs.includes(i)}
              onClick={() => {
                  const newSel = { ...matchSelection, right: { item: p.right, index: i } };
                  setMatchSelection(newSel);
                  if (newSel.left && newSel.left.index === i) { setMatchedPairs([...matchedPairs, i]); setMatchSelection({left:null, right:null}); }
                  else if (newSel.left) setTimeout(() => setMatchSelection({left:null, right:null}), 500);
              }}
              className={`w-full p-4 rounded-lg border-2 font-bold ${matchedPairs.includes(i)?'opacity-0':matchSelection.right?.index===i?'bg-blue-100 border-blue-500':'bg-white'}`}
            >{p.right}</button>
          ))}
        </div>
      </div>
    );
  };

  const renderStory = () => (
    <div className="my-4">
      <div className="bg-orange-50 p-6 rounded-lg border border-orange-100 text-gray-800 italic mb-6 leading-relaxed">"{currentQ.content.story}"</div>
      <p className="font-bold text-center mb-2">{currentQ.content.question}</p>
      <input className="w-full p-3 border rounded-lg" placeholder="Answer..." value={userAnswer} onChange={e => setUserAnswer(e.target.value)}/>
    </div>
  );

  const renderSpeaking = () => (
    <div className="flex flex-col items-center justify-center gap-6 my-8">
        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 text-center w-full">
            <p className="text-xs text-rose-400 font-bold uppercase tracking-wider mb-2">Pronounce this:</p>
            <h3 className="text-2xl font-extrabold text-rose-900">{currentQ.content.text}</h3>
        </div>

        <div className="flex gap-4 items-center">
            {!isRecording ? (
                <button 
                    onClick={startRecording} 
                    disabled={isAnalyzing || !recorderReady}
                    className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-110 ${isAnalyzing ? 'bg-gray-300 cursor-not-allowed' : 'bg-linear-to-br from-rose-500 to-red-700 text-white shadow-rose-500/40'}`}
                >
                    <Mic className="w-8 h-8" />
                </button>
            ) : (
                <button 
                    onClick={stopRecording} 
                    className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center shadow-lg animate-pulse ring-4 ring-rose-200"
                >
                    <div className="w-8 h-8 bg-white rounded-md"></div>
                </button>
            )}
        </div>

        {isAnalyzing && (
            <span className="text-sm font-bold text-rose-600 animate-bounce flex items-center gap-2">
                Is Analyzing...
            </span>
        )}

        {speakingResult && (
            <div className="w-full bg-white border border-gray-200 rounded-xl p-4 mt-4 prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: speakingResult }} />
                {audioUrl && <audio src={audioUrl} controls className="w-full mt-4 h-8" />}
            </div>
        )}
    </div>
  );

  // FINAL SCREEN
  if (completed) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full animate-fade-in">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Lesson Complete!</h1>
          
          <div className="grid grid-cols-2 gap-4 mb-6 mt-6">
             <div className="bg-gray-50 p-3 rounded-lg border">
                <div className="text-xs text-gray-500 uppercase font-bold">Accuracy</div>
                <div className="text-xl font-bold text-gray-800">{Math.round((score / exercise.questions.length)*100)}%</div>
             </div>
             <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <div className="text-xs text-red-500 uppercase font-bold">Mistakes</div>
                <div className="text-xl font-bold text-red-700">{mistakesCount}</div>
             </div>
          </div>

          <p className="text-gray-500 mb-6">You scored {score} out of {exercise.questions.length}</p>
          <div className="bg-green-50 text-green-800 p-4 rounded-lg font-bold mb-8 border border-green-100">+{exercise.xp_reward} XP Earned</div>
          <button onClick={() => navigate('/')} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  // GAME SCREEN
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white p-4 shadow-sm flex justify-between items-center">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full"><ArrowLeft /></button>
        <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 mx-4">
          <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${((currentQIndex) / exercise.questions.length) * 100}%` }}></div>
        </div>
        <div className="font-bold text-gray-600 w-12 text-right">{currentQIndex + 1}/{exercise.questions.length}</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg border border-gray-200 p-8 relative min-h-[400px] flex flex-col">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <HelpCircle className="w-4 h-4"/> {currentQ.question_type.replace('_', ' ')}
            </h2>

            <div className="flex-1">
              {currentQ.question_type === 'fill_blank' && renderFillBlank()}
              {currentQ.question_type === 'true_false' && renderTrueFalse()}
              {currentQ.question_type === 'match' && renderMatch()}
              {currentQ.question_type === 'story' && renderStory()}
              {currentQ.question_type === 'jumbled_sentence' && renderJumbledSentence()}
              {currentQ.question_type === 'speaking' && renderSpeaking()}
            </div>

            <div className="border-t pt-6 mt-6">
              {/* For speaking, the 'Check' is implicitly done by the API analysis, so we just show Next */}
              {currentQ.question_type === 'speaking' ? (
                  feedback === 'correct' && (
                    <button onClick={handleNext} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-md">
                        {isLastQuestion ? 'Finish' : 'Next'}
                    </button>
                  )
              ) : (
                  !feedback ? (
                    <button onClick={handleCheckAnswer} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-md transition transform active:scale-95">
                      Check Answer
                    </button>
                  ) : (
                    <div className={`p-4 rounded-xl flex items-center justify-between ${feedback === 'correct' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      <div className="flex items-center gap-3 font-bold text-lg">
                        {feedback === 'correct' ? <CheckCircle className="w-8 h-8"/> : <XCircle className="w-8 h-8"/>}
                        {feedback === 'correct' ? "Excellent!" : "Not quite right..."}
                      </div>
                      <button onClick={handleNext} className={`px-6 py-2 rounded-lg font-bold text-white shadow ${feedback === 'correct' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
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