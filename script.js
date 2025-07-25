// ============ Global Elements ============
const audioPlayer = document.getElementById("audioPlayer");
const playPauseBtn = document.getElementById("playPauseBtn");
const playIcon = document.getElementById("playIcon");
const prevTrackBtn = document.getElementById("prevTrack");
const nextTrackBtn = document.getElementById("nextTrack");
const seekBar = document.getElementById("seekBar");
const currentTimeText = document.getElementById("currentTime");
const durationText = document.getElementById("duration");
const volumeBar = document.getElementById("volumeBar");
const muteToggle = document.getElementById("muteToggle");
const nowPlaying = document.getElementById("nowPlaying");
const uploadBtn = document.getElementById("uploadBtn");
const folderInput = document.getElementById("folderInput");
const searchInput = document.getElementById("search");
const mixGrid = document.getElementById("mixGrid");
const recentGrid = document.getElementById("recentGrid");
const playlistModal = document.getElementById("playlistModal");

let playlist = [];
let currentTrackIndex = 0;
let allSongCards = [];
let currentSongPath = null;
let selectedSong = null;

// ============ Load Track ============
function loadTrack(index) {
  const file = playlist[index];
  if (!file) return;
  const url = URL.createObjectURL(file);
  if (currentSongPath === url && !audioPlayer.paused) return;

  audioPlayer.src = url;
  audioPlayer.play();
  nowPlaying.innerHTML = `<img src="music_note.png" class="w-4 h-4" /> <span>${file.name}</span>`;
  updatePlayIcon(true);
  highlightCurrentCard(file.name);
  saveRecentlyPlayed(file.name, url);
  currentSongPath = url;
  currentTrackIndex = index;
}

function togglePlay() {
  if (audioPlayer.paused) {
    audioPlayer.play();
    updatePlayIcon(true);
  } else {
    audioPlayer.pause();
    updatePlayIcon(false);
  }
}

function updatePlayIcon(isPlaying) {
  playIcon.src = isPlaying ? "stop_music.png" : "play_music.png";
  playIcon.alt = isPlaying ? "Pause" : "Play";
}

function nextTrack() {
  if (!playlist.length) return;
  currentTrackIndex = (currentTrackIndex + 1) % playlist.length;
  loadTrack(currentTrackIndex);
}

function prevTrack() {
  if (!playlist.length) return;
  currentTrackIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
  loadTrack(currentTrackIndex);
}

function highlightCurrentCard(filename) {
  allSongCards.forEach(card => {
    card.classList.toggle("ring", card.dataset.filename === filename.toLowerCase());
    card.classList.toggle("ring-[#1DB954]", card.dataset.filename === filename.toLowerCase());
  });
}

// ============ Time & Volume ============
audioPlayer.addEventListener("timeupdate", () => {
  seekBar.value = (audioPlayer.currentTime / audioPlayer.duration) * 100 || 0;
  currentTimeText.textContent = formatTime(audioPlayer.currentTime);
  durationText.textContent = formatTime(audioPlayer.duration);
});
seekBar.addEventListener("input", () => {
  audioPlayer.currentTime = (seekBar.value / 100) * audioPlayer.duration;
});
volumeBar.addEventListener("input", () => {
  audioPlayer.volume = volumeBar.value / 100;
});
muteToggle.addEventListener("click", () => {
  audioPlayer.muted = !audioPlayer.muted;
  muteToggle.querySelector("img").src = audioPlayer.muted ? "mute_icon.png" : "volume_icon.png";
});
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min.toString().padStart(2,"0")}:${sec.toString().padStart(2,"0")}`;
}

// ============ Upload ============
uploadBtn.addEventListener("click", () => folderInput.click());
folderInput.addEventListener("change", e => {
  playlist = Array.from(e.target.files).filter(f => f.type.startsWith("audio/"));
  if (!playlist.length) return alert("No audio files found.");
  displaySongs(playlist);
  loadTrack(0);
});

// ============ Display Songs ============
function displaySongs(files) {
  mixGrid.innerHTML = "";
  recentGrid.innerHTML = "";
  allSongCards = [];

  files.forEach((file, i) => {
    const url = URL.createObjectURL(file);
    const card = document.createElement("div");
    card.className = "bg-[#181818] text-[#B3B3B3] rounded-lg p-4 shadow hover:shadow-lg transition cursor-pointer";
    card.dataset.filename = file.name.toLowerCase();
    card.innerHTML = `
      <div class="text-lg font-semibold truncate">${file.name}</div>
      <div class="text-sm text-gray-500">Track ${i + 1}</div>
      <div class="flex gap-2 mt-2 text-sm">
        <button class="text-green-400 hover:underline" onclick="addToFavorites('${file.name}', '${url}')">💜 Favorite</button>
        <button class="text-blue-400 hover:underline" onclick="showPlaylistModal('${file.name}', '${url}')">➕ Playlist</button>
      </div>
    `;
    card.addEventListener("click", () => {
      if (currentSongPath === url && !audioPlayer.paused) return;
      loadTrack(i);
    });
    allSongCards.push(card);
    (i < 4 ? mixGrid : recentGrid).appendChild(card);
  });
}

// ============ Search ============
searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase().trim();
  mixGrid.innerHTML = "";
  recentGrid.innerHTML = "";
  let mixCount = 0;
  allSongCards.forEach(card => {
    if (card.dataset.filename.includes(q)) {
      (mixCount++ < 4 ? mixGrid : recentGrid).appendChild(card);
    }
  });
  if (!q) displaySongs(playlist);
});

// ============ Favorites ============
document.getElementById("showFavorites").addEventListener("click", renderLikedSongs);
async function addToFavorites(name, path) {
  await fetch("http://localhost:3000/favorites", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, path })
  });
  renderLikedSongs();
}
async function removeFromFavorites(name) {
  await fetch(`http://localhost:3000/favorites/${encodeURIComponent(name)}`, { method: "DELETE" });
  renderLikedSongs();
}
async function renderLikedSongs() {
  const res = await fetch("http://localhost:3000/favorites");
  const liked = await res.json();
  mixGrid.innerHTML = "";
  recentGrid.innerHTML = "";
  liked.forEach(song => {
    const card = document.createElement("div");
    card.className = "bg-[#181818] text-[#B3B3B3] rounded-lg p-4 shadow hover:shadow-lg transition cursor-pointer";
    card.innerHTML = `
      <div class="text-lg font-semibold truncate">${song.name}</div>
      <div class="text-sm text-gray-500">❤️ Liked Song</div>
      <div class="flex gap-2 mt-2 text-sm">
        <button class="text-red-400 hover:underline" onclick="removeFromFavorites('${song.name}')">💔 Remove</button>
        <button class="text-blue-400 hover:underline" onclick="showPlaylistModal('${song.name}', '${song.path}')">➕ Playlist</button>
      </div>
    `;
    card.addEventListener("click", () => {
      if (currentSongPath === song.path && !audioPlayer.paused) return;
      audioPlayer.src = song.path;
      audioPlayer.play();
      nowPlaying.innerHTML = `<img src="music_note.png" class="w-4 h-4" /> <span>${song.name}</span>`;
      updatePlayIcon(true);
      currentSongPath = song.path;
      saveRecentlyPlayed(song.name, song.path);
    });
    mixGrid.appendChild(card);
  });
}

// ============ Recently Played ============
async function saveRecentlyPlayed(name, path) {
  try {
    await fetch("http://localhost:3000/recently_played", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, path })
    });
  } catch (e) { console.error(e); }
}

// ============ Playlists ============
document.getElementById("showPlaylists").addEventListener("click", renderMyPlaylists);
async function renderMyPlaylists() {
  const res = await fetch("http://localhost:3000/playlist_songs");
  const songs = await res.json();
  mixGrid.innerHTML = "";
  recentGrid.innerHTML = "";
  songs.forEach(song => {
    const card = document.createElement("div");
    card.className = "bg-[#181818] text-[#B3B3B3] rounded-lg p-4 shadow hover:shadow-lg transition cursor-pointer";
    card.innerHTML = `
      <div class="text-lg font-semibold truncate">${song.name}</div>
      <div class="text-sm text-gray-500">🎵 Playlist Song</div>`;
    card.addEventListener("click", () => {
      if (currentSongPath === song.path && !audioPlayer.paused) return;
      audioPlayer.src = song.path;
      audioPlayer.play();
      nowPlaying.innerHTML = `<img src="music_note.png" class="w-4 h-4" /> <span>${song.name}</span>`;
      updatePlayIcon(true);
      currentSongPath = song.path;
      saveRecentlyPlayed(song.name, song.path);
    });
    mixGrid.appendChild(card);
  });
}

document.getElementById("createPlaylist").addEventListener("click", showCreatePlaylistModal);
function showCreatePlaylistModal() {
  playlistModal.innerHTML = `
    <div class="bg-[#181818] text-white p-6 rounded-lg w-96">
      <h3 class="text-lg font-bold mb-4">Create New Playlist</h3>
      <input type="text" id="newPlaylistName" placeholder="Name..." class="w-full p-2 bg-gray-800 rounded text-white mb-4" />
      <button class="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-black font-bold w-full" onclick="createNewPlaylist()">Create</button>
      <button class="mt-3 text-gray-400 hover:text-white" onclick="closeModal()">Cancel</button>
    </div>`;
  playlistModal.classList.remove("hidden");
}

async function createNewPlaylist() {
  const name = document.getElementById("newPlaylistName").value.trim();
  if (!name) return;
  await fetch("http://localhost:3000/playlists", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name })
  });
  closeModal();
}

async function showPlaylistModal(name, path) {
  selectedSong = { name, path };
  const res = await fetch("http://localhost:3000/playlists");
  const pls = await res.json();
 playlistModal.innerHTML = `
  <div class="bg-[#181818] text-white p-6 rounded-lg w-96 shadow-lg">
    <h3 class="text-lg font-bold mb-4">Create New Playlist</h3>
    <input type="text" id="newPlaylistName" placeholder="Name..." class="w-full p-2 bg-gray-800 rounded text-white mb-4" />
    <button class="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-black font-bold w-full" onclick="createNewPlaylist()">Create</button>
    <button class="mt-3 text-gray-400 hover:text-white w-full" onclick="closeModal()">Cancel</button>
  </div>`;
playlistModal.classList.remove("hidden");

}

async function addToPlaylist(pid) {
  if (!selectedSong) return;
  await fetch("http://localhost:3000/playlist_songs", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playlist_id: pid, ...selectedSong })
  });
  closeModal();
}
function closeModal() {
  playlistModal.classList.add("hidden");
  playlistModal.innerHTML = "";
}

// ============ Artists ============
document.getElementById("showArtists")?.addEventListener("click", () => {
  mixGrid.innerHTML = "";
  recentGrid.innerHTML = "";
  const map = {};

  playlist.forEach(file => {
    const artist = file.name.split("-")[0]?.trim() || "Unknown";
    (map[artist] = map[artist] || []).push(file);
  });

  Object.entries(map).forEach(([artist, files]) => {
    const section = document.createElement("div");
    section.className = "col-span-full";
    section.innerHTML = `<h3 class="text-lg text-[#1DB954] font-bold mb-2">🎤 ${artist}</h3>`;
    mixGrid.appendChild(section);
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      const card = document.createElement("div");
      card.className = "bg-[#181818] text-[#B3B3B3] rounded-lg p-4 shadow hover:shadow-lg transition cursor-pointer";
      card.innerHTML = `<div class="text-lg font-semibold truncate">${file.name}</div><div class="text-sm text-gray-500">🎧 Artist Track</div>`;
      card.addEventListener("click", () => {
        if (currentSongPath === url && !audioPlayer.paused) return;
        audioPlayer.src = url;
        audioPlayer.play();
        nowPlaying.innerHTML = `<img src="music_note.png" class="w-4 h-4" /> <span>${file.name}</span>`;
        updatePlayIcon(true);
        currentSongPath = url;
        saveRecentlyPlayed(file.name, url);
      });
      mixGrid.appendChild(card);
    });
  });
});

// ============ Theme & Events ============
playPauseBtn.addEventListener("click", togglePlay);
nextTrackBtn.addEventListener("click", nextTrack);
prevTrackBtn.addEventListener("click", prevTrack);

window.removeFromFavorites = removeFromFavorites;
window.showPlaylistModal = showPlaylistModal;
