// Export all services from a single entry point
export { apiClient, API_CONFIG, STORAGE_KEYS } from './api';
export { authService } from './authService';
export { gameService } from './gameService';

// Re-export commonly used functions for convenience
export const {
  login,
  register,
  logout,
  getCurrentUser,
  updateProfile,
  uploadProfilePicture,
  forgotPassword,
  resetPassword,
  initialize: initializeAuth,
  getAuthState,
  isLoggedIn,
} = authService;

export const {
  getTournaments,
  getTournamentDetails,
  registerForTournament,
  getRankings,
  getMessages,
  markMessageAsRead,
  sendMessage,
  getDashboardStats,
  searchPlayers,
} = gameService; 