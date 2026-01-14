import { useState, useMemo, useEffect } from 'react';
import { Container, Grid, Box, Snackbar, Alert } from '@mui/material';
import Header from './components/Header';
import FilterSidebar from './components/FilterSidebar';
import SongGrid from './components/SongGrid';
import AddSongDialog from './components/AddSongDialog';
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
  const [songsData, setSongsData] = useState({ 'printed': [], 'not print': [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    print: 'all',
    type: 'all',
    difficulty: 'all',
    sort: 'name-asc'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
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
      console.log('✅ Fetched from API:', (data['printed']?.length || 0) + (data['not print']?.length || 0), 'songs');
      setSongsData(data);
      setLoading(false);
    } catch (error) {
      // Fallback to static JSON (for production/GitHub Pages)
      console.log('⚠️ API not available, using static data');
      console.log('📦 Loaded from songs.json:', (staticSongsData['printed']?.length || 0) + (staticSongsData['not print']?.length || 0), 'songs');
      setSongsData(staticSongsData);
      setLoading(false);
    }
  };

  // Filter and sort songs
  const filteredSongs = useMemo(() => {
    let songs = [];

    // Filter by print status
    if (filters.print === 'all') {
      const printedSongs = (songsData['printed'] || []).map(s => ({ ...s, category: 'printed' }));
      const notPrintSongs = (songsData['not print'] || []).map(s => ({ ...s, category: 'not print' }));
      songs = [...printedSongs, ...notPrintSongs];
    } else {
      songs = (songsData[filters.print] || []).map(s => ({ ...s, category: filters.print }));
    }

    console.log('After print filter:', songs.length, 'songs');

    // Filter by search
    if (searchQuery) {
      const normalizedQuery = removeDiacritics(searchQuery);
      songs = songs.filter(song =>
        removeDiacritics(song.name).includes(normalizedQuery)
      );
    }

    // Filter by type
    if (filters.type !== 'all') {
      songs = songs.filter(song => {
        return Object.values(song.difficulties).some(difficulty => {
          return Object.keys(difficulty).some(type => {
            if (filters.type === 'piano') return type.toLowerCase() === 'piano';
            if (filters.type === 'midi') return type.toLowerCase() === 'midi';
            if (filters.type === 'chord') return type.toLowerCase().includes('chord');
            return false;
          });
        });
      });
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
    }

    console.log('Final filtered songs:', songs.length);
    return songs;
  }, [filters, searchQuery, songsData]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalSongs = (songsData['printed']?.length || 0) + (songsData['not print']?.length || 0);
    let totalFiles = 0;

    ['printed', 'not print'].forEach(category => {
      songsData[category]?.forEach(song => {
        Object.values(song.difficulties).forEach(difficulty => {
          Object.values(difficulty).forEach(files => {
            totalFiles += files.length;
          });
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
                <SongGrid songs={filteredSongs} />
              </Grid>
            </Grid>
          </Container>

          <AddSongDialog
            open={addDialogOpen}
            onClose={() => setAddDialogOpen(false)}
            onAdd={handleAddSong}
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
        </>
      )}
    </Box>
  );
}

export default App;
