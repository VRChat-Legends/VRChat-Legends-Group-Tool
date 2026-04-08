const BASE = '';

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const isForm = options.body instanceof FormData;
  const headers = isForm ? { ...options.headers } : { 'Content-Type': 'application/json', ...options.headers };
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || 'Request failed');
  }
  const ct = res.headers.get('content-type');
  if (ct && ct.includes('application/json')) return res.json();
  return res;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: (path, body) => request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: (path) => request(path, { method: 'DELETE' }),

  status: () => api.get('/api/status'),
  settings: () => api.get('/api/settings'),
  saveSettings: (data) => api.post('/api/settings', data),
  authEntries: () => api.get('/api/auth-entries'),
  addAuthEntry: (key, value) => api.post('/api/auth-entries', { key, value }),
  deleteAuthEntry: (key) => api.delete(`/api/auth-entries/${encodeURIComponent(key)}`),
  analytics: () => api.get('/api/analytics'),
  chatbox: () => api.get('/api/chatbox'),
  saveChatbox: (data) => api.post('/api/chatbox', data),
  chatboxPreview: (lines, shrinkBackground = false) =>
    api.post('/api/chatbox-preview', { lines, shrink_background: shrinkBackground }),
  discord: () => api.get('/api/discord'),
  saveDiscord: (data) => api.post('/api/discord', data),
  commands: () => api.get('/api/commands'),
  saveCommands: (data) => api.post('/api/commands', data),
  userInfo: (name) => api.get(`/api/user-info?name=${encodeURIComponent(name)}`),
  userInfoById: (userId) => api.get(`/api/user-info-by-id?userId=${encodeURIComponent(userId)}`),
  userAction: (action, userId, message) => api.post('/api/user-action', { action, userId, message }),

  friends: () => api.get('/api/friends'),
  favoriteGroups: () => api.get('/api/favorite-groups'),
  removeFriend: (userId) => api.post('/api/remove-friend', { userId }),
  currentUserFiles: () => api.get('/api/current-user-files'),
  updateCurrentUserBio: (bio) => api.patch('/api/current-user', { bio }),
  /** @param {{ bio?: string, status?: string, status_description?: string }} fields */
  updateCurrentUser: (fields) => api.patch('/api/current-user', fields),

  inviteLobby: () => api.post('/api/invite-lobby'),
  friendLobby: () => api.post('/api/friend-lobby'),
  inviteAllFriends: () => api.post('/api/invite-all-friends'),
  inviteEvent: () => api.post('/api/invite-event'),
  autoInvite: (enabled) => api.post('/api/auto-invite', { enabled }),
  autoAcceptFriend: (enabled) => api.post('/api/auto-accept-friend', { enabled }),
  autoEventInvite: (enabled) => api.post('/api/auto-event-invite', { enabled }),
  clearLogs: () => api.post('/api/clear-logs'),
  clearUsers: () => api.post('/api/clear-users'),
  emergencyStop: () => api.post('/api/emergency-stop'),
  logout: () => api.post('/api/logout'),

  setupWizardStatus: () => api.get('/api/setup-wizard'),
  setupWizardComplete: (data) => api.post('/api/setup-wizard', data),

  installPath: () => api.get('/api/install-path'),
  openInstallFolder: () => api.post('/api/open-install-folder'),
  launchUninstaller: () => api.post('/api/launch-uninstaller'),
  vrchatStatus: () => api.get('/api/vrchat-status'),
  vrchatRefresh: () => api.post('/api/vrchat-refresh'),
  restart: () => api.post('/api/restart'),
  exportData: () => api.get('/api/export-data'),

  // ── VRChat API proxy endpoints ──────────────────────────
  getWorld: (worldId) => api.get(`/api/world/${encodeURIComponent(worldId)}`),
  getInstance: (worldId, instanceId) => api.get(`/api/world/${encodeURIComponent(worldId)}/instance/${encodeURIComponent(instanceId)}`),

  notifications: () => api.get('/api/notifications'),
  acceptNotification: (id) => api.post(`/api/notifications/${encodeURIComponent(id)}/accept`),
  deleteNotification: (id) => api.delete(`/api/notifications/${encodeURIComponent(id)}`),

  friendStatus: (userId) => api.get(`/api/friend-status/${encodeURIComponent(userId)}`),
  sendFriendRequest: (userId) => api.post(`/api/friend-request/${encodeURIComponent(userId)}`),

  playerModerations: () => api.get('/api/player-moderations'),
  createPlayerModeration: (targetUserId, type) => api.post('/api/player-moderations', { targetUserId, type }),
  deletePlayerModeration: (modId) => api.delete(`/api/player-moderations/${encodeURIComponent(modId)}`),

  groupAnnouncement: (groupId) => api.get(`/api/group/${encodeURIComponent(groupId)}/announcement`),
  groupBans: (groupId) => api.get(`/api/group/${encodeURIComponent(groupId)}/bans`),
  unbanGroupMember: (groupId, userId) => api.delete(`/api/group/${encodeURIComponent(groupId)}/bans/${encodeURIComponent(userId)}`),
  groupPosts: (groupId) => api.get(`/api/group/${encodeURIComponent(groupId)}/posts`),

  searchUsers: (q) => api.get(`/api/search/users?q=${encodeURIComponent(q)}`),
  searchWorlds: (q) => api.get(`/api/search/worlds?q=${encodeURIComponent(q)}`),

  getAvatar: (avatarId) => api.get(`/api/avatar/${encodeURIComponent(avatarId)}`),
  inviteUser: (userId, worldId, instanceId) => api.post(`/api/invite/${encodeURIComponent(userId)}`, { worldId, instanceId }),

  favorites: (type) => api.get(`/api/favorites${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  addFavorite: (type, favoriteId, tags = []) => api.post('/api/favorites', { type, favoriteId, tags }),
  removeFavorite: (favId) => api.delete(`/api/favorites/${encodeURIComponent(favId)}`),

  currentUserPermissions: () => api.get('/api/current-user/permissions'),
};

export default api;
