import { useState, useMemo, useEffect } from 'react';
import { Container, Grid, Box, Snackbar, Alert } from '@mui/material';
import Header from './components/Header';
import FilterSidebar from './components/FilterSidebar';
import SongGrid from './components/SongGrid';
import AddSongDialog from './components/AddSongDialog';
import EditSongDialog from './components/EditSongDialog';
import WishlistButton from './components/WishlistButton';
import staticSongsData from './data/songs.json';
import './App.css';

// Function to remove Vietnamese diacritics
function removeDiacritics(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function App() {
  const [songsData, setSongsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isApiAvailable, setIsApiAvailable] = useState(false);
  const [filters, setFilters] = useState({
    showMidi: false,
    difficulty: 'all',
    sort: 'date-new'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editSong, setEditSong] = useState(null); // song object being edited
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Fetch songs from API
  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      // Try to fetch from API first (for local development)
      const response = await fetch('http://localhost:3001/api/songs');
      if (!response.ok) throw new Error('API not available');

      const data = await response.json();
      // Flatten printed/not print structure if API still returns old format
      const songs = Array.isArray(data)
        ? data
        : [...(data['printed'] || []), ...(data['not print'] || [])];
      console.log('✅ Fetched from API:', songs.length, 'songs');
      setSongsData(songs);
      setIsApiAvailable(true);
      setLoading(false);
    } catch (error) {
      // Fallback to static JSON (for production/GitHub Pages)
      console.log('⚠️ API not available, using static data');
      const songs = Array.isArray(staticSongsData)
        ? staticSongsData
        : [...(staticSongsData['printed'] || []), ...(staticSongsData['not print'] || [])];
      console.log('📦 Loaded from songs.json:', songs.length, 'songs');
      setSongsData(songs);
      setIsApiAvailable(false);
      setLoading(false);
    }
  };

  // Filter and sort songs
  const filteredSongs = useMemo(() => {
    let songs = [...songsData];

    // Filter by search
    if (searchQuery) {
      const normalizedQuery = removeDiacritics(searchQuery);
      songs = songs.filter(song =>
        removeDiacritics(song.name).includes(normalizedQuery)
      );
    }


    // Filter by difficulty
    if (filters.difficulty !== 'all') {
      songs = songs.filter(song => {
        return Object.keys(song.difficulties).includes(filters.difficulty);
      });
    }

    // Sort
    if (filters.sort === 'name-asc') {
      songs.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } else if (filters.sort === 'name-desc') {
      songs.sort((a, b) => b.name.localeCompare(a.name, 'vi'));
    } else if (filters.sort === 'date-new') {
      songs.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    } else if (filters.sort === 'date-old') {
      songs.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
    }

    console.log('Final filtered songs:', songs.length);
    return songs;
  }, [filters, searchQuery, songsData]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalSongs = songsData.length;
    let totalFiles = 0;

    songsData.forEach(song => {
      Object.values(song.difficulties).forEach(difficulty => {
        Object.values(difficulty).forEach(files => {
          totalFiles += files.length;
        });
      });
    });

    return { totalSongs, totalFiles };
  }, [songsData]);

  const handleAddSong = async (songData) => {
    console.log('Đã thêm bài hát:', songData);

    if (songData.success) {
      // Refetch songs để cập nhật danh sách tự động
      await fetchSongs();

      setSnackbar({
        open: true,
        message: `✅ Đã thêm "${songData.name}" thành công!`,
        severity: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: `Đã tạo thông tin cho "${songData.name}". Vui lòng copy file vào: ${songData.folderPath}`,
        severity: 'info'
      });
    }
  };



  const handleDeleteSong = async (songName) => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/songs/${encodeURIComponent(songName)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      await fetchSongs();
      setSnackbar({
        open: true,
        message: `🗑 Đã xóa "${songName}" thành công`,
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({ open: true, message: `❌ Lỗi: ${err.message}`, severity: 'error' });
    }
  };

  const handleEditSong = async (result) => {
    await fetchSongs();
    setSnackbar({
      open: true,
      message: `✏️ Đã cập nhật “${result.name}” thành công`,
      severity: 'success'
    });
  };

  return (
    <Box className="app">
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'white' }}>
          <div>Đang tải dữ liệu...</div>
        </Box>
      ) : (
        <>
          <Header
            stats={stats}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddClick={() => setAddDialogOpen(true)}
            isApiAvailable={isApiAvailable}
          />

          <Container maxWidth={false} disableGutters sx={{ px: 3 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 3, lg: 2 }}>
                <FilterSidebar
                  filters={filters}
                  onFilterChange={setFilters}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 9, lg: 10 }}>
                <SongGrid
                  songs={filteredSongs}
                  onDelete={isApiAvailable ? handleDeleteSong : null}
                  onEdit={isApiAvailable ? (song) => setEditSong(song) : null}
                  showMidi={filters.showMidi}
                  difficulty={filters.difficulty}
                />
              </Grid>
            </Grid>
          </Container>

          <AddSongDialog
            open={addDialogOpen}
            onClose={() => setAddDialogOpen(false)}
            onAdd={handleAddSong}
          />

          <EditSongDialog
            open={Boolean(editSong)}
            song={editSong}
            onClose={() => setEditSong(null)}
            onEdit={handleEditSong}
          />

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </Alert>
          </Snackbar>

          <WishlistButton isApiAvailable={isApiAvailable} />
        </>
      )}
    </Box>
  );
}

export default App;
