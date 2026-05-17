import { useState, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Alert,
    Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const TYPES = ['Piano', 'MIDI'];

const DIFF_CONFIG = {
    Easy:   { label: 'Dễ',         sublabel: 'Easy',   color: '#38a169', bg: '#f0fff4', border: '#9ae6b4' },
    Medium: { label: 'Trung bình', sublabel: 'Medium', color: '#d69e2e', bg: '#fffff0', border: '#faf089' },
    Hard:   { label: 'Khó',        sublabel: 'Hard',   color: '#e53e3e', bg: '#fff5f5', border: '#feb2b2' },
};

const TYPE_CONFIG = {
    Piano: { label: '🎹 Piano (PDF)', accept: '.pdf' },
    MIDI:  { label: '🎵 MIDI',        accept: '.mid,.midi' },
};

const emptyFiles = () => ({
    Easy:   { Piano: null, MIDI: null },
    Medium: { Piano: null, MIDI: null },
    Hard:   { Piano: null, MIDI: null },
});

function FileCell({ file, difficulty, type, onChange }) {
    const cfg = DIFF_CONFIG[difficulty];
    const hasFile = Boolean(file);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef(null);

    const validate = (f) => {
        if (type === 'Piano' && f.type !== 'application/pdf') return false;
        if (type === 'MIDI'  && !f.name.match(/\.(mid|midi)$/i))  return false;
        return true;
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (!dropped) return;
        if (!validate(dropped)) {
            // Tạo synthetic event để gọi lại onChange với lỗi
            onChange({ target: { files: [dropped], _invalid: true }, _invalid: true });
            return;
        }
        // Gọi onChange với synthetic event
        onChange({ target: { files: [dropped] } });
    };

    const borderColor = dragging
        ? cfg.color
        : hasFile ? cfg.color : '#d1d5db';
    const borderStyle = dragging ? 'solid' : hasFile ? 'solid' : 'dashed';
    const bg = dragging ? cfg.bg : hasFile ? cfg.bg : '#fafafa';

    return (
        <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            sx={{
                border: `2px ${borderStyle} ${borderColor}`,
                borderRadius: '10px',
                p: 1.2,
                textAlign: 'center',
                bgcolor: bg,
                transition: 'all 0.15s ease',
                minHeight: 72,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.4,
                cursor: 'pointer',
                userSelect: 'none',
                transform: dragging ? 'scale(1.02)' : 'none',
                boxShadow: dragging ? `0 4px 16px ${cfg.border}bb` : 'none',
                '&:hover': {
                    borderColor: cfg.color,
                    borderStyle: 'solid',
                    bgcolor: cfg.bg,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 3px 10px ${cfg.border}88`,
                },
            }}
        >
            <input
                ref={inputRef}
                type="file"
                hidden
                accept={TYPE_CONFIG[type].accept}
                onChange={onChange}
            />
            {dragging ? (
                <>
                    <CloudUploadIcon sx={{ color: cfg.color, fontSize: '1.6rem' }} />
                    <span style={{ fontSize: '0.72rem', color: cfg.color, fontWeight: 600 }}>Thả vào đây!</span>
                </>
            ) : hasFile ? (
                <>
                    <CheckCircleIcon sx={{ color: cfg.color, fontSize: '1.3rem' }} />
                    <span style={{ fontSize: '0.7rem', color: cfg.color, fontWeight: 600, wordBreak: 'break-all', lineHeight: 1.3 }}>
                        {file.name}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: '#999' }}>click hoặc kéo để đổi</span>
                </>
            ) : (
                <>
                    <CloudUploadIcon sx={{ color: '#cbd5e0', fontSize: '1.4rem' }} />
                    <span style={{ fontSize: '0.72rem', color: '#a0aec0' }}>Click hoặc kéo thả</span>
                </>
            )}
        </Box>
    );
}


// ── Popup xác nhận nhỏ ────────────────────────────────────────────────────
function ConfirmPopup({ open, songName, selectedList, uploading, onConfirm, onCancel }) {
    if (!open) return null;
    return (
        <Box sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: 'inherit',
        }}>
            <Box sx={{
                bgcolor: 'white',
                borderRadius: '16px',
                p: 3,
                width: '85%',
                maxWidth: 380,
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                animation: 'popIn 0.18s ease',
                '@keyframes popIn': {
                    from: { opacity: 0, transform: 'scale(0.9)' },
                    to:   { opacity: 1, transform: 'scale(1)' },
                },
            }}>
                <Box sx={{ fontWeight: 700, fontSize: '1rem', mb: 1 }}>
                    ✅ Xác nhận thêm bài hát
                </Box>
                <Box sx={{ fontSize: '0.85rem', color: '#555', mb: 1.5 }}>
                    <strong>"{songName}"</strong> — {selectedList.length} file
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, mb: 2, maxHeight: 160, overflowY: 'auto' }}>
                    {selectedList.map(({ diff, type, file }) => (
                        <Box key={`${diff}-${type}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.78rem', color: '#444' }}>
                            <span style={{ color: DIFF_CONFIG[diff].color, fontWeight: 700, minWidth: 48 }}>{diff}</span>
                            <span style={{ color: '#888', minWidth: 36 }}>{type}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{file.name}</span>
                        </Box>
                    ))}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button fullWidth variant="outlined" onClick={onCancel} disabled={uploading} size="small">
                        Hủy
                    </Button>
                    <Button fullWidth variant="contained" color="success" onClick={onConfirm} disabled={uploading} size="small">
                        {uploading ? '⏳ Đang upload...' : 'Thêm'}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

// Tự động đặt tên bài từ tên file: chỉ bỏ extension
function extractSongName(filename) {
    return filename.replace(/\.(pdf|mid|midi)$/i, '');
}

// ── Main Dialog ───────────────────────────────────────────────────────────
function AddSongDialog({ open, onClose, onAdd }) {
    const [songName, setSongName] = useState('');
    const [files, setFiles] = useState(emptyFiles());
    const [confirming, setConfirming] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const selectedList = DIFFICULTIES.flatMap(diff =>
        TYPES.flatMap(type => files[diff][type] ? [{ diff, type, file: files[diff][type] }] : [])
    );
    const totalFiles = selectedList.length;

    const handleFileChange = (difficulty, type, event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (type === 'Piano' && file.type !== 'application/pdf') {
            setError('Cột Piano chỉ chấp nhận file PDF (.pdf)');
            event.target.value = '';
            return;
        }
        if (type === 'MIDI' && !file.name.match(/\.(mid|midi)$/i)) {
            setError('Cột MIDI chỉ chấp nhận file .mid / .midi');
            event.target.value = '';
            return;
        }

        // Auto-fill tên bài thông minh từ file đầu tiên được chọn
        if (!songName.trim()) {
            const extracted = extractSongName(file.name);
            if (extracted) setSongName(extracted);
        }

        setFiles(prev => ({ ...prev, [difficulty]: { ...prev[difficulty], [type]: file } }));
        setError('');
    };

    const handleSubmitClick = () => {
        if (!songName.trim()) { setError('Vui lòng nhập tên bài hát'); return; }
        if (totalFiles === 0)  { setError('Vui lòng chọn ít nhất 1 file'); return; }
        setError('');
        setConfirming(true);
    };

    const handleConfirm = async () => {
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('songName', songName.trim());
            DIFFICULTIES.forEach(diff =>
                TYPES.forEach(type => {
                    if (files[diff][type]) formData.append(`${diff}_${type}`, files[diff][type]);
                })
            );

            const response = await fetch('http://localhost:3001/api/upload', { method: 'POST', body: formData });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Upload failed');
            }
            const result = await response.json();
            onAdd({ name: songName.trim(), success: true, ...result });
            handleClose();
        } catch (err) {
            setError(`Lỗi: ${err.message}. Đảm bảo server đang chạy (npm run server)`);
            setConfirming(false);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setSongName('');
        setFiles(emptyFiles());
        setConfirming(false);
        setUploading(false);
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={!uploading ? handleClose : undefined} maxWidth="sm" fullWidth
            PaperProps={{ sx: { position: 'relative', overflow: 'visible' } }}
        >
            <ConfirmPopup
                open={confirming}
                songName={songName}
                selectedList={selectedList}
                uploading={uploading}
                onConfirm={handleConfirm}
                onCancel={() => setConfirming(false)}
            />

            <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>🎵 Thêm Bài Hát Mới</DialogTitle>

            <DialogContent sx={{ overflow: 'visible', pt: '20px !important' }}>
                {/* Tên bài hát */}
                <TextField
                    label="Tên bài hát"
                    value={songName}
                    onChange={e => setSongName(e.target.value)}
                    fullWidth
                    autoFocus
                    placeholder="Ví dụ: Canon in D"
                    size="small"
                    sx={{ mb: 2.5 }}
                />

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Bảng chọn file */}
                {/* Header */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: 1, mb: 1 }}>
                    <div />
                    {TYPES.map(type => (
                        <Box key={type} sx={{
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            color: '#4a5568',
                            py: 0.6,
                            bgcolor: '#f7fafc',
                            borderRadius: '8px',
                        }}>
                            {TYPE_CONFIG[type].label}
                        </Box>
                    ))}
                </Box>

                {/* Rows */}
                {DIFFICULTIES.map(diff => {
                    const cfg = DIFF_CONFIG[diff];
                    return (
                        <Box key={diff} sx={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: 1, mb: 1.2, alignItems: 'center' }}>
                            <Box sx={{
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                color: cfg.color,
                                bgcolor: cfg.bg,
                                border: `1px solid ${cfg.border}`,
                                borderRadius: '10px',
                                py: 0.8,
                                px: 1,
                                textAlign: 'center',
                            }}>
                                {cfg.label}
                                <Box component="span" sx={{ display: 'block', fontSize: '0.65rem', opacity: 0.7, fontWeight: 400 }}>
                                    {cfg.sublabel}
                                </Box>
                            </Box>
                            {TYPES.map(type => (
                                <FileCell
                                    key={type}
                                    file={files[diff][type]}
                                    difficulty={diff}
                                    type={type}
                                    onChange={e => handleFileChange(diff, type, e)}
                                />
                            ))}
                        </Box>
                    );
                })}

                {/* Count */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                    <Chip
                        label={totalFiles === 0 ? 'Chưa chọn file nào' : `${totalFiles} file đã chọn`}
                        color={totalFiles > 0 ? 'success' : 'default'}
                        size="small"
                        variant={totalFiles > 0 ? 'filled' : 'outlined'}
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} disabled={uploading}>Hủy</Button>
                <Button onClick={handleSubmitClick} variant="contained" color="success" disabled={uploading}>
                    Thêm bài hát
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default AddSongDialog;
