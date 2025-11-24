import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../api/axiosClient';
import { 
  User, 
  ArrowLeft, 
  Mail, 
  Fingerprint, 
  School, 
  Award, 
  Trophy, 
  Users, 
  Shield 
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuthStore();
  const [classData, setClassData] = useState({ batch_name: '', students: [] });
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(null);
  const [myXp, setMyXp] = useState(0);

  useEffect(() => {
    // If user is admin or doesn't have a batch, skip the fetch
    if (!user?.batch_id) {
      setLoading(false);
      return;
    }

    const fetchClassData = async () => {
      try {
        const res = await api.get(`/batch/${user.batch_id}/full`);
        const data = res.data;
        setClassData(data);

        // Calculate My Rank & XP
        const myIndex = data.students.findIndex(s => s.email === user.email);
        if (myIndex !== -1) {
          setMyRank(myIndex + 1);
          setMyXp(data.students[myIndex].total_xp);
        }
      } catch (err) {
        console.error("Failed to fetch batch details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClassData();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      
      {/* Navbar */}
      <nav className="bg-red-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <User className="w-6 h-6" />
            Mon Profil
          </h1>
          <Link 
            to={user?.role === 'admin' ? "/admin" : "/"} 
            className="text-sm bg-red-800 hover:bg-red-700 px-4 py-2 rounded-lg transition flex items-center gap-2 border border-red-700 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {user?.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 mt-8 max-w-5xl">
        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 flex flex-col md:flex-row border border-gray-100">
          
          <div className="p-8 flex-1">
            <div className="uppercase tracking-wide text-xs text-red-600 font-bold mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Student Identity
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
              {user?.name}
              {user?.role === 'admin' && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full border border-red-200">ADMIN</span>}
            </h2>
            
            <div className="space-y-4 text-gray-600">
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="font-medium">{user?.email}</span>
              </div>
              
              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                <Fingerprint className="w-5 h-5 text-gray-400" />
                <span className="font-mono text-base">{user?.registration_number || 'No Registration ID'}</span>
              </div>

              <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                <School className="w-5 h-5 text-gray-400" />
                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-sm font-bold border border-blue-100">
                  {loading ? 'Loading...' : (classData.batch_name || 'No Batch Assigned')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-linear-to-br from-red-900 to-red-800 text-white p-8 md:w-96 flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 rounded-full bg-white opacity-5 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 rounded-full bg-black opacity-10 blur-xl"></div>
            
            <div className="text-xs font-bold text-red-200 uppercase tracking-widest mb-4 flex items-center gap-2 z-10">
              <Trophy className="w-4 h-4" /> Current Standing
            </div>
            
            {user?.role === 'admin' ? (
              <div className="z-10">
                <Award className="w-20 h-20 text-red-200 opacity-80 mb-2" />
                <div className="text-xl font-bold">Administrator</div>
              </div>
            ) : (
              <div className="z-10 w-full">
                <div className="text-7xl font-black mb-2 drop-shadow-lg">
                  {loading ? '-' : <span className="flex justify-center items-start text-white"><span className="text-4xl mt-2 opacity-50">#</span>{myRank}</span>}
                </div>
                <div className="text-red-200 text-sm mb-6 font-medium">Class Rank</div>
                
                <div className="bg-black/20 rounded-xl p-4 backdrop-blur-sm border-2 border-white/80 border-opacity-10">
                  <div className="text-xs text-red-200 uppercase font-bold mb-1">Total Experience</div>
                  <div className="text-2xl font-bold text-white">{myXp.toLocaleString()} XP</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Bottom Section: Full Class Roster (Only for Students) */}
        {user?.role !== 'admin' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-red-700" /> 
                Batch Leaderboard
              </h3>
              <span className="text-xs text-gray-500 font-medium bg-white px-2 py-1 rounded border border-gray-200">
                {classData.students.length} Students
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-400 italic">Loading class data...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider">
                    <tr>
                      <th className="py-4 px-6 w-20 text-center">Rank</th>
                      <th className="py-4 px-6">Student</th>
                      <th className="py-4 px-6 hidden sm:table-cell">Reg No.</th>
                      <th className="py-4 px-6 text-right">Total XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {classData.students.map((student, index) => {
                      const isMe = student.email === user.email;
                      const rank = index + 1;
                      
                      // Rank Badge Color Logic
                      let rankBadgeClass = "bg-gray-100 text-gray-600";
                      if (rank === 1) rankBadgeClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
                      if (rank === 2) rankBadgeClass = "bg-gray-200 text-gray-700 border-gray-300";
                      if (rank === 3) rankBadgeClass = "bg-orange-100 text-orange-800 border-orange-200";

                      return (
                        <tr 
                          key={student.user_id} 
                          className={`transition-colors ${isMe ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                        >
                          <td className="py-3 px-6 text-center">
                            <div className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full border text-xs font-bold ${rankBadgeClass}`}>
                              {rank}
                            </div>
                          </td>
                          <td className="py-3 px-6">
                            <div className="flex flex-col">
                              <span className={`font-bold ${isMe ? 'text-red-900' : 'text-gray-800'}`}>
                                {student.name}
                                {isMe && <span className="ml-2 text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded uppercase">You</span>}
                              </span>
                              <span className="text-xs text-gray-400 sm:hidden">{student.email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-6 text-sm text-gray-500 font-mono hidden sm:table-cell">
                            {student.registration_number || '-'}
                          </td>
                          <td className="py-3 px-6 text-right">
                            <span className="font-bold text-gray-800">{student.total_xp}</span> 
                            <span className="text-xs text-gray-400 ml-1">XP</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;