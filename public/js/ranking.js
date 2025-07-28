// Ranking React Component
const { useState, useEffect } = React;

function RankingPage() {
  const [rankings, setRankings] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Men's Singles");

  useEffect(() => {
    // Simulate loading rankings data
    setTimeout(() => {
      setRankings({
        "Men's Singles": [
          { id: 1, name: "Ahmad Zulkarnain", rank: 1, points: 2850, wins: 45, losses: 8, status: "Active" },
          { id: 2, name: "Raj Kumar", rank: 2, points: 2720, wins: 42, losses: 12, status: "Active" },
          { id: 3, name: "David Chen", rank: 3, points: 2650, wins: 38, losses: 15, status: "Active" },
          { id: 4, name: "Mohammed Ali", rank: 4, points: 2580, wins: 35, losses: 18, status: "Active" },
          { id: 5, name: "Tan Wei Ming", rank: 5, points: 2510, wins: 32, losses: 20, status: "Active" },
          { id: 6, name: "Lim Chong Wei", rank: 6, points: 2450, wins: 30, losses: 22, status: "Active" },
          { id: 7, name: "Kumar Suresh", rank: 7, points: 2380, wins: 28, losses: 25, status: "Active" },
          { id: 8, name: "Wong Ah Keng", rank: 8, points: 2320, wins: 25, losses: 28, status: "Active" }
        ],
        "Men's Doubles": [
          { id: 1, name: "Ahmad Zulkarnain & Raj Kumar", rank: 1, points: 2950, wins: 48, losses: 5, status: "Active" },
          { id: 2, name: "David Chen & Tan Wei Ming", rank: 2, points: 2820, wins: 45, losses: 8, status: "Active" },
          { id: 3, name: "Mohammed Ali & Lim Chong Wei", rank: 3, points: 2750, wins: 42, losses: 12, status: "Active" },
          { id: 4, name: "Kumar Suresh & Wong Ah Keng", rank: 4, points: 2680, wins: 38, losses: 15, status: "Active" },
          { id: 5, name: "Lee Ming & Chan Ah Kow", rank: 5, points: 2610, wins: 35, losses: 18, status: "Active" },
          { id: 6, name: "Goh Keng & Teo Ah Beng", rank: 6, points: 2540, wins: 32, losses: 20, status: "Active" },
          { id: 7, name: "Ng Ah Seng & Lim Ah Keng", rank: 7, points: 2470, wins: 30, losses: 22, status: "Active" },
          { id: 8, name: "Chew Ah Meng & Tan Ah Kow", rank: 8, points: 2400, wins: 28, losses: 25, status: "Active" }
        ],
        "Women's Singles": [
          { id: 1, name: "Sarah Lim", rank: 1, points: 2850, wins: 48, losses: 5, status: "Active" },
          { id: 2, name: "Nurul Ain", rank: 2, points: 2720, wins: 45, losses: 8, status: "Active" },
          { id: 3, name: "Priya Devi", rank: 3, points: 2650, wins: 42, losses: 12, status: "Active" },
          { id: 4, name: "Emily Wong", rank: 4, points: 2580, wins: 38, losses: 15, status: "Active" },
          { id: 5, name: "Fatimah Binti", rank: 5, points: 2510, wins: 35, losses: 18, status: "Active" },
          { id: 6, name: "Aisha Rahman", rank: 6, points: 2450, wins: 32, losses: 20, status: "Active" },
          { id: 7, name: "Mei Ling Tan", rank: 7, points: 2380, wins: 30, losses: 22, status: "Active" },
          { id: 8, name: "Kavitha Raj", rank: 8, points: 2320, wins: 28, losses: 25, status: "Active" }
        ],
        "Women's Doubles": [
          { id: 1, name: "Sarah Lim & Nurul Ain", rank: 1, points: 2950, wins: 50, losses: 3, status: "Active" },
          { id: 2, name: "Priya Devi & Emily Wong", rank: 2, points: 2820, wins: 47, losses: 6, status: "Active" },
          { id: 3, name: "Fatimah Binti & Aisha Rahman", rank: 3, points: 2750, wins: 44, losses: 9, status: "Active" },
          { id: 4, name: "Mei Ling Tan & Kavitha Raj", rank: 4, points: 2680, wins: 41, losses: 12, status: "Active" },
          { id: 5, name: "Siti Aminah & Zainab Omar", rank: 5, points: 2610, wins: 38, losses: 15, status: "Active" },
          { id: 6, name: "Lily Chen & Rose Lim", rank: 6, points: 2540, wins: 35, losses: 18, status: "Active" },
          { id: 7, name: "Diana Tan & Grace Wong", rank: 7, points: 2470, wins: 32, losses: 20, status: "Active" },
          { id: 8, name: "Maria Lee & Anna Lim", rank: 8, points: 2400, wins: 30, losses: 22, status: "Active" }
        ],
        "Mixed Men's": [
          { id: 1, name: "Ahmad Zulkarnain & Sarah Lim", rank: 1, points: 3000, wins: 52, losses: 2, status: "Active" },
          { id: 2, name: "Raj Kumar & Nurul Ain", rank: 2, points: 2870, wins: 49, losses: 5, status: "Active" },
          { id: 3, name: "David Chen & Priya Devi", rank: 3, points: 2800, wins: 46, losses: 8, status: "Active" },
          { id: 4, name: "Mohammed Ali & Emily Wong", rank: 4, points: 2730, wins: 43, losses: 11, status: "Active" },
          { id: 5, name: "Tan Wei Ming & Fatimah Binti", rank: 5, points: 2660, wins: 40, losses: 14, status: "Active" },
          { id: 6, name: "Lim Chong Wei & Aisha Rahman", rank: 6, points: 2590, wins: 37, losses: 17, status: "Active" },
          { id: 7, name: "Kumar Suresh & Mei Ling Tan", rank: 7, points: 2520, wins: 34, losses: 20, status: "Active" },
          { id: 8, name: "Wong Ah Keng & Kavitha Raj", rank: 8, points: 2450, wins: 31, losses: 23, status: "Active" }
        ],
        "Mixed Women's": [
          { id: 1, name: "Sarah Lim & Ahmad Zulkarnain", rank: 1, points: 3000, wins: 52, losses: 2, status: "Active" },
          { id: 2, name: "Nurul Ain & Raj Kumar", rank: 2, points: 2870, wins: 49, losses: 5, status: "Active" },
          { id: 3, name: "Priya Devi & David Chen", rank: 3, points: 2800, wins: 46, losses: 8, status: "Active" },
          { id: 4, name: "Emily Wong & Mohammed Ali", rank: 4, points: 2730, wins: 43, losses: 11, status: "Active" },
          { id: 5, name: "Fatimah Binti & Tan Wei Ming", rank: 5, points: 2660, wins: 40, losses: 14, status: "Active" },
          { id: 6, name: "Aisha Rahman & Lim Chong Wei", rank: 6, points: 2590, wins: 37, losses: 17, status: "Active" },
          { id: 7, name: "Mei Ling Tan & Kumar Suresh", rank: 7, points: 2520, wins: 34, losses: 20, status: "Active" },
          { id: 8, name: "Kavitha Raj & Wong Ah Keng", rank: 8, points: 2450, wins: 31, losses: 23, status: "Active" }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  const categories = [
    "Men's Singles",
    "Men's Doubles", 
    "Women's Singles",
    "Women's Doubles",
    "Mixed Men's",
    "Mixed Women's"
  ];

  const currentRankings = rankings[selectedCategory] || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-block mb-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-2">
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Player Rankings
            </span>
          </div>
        </div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 mb-6 leading-tight">
          Malaysia Rankings
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full mb-8"></div>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Discover the top pickleball players across Malaysia with our comprehensive ranking system
        </p>
      </div>

      {/* Category Selection */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/30 backdrop-blur-md rounded-full p-2 flex flex-wrap justify-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-white/50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-white/30 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedCategory}</h2>
          <p className="text-gray-600">Top 8 Players</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 font-bold text-gray-800">Rank</th>
                <th className="text-left py-4 px-6 font-bold text-gray-800">Player/Team</th>
                <th className="text-left py-4 px-6 font-bold text-gray-800">Points</th>
                <th className="text-left py-4 px-6 font-bold text-gray-800">Record</th>
                <th className="text-left py-4 px-6 font-bold text-gray-800">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentRankings.map((player, index) => (
                <tr key={player.id} className="border-b border-gray-100 hover:bg-white/20 transition-colors duration-200">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <span className={`text-2xl font-bold ${
                        index === 0 ? 'text-yellow-500' : 
                        index === 1 ? 'text-gray-400' : 
                        index === 2 ? 'text-orange-500' : 'text-gray-600'
                      }`}>
                        #{player.rank}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{player.name}</div>
                        <div className="text-sm text-gray-600">ID: {player.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-gray-800">{player.points.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">points</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm">
                      <span className="text-green-600 font-semibold">{player.wins}W</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-600 font-semibold">{player.losses}L</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {((player.wins / (player.wins + player.losses)) * 100).toFixed(1)}% win rate
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      {player.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{currentRankings.length}</div>
          <div className="text-gray-600">Total Players</div>
        </div>
        <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {currentRankings.reduce((sum, player) => sum + player.wins, 0)}
          </div>
          <div className="text-gray-600">Total Wins</div>
        </div>
        <div className="bg-white/30 backdrop-blur-md rounded-2xl p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {currentRankings.reduce((sum, player) => sum + player.points, 0).toLocaleString()}
          </div>
          <div className="text-gray-600">Total Points</div>
        </div>
      </div>
    </div>
  );
}

// Render the component when the page loads
document.addEventListener('DOMContentLoaded', function() {
  const rankingContainer = document.getElementById('ranking-root');
  if (rankingContainer) {
    ReactDOM.render(React.createElement(RankingPage), rankingContainer);
  }
}); 