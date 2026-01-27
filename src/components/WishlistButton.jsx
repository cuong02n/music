import { useState, useEffect, useMemo } from 'react';
import {
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Box,
    Typography,
    Divider,
    Link,
    InputAdornment
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import staticWishlistData from '../data/wishlist.json';

// Function to remove Vietnamese diacritics
function removeDiacritics(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
}

function WishlistButton({ isApiAvailable }) {
    const [open, setOpen] = useState(false);
    const [wishlist, setWishlist] = useState([]);
    const [newSongName, setNewSongName] = useState('');
    const [newSongLink, setNewSongLink] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Load wishlist from API
    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/wishlist');
            if (response.ok) {
                const data = await response.json();
                setWishlist(data);
                console.log('✅ Loaded wishlist from API:', data.length, 'items');
            } else {
                throw new Error('API not available');
            }
        } catch (error) {
            console.error('Error loading wishlist:', error);
            // Fallback to static JSON file (for production/GitHub Pages)
            console.log('⚠️ API not available, using static wishlist.json');
            console.log('📦 Loaded from wishlist.json:', staticWishlistData.length, 'items');
            setWishlist(staticWishlistData);

            // Secondary fallback to localStorage if file is also empty
            if (staticWishlistData.length === 0) {
                const saved = localStorage.getItem('sheetWishlist');
                if (saved) {
                    try {
                        const localData = JSON.parse(saved);
                        setWishlist(localData);
                        console.log('⚠️ Loaded from localStorage as secondary fallback:', localData.length, 'items');
                    } catch (e) {
                        console.error('Error loading from localStorage:', e);
                    }
                }
            }
        } finally {
            setLoading(false);
        }
    };

    // Save wishlist to API
    const saveWishlist = async (newWishlist) => {
        try {
            const response = await fetch('http://localhost:3001/api/wishlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newWishlist),
            });

            if (response.ok) {
                console.log('✅ Wishlist saved to file');
            } else {
                console.error('Failed to save wishlist');
            }
        } catch (error) {
            console.error('Error saving wishlist:', error);
            // Fallback to localStorage if API fails
            localStorage.setItem('sheetWishlist', JSON.stringify(newWishlist));
            console.log('⚠️ Saved to localStorage as fallback');
        }
    };

    const handleAddSong = () => {
        if (!newSongName.trim()) {
            alert('Vui lòng nhập tên bài hát!');
            return;
        }

        const newItem = {
            id: Date.now(),
            name: newSongName.trim(),
            link: newSongLink.trim(),
            addedDate: new Date().toISOString()
        };

        const newWishlist = [...wishlist, newItem];
        setWishlist(newWishlist);
        saveWishlist(newWishlist);
        setNewSongName('');
        setNewSongLink('');
    };

    const handleDeleteSong = (id) => {
        const newWishlist = wishlist.filter(item => item.id !== id);
        setWishlist(newWishlist);
        saveWishlist(newWishlist);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAddSong();
        }
    };

    // Filter wishlist based on search query
    const filteredWishlist = useMemo(() => {
        if (!searchQuery.trim()) {
            return wishlist;
        }

        const normalizedQuery = removeDiacritics(searchQuery);
        return wishlist.filter(item =>
            removeDiacritics(item.name).includes(normalizedQuery)
        );
    }, [wishlist, searchQuery]);

    return (
        <>
            {/* Floating Button */}
            <Fab
                color="secondary"
                aria-label="wishlist"
                onClick={() => setOpen(true)}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                        transform: 'scale(1.1)',
                    },
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 20px rgba(245, 87, 108, 0.4)',
                }}
            >
                <BookmarkIcon />
            </Fab>

            {/* Wishlist Dialog */}
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }
                }}
            >
                <DialogTitle sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookmarkIcon />
                        <Typography variant="h6">Danh sách chờ tải</Typography>
                    </Box>
                    <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ bgcolor: 'white', mt: 1 }}>
                    {loading ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography>Đang tải...</Typography>
                        </Box>
                    ) : (
                        <>
                            {/* Add new song form - only show when API is available */}
                            {isApiAvailable && (
                                <Box sx={{ mb: 3, mt: 2 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                                        Thêm bài hát mới
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Tên bài hát"
                                        value={newSongName}
                                        onChange={(e) => setNewSongName(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        sx={{ mb: 1.5 }}
                                    />
                                    <TextField
                                        fullWidth
                                        size="small"
                                        label="Link sheet (tùy chọn)"
                                        value={newSongLink}
                                        onChange={(e) => setNewSongLink(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        sx={{ mb: 1.5 }}
                                    />
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<AddIcon />}
                                        onClick={handleAddSong}
                                        sx={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                                            }
                                        }}
                                    >
                                        Thêm vào danh sách
                                    </Button>
                                </Box>
                            )}

                            {!isApiAvailable && (
                                <Box sx={{ mb: 2, mt: 2, p: 2, bgcolor: '#fff3cd', borderRadius: 2 }}>
                                    <Typography variant="body2" sx={{ color: '#856404' }}>
                                        ⚠️ Chế độ chỉ xem - Backend không khả dụng
                                    </Typography>
                                </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* Search */}
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Tìm kiếm bài hát..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{ mb: 2 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: '#999' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {/* Wishlist */}
                            <Typography variant="subtitle2" sx={{ mb: 1, color: '#666' }}>
                                Danh sách ({filteredWishlist.length}/{wishlist.length} bài)
                            </Typography>

                            {wishlist.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4, color: '#999' }}>
                                    <BookmarkIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                                    <Typography>Chưa có bài hát nào trong danh sách</Typography>
                                </Box>
                            ) : filteredWishlist.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 4, color: '#999' }}>
                                    <SearchIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                                    <Typography>Không tìm thấy bài hát nào</Typography>
                                </Box>
                            ) : (
                                <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                                    {filteredWishlist.map((item) => (
                                        <ListItem
                                            key={item.id}
                                            sx={{
                                                bgcolor: '#f5f5f5',
                                                mb: 1,
                                                borderRadius: 2,
                                                '&:hover': {
                                                    bgcolor: '#e8e8e8',
                                                }
                                            }}
                                            secondaryAction={
                                                isApiAvailable && (
                                                    <IconButton
                                                        edge="end"
                                                        aria-label="delete"
                                                        onClick={() => handleDeleteSong(item.id)}
                                                        sx={{ color: '#f5576c' }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                )
                                            }
                                        >
                                            <ListItemText
                                                primary={item.name}
                                                secondary={
                                                    item.link ? (
                                                        <Link
                                                            href={item.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            sx={{ color: '#667eea', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                                                        >
                                                            {item.link.length > 50 ? item.link.substring(0, 50) + '...' : item.link}
                                                        </Link>
                                                    ) : (
                                                        <span style={{ color: '#999', fontStyle: 'italic' }}>Chưa có link</span>
                                                    )
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </>
                    )}
                </DialogContent>

                <DialogActions sx={{ bgcolor: 'white', px: 3, pb: 2 }}>
                    <Button onClick={() => setOpen(false)} variant="outlined">
                        Đóng
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default WishlistButton;
