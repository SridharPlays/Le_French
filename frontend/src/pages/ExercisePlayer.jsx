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
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  // State for Matching Game
  const [matchSelection, setMatchSelection] = useState({ left: null, right: null });
  const [matchedPairs, setMatchedPairs] = useState([]); // Array of IDs or strings

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const res = await api.get(`/exercise/${id}`);
        setExercise(res.data);
        console.log(res.data);
      } catch (err) {
        alert("Failed to load exercise", err);
        navigate('/');
      }
    };
    fetchExercise();
  }, [id, navigate]);

  if (!exercise) return <div className="p-10 text-center">Loading Game...</div>;

  const currentQ = exercise.questions[currentQIndex];
  const isLastQuestion = currentQIndex === exercise.questions.length - 1;

  // --- LOGIC: Check Answer ---
  const handleCheckAnswer = () => {
    let isCorrect = false;
    const content = currentQ.content;

    switch (currentQ.question_type) {
      case 'fill_blank':
        if (userAnswer.trim().toLowerCase() === content.answer.toLowerCase()) isCorrect = true;
        break;
      case 'true_false':
        // userAnswer is string 'true'/'false', content.isTrue is boolean
        if ((userAnswer === 'true') === content.isTrue) isCorrect = true;
        break;
      case 'story':
        if (userAnswer.trim().toLowerCase() === content.answer.toLowerCase()) isCorrect = true;
        break;
      case 'match':
        // Matching is auto-checked as you go. If we are here, we just check if all matches are found.
        // For simplicity in this MVP, if they cleared the board, it's correct.
        if (matchedPairs.length === content.pairs.length) isCorrect = true;
        break;
      default:
        break;
    }

    if (isCorrect) {
      setFeedback('correct');
      setScore(s => s + 1);
      // Sound effect could go here
    } else {
      setFeedback('wrong');
    }
  };

  // --- LOGIC: Next Question / Finish ---
  const handleNext = async () => {
    setFeedback(null);
    setUserAnswer('');
    setMatchedPairs([]);

    if (isLastQuestion) {
      await finishExercise();
    } else {
      setCurrentQIndex(prev => prev + 1);
    }
  };

  const finishExercise = async () => {
  try {
    // DEBUG LOG: Check what we are sending
    console.log("Finishing exercise with ID:", exercise.exercise_id); 

    await api.post('/progress/complete', {
      // We should use the exercise_id as the lesson_id to keep it unique and consistent
      lesson_id: exercise.exercise_id.toString(), 
      xp_gained: exercise.xp_reward
    });
    
    setCompleted(true);
  } catch (err) {
    console.error("Error details:", err.response?.data); // See the specific server error message
    alert("Error saving progress: " + (err.response?.data?.msg || "Unknown error"));
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
      <button 
        onClick={() => setUserAnswer('true')}
        className={`px-8 py-4 rounded-xl border-2 font-bold transition ${userAnswer === 'true' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
      >
        VRAI (True)
      </button>
      <button 
        onClick={() => setUserAnswer('false')}
        className={`px-8 py-4 rounded-xl border-2 font-bold transition ${userAnswer === 'false' ? 'bg-blue-100 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
      >
        FAUX (False)
      </button>
    </div>
  );

  const renderStory = () => (
    <div className="my-4">
      <div className="bg-orange-50 p-6 rounded-lg border border-orange-100 text-gray-800 italic mb-6 leading-relaxed">
        "{currentQ.content.story}"
      </div>
      <p className="font-bold text-center mb-2">{currentQ.content.question}</p>
      <input 
        className="w-full p-3 border rounded-lg"
        placeholder="Type your answer..."
        value={userAnswer}
        onChange={e => setUserAnswer(e.target.value)}
      />
    </div>
  );

  // Matching Game Logic
  const handleMatchClick = (side, item, index) => {
    // If already matched, ignore
    if (matchedPairs.includes(index)) return;

    const newSelection = { ...matchSelection, [side]: { item, index } };
    setMatchSelection(newSelection);

    // Check if both sides are selected
    if (newSelection.left && newSelection.right) {
      // Check if indexes match (assuming pairs are stored in same index order in DB JSON)
      if (newSelection.left.index === newSelection.right.index) {
        setMatchedPairs([...matchedPairs, newSelection.left.index]);
        setMatchSelection({ left: null, right: null });
      } else {
        // Reset after short delay to show wrong
        setTimeout(() => setMatchSelection({ left: null, right: null }), 500);
      }
    }
  };

  const renderMatch = () => {
    const pairs = currentQ.content.pairs;
    const isAllMatched = matchedPairs.length === pairs.length;
    
    // Auto-set user answer to 'done' if all matched so "Check" works
    if (isAllMatched && userAnswer !== 'done') setUserAnswer('done');

    return (
      <div className="grid grid-cols-2 gap-8 my-6">
        <div className="space-y-3">
          {pairs.map((p, i) => (
            <button 
              key={`L-${i}`}
              disabled={matchedPairs.includes(i)}
              onClick={() => handleMatchClick('left', p.left, i)}
              className={`w-full p-4 rounded-lg border-2 font-bold transition ${
                matchedPairs.includes(i) ? 'opacity-0' : 
                matchSelection.left?.index === i ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200'
              }`}
            >
              {p.left}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {pairs.map((p, i) => (
             <button 
             key={`R-${i}`}
             disabled={matchedPairs.includes(i)}
             onClick={() => handleMatchClick('right', p.right, i)}
             className={`w-full p-4 rounded-lg border-2 font-bold transition ${
               matchedPairs.includes(i) ? 'opacity-0' : 
               matchSelection.right?.index === i ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200'
             }`}
           >
             {p.right}
           </button>
          ))}
        </div>
      </div>
    );
  };

  // --- FINAL SCREEN ---
  if (completed) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full animate-fade-in">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Lesson Complete!</h1>
          <p className="text-gray-500 mb-6">You scored {score} out of {exercise.questions.length}</p>
          
          <div className="bg-green-50 text-green-800 p-4 rounded-lg font-bold mb-8 border border-green-100">
            +{exercise.xp_reward} XP Earned
          </div>
          
          <button onClick={() => navigate('/')} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- GAME SCREEN ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm flex justify-between items-center">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">
          <ArrowLeft />
        </button>
        <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 mx-4">
          <div 
            className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${((currentQIndex) / exercise.questions.length) * 100}%` }}
          ></div>
        </div>
        <div className="font-bold text-gray-600 w-12 text-right">
          {currentQIndex + 1}/{exercise.questions.length}
        </div>
      </div>

      {/* Main Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg border border-gray-200 p-8 relative min-h-[400px] flex flex-col">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <HelpCircle className="w-4 h-4"/> {currentQ.question_type.replace('_', ' ')}
            </h2>

            {/* DYNAMIC CONTENT RENDERER */}
            <div className="flex-1">
              {currentQ.question_type === 'fill_blank' && renderFillBlank()}
              {currentQ.question_type === 'true_false' && renderTrueFalse()}
              {currentQ.question_type === 'match' && renderMatch()}
              {currentQ.question_type === 'story' && renderStory()}
            </div>

            {/* FOOTER AREA (Feedback & Button) */}
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
                  <button 
                    onClick={handleNext}
                    className={`px-6 py-2 rounded-lg font-bold text-white shadow ${feedback === 'correct' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
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