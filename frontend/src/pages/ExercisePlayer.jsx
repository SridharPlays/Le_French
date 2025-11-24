import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import { ArrowLeft, CheckCircle, XCircle, Trophy, HelpCircle } from 'lucide-react';

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

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const res = await api.get(`/exercise/${id}`);
        setExercise(res.data);
      } catch (err) {
        alert("Failed to load exercise", err);
        navigate('/');
      }
    };
    fetchExercise();
  }, [id, navigate]);

  // When question changes, prepare specific states
  useEffect(() => {
    if (!exercise) return;
    const currentQ = exercise.questions[currentQIndex];
    
    // Reset inputs
    setUserAnswer('');
    setFeedback(null);

    // If Jumbled Sentence, shuffle words
    if (currentQ.question_type === 'jumbled_sentence') {
      const words = currentQ.content.sentence.split(' ');
      // Fisher-Yates shuffle
      for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
      }
      setJumbledWords(words.map((w, i) => ({ id: i, word: w }))); // Add ID to handle duplicate words
      setConstructedSentence([]);
    }
  }, [currentQIndex, exercise]);

  if (!exercise) return <div className="p-10 text-center">Loading Game...</div>;

  const currentQ = exercise.questions[currentQIndex];
  const isLastQuestion = currentQIndex === exercise.questions.length - 1;

  // Check Answer
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
        // Join constructed words and compare
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
      setMistakesCount(prev => prev + 1); // Track mistake
    }
  };

  const handleNext = async () => {
    setFeedback(null);
    setUserAnswer('');
    setMatchedPairs([]);
    setConstructedSentence([]);

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
        mistakes: mistakesCount // SEND MISTAKES TO BACKEND
      });
      setCompleted(true);
    } catch (err) {
      alert("Error saving progress", err);
    }
  };

  // RENDERERS

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
        if(feedback === 'correct') return; // Lock if finished
        if (fromSource) {
            // Move from Bank to Sentence
            setJumbledWords(prev => prev.filter(w => w.id !== wordObj.id));
            setConstructedSentence(prev => [...prev, wordObj]);
        } else {
            // Move from Sentence back to Bank
            setConstructedSentence(prev => prev.filter(w => w.id !== wordObj.id));
            setJumbledWords(prev => [...prev, wordObj]);
        }
    };

    return (
        <div className="my-8">
            <div className="text-center text-gray-500 mb-6 font-medium">Construct the sentence:</div>
            
            {/* 1. Construction Zone */}
            <div className="min-h-20 border-b-2 border-gray-300 mb-8 flex flex-wrap gap-2 justify-center items-center p-4 bg-gray-50 rounded-t-xl">
                {constructedSentence.length === 0 && <span className="text-gray-300 italic">Tap words to build...</span>}
                {constructedSentence.map((w) => (
                    <button 
                        key={w.id} 
                        onClick={() => handleWordClick(w, false)}
                        className="px-4 py-2 bg-white border-2 border-blue-500 text-blue-700 font-bold rounded-lg shadow-sm hover:bg-red-50"
                    >
                        {w.word}
                    </button>
                ))}
            </div>

            {/* 2. Word Bank */}
            <div className="flex flex-wrap gap-3 justify-center">
                {jumbledWords.map((w) => (
                    <button 
                        key={w.id} 
                        onClick={() => handleWordClick(w, true)}
                        className="px-4 py-2 bg-gray-100 border-b-4 border-gray-300 text-gray-700 font-bold rounded-lg active:border-b-0 active:mt-1 transition-all"
                    >
                        {w.word}
                    </button>
                ))}
            </div>
        </div>
    );
  };

  const renderMatch = () => {
    const pairs = currentQ.content.pairs;
    if (matchedPairs.length === pairs.length && userAnswer !== 'done') setUserAnswer('done'); // Auto trigger check availability

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

  // FINAL SCREEN
  if (completed) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full animate-fade-in">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Lesson Complete!</h1>
          
          {/* NEW STATS DISPLAY */}
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
              {currentQ.question_type === 'jumbled_sentence' && renderJumbledSentence()} {/* NEW RENDERER */}
            </div>

            <div className="border-t pt-6 mt-6">
              {!feedback ? (
                <button 
                  onClick={handleCheckAnswer}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg shadow-md transition transform active:scale-95"
                >
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
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExercisePlayer;