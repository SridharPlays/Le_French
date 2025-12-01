import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosClient';
import { ArrowLeft, Book, Star, GraduationCap, Bookmark } from 'lucide-react';

const StudyZone = () => {
    const navigate = useNavigate();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedChapter, setSelectedChapter] = useState('all');

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const res = await api.get('/study_materials');
                setMaterials(res.data);
            } catch (err) {
                console.error("Failed to load study materials", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMaterials();
    }, []);

    // Extract unique chapter titles for filter
    const chapters = [...new Set(materials.map(m => m.chapter_title))];
    
    const filteredMaterials = selectedChapter === 'all' 
        ? materials 
        : materials.filter(m => m.chapter_title === selectedChapter);

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-4 md:p-8">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-8">
                <button 
                    onClick={() => navigate('/')} 
                    className="mb-4 flex items-center gap-2 text-gray-500 hover:text-red-800 font-bold transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Dashboard
                </button>

                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-full">
                        <GraduationCap className="w-8 h-8 text-red-800" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Study Zone</h1>
                        <p className="text-gray-500">Review grammar rules, vocabulary, and notes.</p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto">
                
                {/* Chapter Filter */}
                {chapters.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto mb-8 pb-2 scrollbar-hide">
                        <button 
                            onClick={() => setSelectedChapter('all')}
                            className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedChapter === 'all' ? 'bg-red-800 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            All Chapters
                        </button>
                        {chapters.map(c => (
                            <button 
                                key={c}
                                onClick={() => setSelectedChapter(c)}
                                className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedChapter === c ? 'bg-red-800 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-800"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredMaterials.map(item => (
                            <div key={item.material_id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300">
                                <div className="bg-linear-to-r from-gray-50 to-white p-4 border-b border-gray-100 flex justify-between items-start">
                                    <div>
                                        <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <Book className="w-3 h-3" />
                                            {item.chapter_title}
                                        </div>
                                        <h3 className="font-bold text-xl text-gray-900">{item.title}</h3>
                                    </div>
                                    <div className={`p-2 rounded-full ${item.category === 'grammar' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {item.category === 'grammar' ? <Star className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div 
                                        className="prose prose-sm max-w-none text-gray-600 prose-headings:font-bold prose-a:text-red-600"
                                        dangerouslySetInnerHTML={{ __html: item.content }} 
                                    />
                                </div>
                            </div>
                        ))}
                        
                        {filteredMaterials.length === 0 && (
                            <div className="col-span-full text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                                <Book className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>No study materials found for this section yet.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyZone;