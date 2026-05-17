import { useState, useRef, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Box, Alert, Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SwapVertIcon from '@mui/icons-material/SwapVert';

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

function getExisting(song, diff, type) {
    const arr = song?.difficulties?.[diff]?.[type];
    return arr && arr.length > 0 ? arr[0] : null;
}

function initCells(song) {
    const c = {};
    DIFFICULTIES.forEach(diff => {
        c[diff] = {};
        TYPES.forEach(type => {
            // moveFrom = { diff, type, filename } — file chuyển từ ô khác
            c[diff][type] = { existing: getExisting(song, diff, type), newFile: null, toRemove: false, moveFrom: null };
        });
    });
    return c;
}

// ── EditFileCell ──────────────────────────────────────────────────────────
function EditFileCell({ cell, difficulty, type, onUpdate, onError, draggingSrc, onDragStart, onDragEnd, onInternalDrop }) {
    const cfg = DIFF_CONFIG[difficulty];
    const [draggingOver, setDraggingOver] = useState(false);
    const inputRef = useRef(null);
    const { existing, newFile, toRemove, moveFrom } = cell;

    const isInternalDragOver = draggingOver && draggingSrc &&
        (draggingSrc.diff !== difficulty || draggingSrc.type !== type) &&
        draggingSrc.type === type; // chỉ cho phép cùng loại (Piano↔Piano, MIDI↔MIDI)

    const validate = (f) => {
        if (type === 'Piano' && f.type !== 'application/pdf') { onError('Cột Piano chỉ chấp nhận file PDF'); return false; }
        if (type === 'MIDI'  && !f.name.match(/\.(mid|midi)$/i)) { onError('Cột MIDI chỉ chấp nhận .mid / .midi'); return false; }
        return true;
    };

    const handleFile = (f) => {
        if (!f || !validate(f)) return;
        onUpdate({ ...cell, newFile: f, toRemove: !!existing, moveFrom: null });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        // Phân biệt internal drag vs file từ OS
        const isInternal = e.dataTransfer.types.includes('text/internal-drag');
        if (isInternal && draggingSrc?.type !== type) return; // sai loại — không cho drop
        setDraggingOver(true);
    };
    const handleDragLeave = (e) => { e.preventDefault(); setDraggingOver(false); };

    const handleDrop = (e) => {
        e.preventDefault();
        setDraggingOver(false);
        // Internal drag (chuyển ô trong grid)?
        if (e.dataTransfer.types.includes('text/internal-drag') && draggingSrc) {
            if (draggingSrc.type !== type) { onError('Chỉ có thể chuyển file cùng loại (Piano→Piano, MIDI→MIDI)'); onDragEnd(); return; }
            if (draggingSrc.diff === difficulty && draggingSrc.type === type) { onDragEnd(); return; }
            onInternalDrop(draggingSrc.diff, draggingSrc.type);
            onDragEnd();
            return;
        }
        // External file từ OS
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    };

    const handleChange = (e) => handleFile(e.target.files[0]);

    const baseBox = {
        borderRadius: '10px', p: 1.2, minHeight: 72,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 0.4, position: 'relative', cursor: 'pointer',
        transition: 'all 0.15s ease',
        outline: isInternalDragOver ? `2px dashed ${cfg.color}` : 'none',
        transform: isInternalDragOver ? 'scale(1.03)' : 'none',
    };

    // Trạng thái: đang được kéo (source)
    const isBeingDragged = draggingSrc?.diff === difficulty && draggingSrc?.type === type;

    // ── Có file mới (upload) ──────────────────────────────────
    if (newFile) return (
        <Box sx={{ ...baseBox, border: '2px solid #3182ce', bgcolor: '#ebf8ff', opacity: isBeingDragged ? 0.4 : 1 }}
            onClick={() => inputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <input ref={inputRef} type="file" hidden accept={TYPE_CONFIG[type].accept} onChange={handleChange} />
            <CheckCircleIcon sx={{ color: '#3182ce', fontSize: '1.2rem' }} />
            <span style={{ fontSize: '0.68rem', color: '#2b6cb0', fontWeight: 600, wordBreak: 'break-all', lineHeight: 1.3 }}>{newFile.name}</span>
            <span style={{ fontSize: '0.6rem', color: '#63b3ed' }}>Mới • click để đổi</span>
            <button onClick={(e) => { e.stopPropagation(); onUpdate({ ...cell, newFile: null, toRemove: false, moveFrom: null }); }}
                style={{ position:'absolute', top:4, right:4, background:'none', border:'none', cursor:'pointer', fontSize:'0.9rem', color:'#e53e3e', padding:'2px 5px' }}>✕</button>
        </Box>
    );

    // ── Có moveFrom (chuyển từ ô khác) ───────────────────────
    if (moveFrom) return (
        <Box sx={{ ...baseBox, border: '2px solid #805ad5', bgcolor: '#faf5ff', opacity: isBeingDragged ? 0.4 : 1 }}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/internal-drag', '1'); onDragStart(difficulty, type); }}
            onDragEnd={onDragEnd}>
            <SwapVertIcon sx={{ color: '#805ad5', fontSize: '1.2rem' }} />
            <span style={{ fontSize: '0.65rem', color: '#805ad5', fontWeight: 700 }}>Chuyển từ {moveFrom.diff}</span>
            <span style={{ fontSize: '0.65rem', color: '#6b46c1', wordBreak: 'break-all', lineHeight: 1.3 }}>{moveFrom.filename}</span>
            <button onClick={(e) => { e.stopPropagation(); onUpdate({ ...cell, moveFrom: null, toRemove: false }); }}
                style={{ position:'absolute', top:4, right:4, background:'none', border:'none', cursor:'pointer', fontSize:'0.9rem', color:'#e53e3e', padding:'2px 5px' }}>✕</button>
        </Box>
    );

    // ── File hiện tại (chưa xóa) ──────────────────────────────
    if (existing && !toRemove) return (
        <Box sx={{ ...baseBox, border: `2px solid ${cfg.color}`, bgcolor: cfg.bg, opacity: isBeingDragged ? 0.4 : 1,
            '&:hover': { boxShadow: `0 3px 10px ${cfg.border}88` } }}
            onClick={() => inputRef.current?.click()}
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/internal-drag', '1'); onDragStart(difficulty, type); }}
            onDragEnd={onDragEnd}>
            <input ref={inputRef} type="file" hidden accept={TYPE_CONFIG[type].accept} onChange={handleChange} />
            <CheckCircleIcon sx={{ color: cfg.color, fontSize: '1.2rem' }} />
            <span style={{ fontSize: '0.68rem', color: cfg.color, fontWeight: 600, wordBreak: 'break-all', lineHeight: 1.3 }}>{existing.name}</span>
            <span style={{ fontSize: '0.6rem', color: '#999' }}>kéo để chuyển ô • click để thay</span>
            <button onClick={(e) => { e.stopPropagation(); onUpdate({ ...cell, toRemove: true }); }}
                style={{ position:'absolute', top:4, right:4, background:'none', border:'none', cursor:'pointer', fontSize:'0.9rem', color:'#e53e3e', padding:'2px 5px' }}>✕</button>
        </Box>
    );

    // ── Đã đánh dấu xóa ──────────────────────────────────────
    if (existing && toRemove && !moveFrom) return (
        <Box sx={{ ...baseBox, border: '2px dashed #fc8181', bgcolor: '#fff5f5' }}
            onClick={() => inputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <input ref={inputRef} type="file" hidden accept={TYPE_CONFIG[type].accept} onChange={handleChange} />
            <span style={{ fontSize: '1.1rem' }}>🗑</span>
            <span style={{ fontSize: '0.65rem', color: '#e53e3e', textDecoration: 'line-through', wordBreak: 'break-all' }}>{existing.name}</span>
            <span style={{ fontSize: '0.6rem', color: '#fc8181' }}>Sẽ bị xóa</span>
            <button onClick={(e) => { e.stopPropagation(); onUpdate({ ...cell, toRemove: false }); }}
                style={{ position:'absolute', top:4, right:4, background:'none', border:'1px solid #e53e3e', borderRadius:4, cursor:'pointer', fontSize:'0.62rem', color:'#e53e3e', padding:'2px 5px' }}>↩</button>
        </Box>
    );

    // ── Ô trống ───────────────────────────────────────────────
    return (
        <Box sx={{ ...baseBox, border: (draggingOver && isInternalDragOver) ? `2px solid ${cfg.color}` : draggingOver ? '2px dashed #d1d5db' : '2px dashed #d1d5db',
            bgcolor: isInternalDragOver ? cfg.bg : draggingOver ? '#f0f4ff' : '#fafafa',
            transform: isInternalDragOver ? 'scale(1.03)' : 'none',
            '&:hover': { borderColor: cfg.color, bgcolor: cfg.bg } }}
            onClick={() => inputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <input ref={inputRef} type="file" hidden accept={TYPE_CONFIG[type].accept} onChange={handleChange} />
            <CloudUploadIcon sx={{ color: isInternalDragOver ? cfg.color : '#cbd5e0', fontSize: '1.3rem' }} />
            <span style={{ fontSize: '0.72rem', color: isInternalDragOver ? cfg.color : '#a0aec0', fontWeight: isInternalDragOver ? 600 : 400 }}>
                {isInternalDragOver ? `Chuyển vào ${difficulty}` : 'Click hoặc kéo thả'}
            </span>
        </Box>
    );
}

// ── Confirm Popup ─────────────────────────────────────────────────────────
function ConfirmPopup({ open, songName, originalName, cells, uploading, onConfirm, onCancel }) {
    if (!open) return null;
    const renamed  = songName !== originalName;
    const newFiles = DIFFICULTIES.flatMap(d => TYPES.filter(t => cells[d]?.[t]?.newFile).map(t => `${d}/${t}: ${cells[d][t].newFile.name}`));
    const removed  = DIFFICULTIES.flatMap(d => TYPES.filter(t => cells[d]?.[t]?.toRemove && !cells[d][t].newFile && !cells[d][t].moveFrom).map(t => `${d}/${t}: ${cells[d][t].existing.name}`));
    const moved    = DIFFICULTIES.flatMap(d => TYPES.filter(t => cells[d]?.[t]?.moveFrom).map(t => `${cells[d][t].moveFrom.diff}/${t} → ${d}/${t}`));
    const noChange = !renamed && newFiles.length === 0 && removed.length === 0 && moved.length === 0;

    return (
        <Box sx={{ position:'absolute', inset:0, bgcolor:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10, borderRadius:'inherit' }}>
            <Box sx={{ bgcolor:'white', borderRadius:'16px', p:3, width:'85%', maxWidth:380, boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
                animation:'popIn 0.18s ease', '@keyframes popIn': { from:{ opacity:0, transform:'scale(0.9)' }, to:{ opacity:1, transform:'scale(1)' } } }}>
                <Box sx={{ fontWeight:700, fontSize:'1rem', mb:1.5 }}>✏️ Xác nhận chỉnh sửa</Box>
                <Box sx={{ display:'flex', flexDirection:'column', gap:0.6, mb:2, fontSize:'0.82rem', color:'#444', maxHeight:180, overflowY:'auto' }}>
                    {renamed   && <Box>🔤 Đổi tên: <strong>"{originalName}"</strong> → <strong>"{songName}"</strong></Box>}
                    {moved.map((s,i)     => <Box key={i}>↕️ Chuyển: {s}</Box>)}
                    {newFiles.map((s,i)  => <Box key={i}>➕ {s}</Box>)}
                    {removed.map((s,i)   => <Box key={i}>🗑 {s}</Box>)}
                    {noChange  && <Box sx={{ color:'#888' }}>Không có thay đổi nào</Box>}
                </Box>
                <Box sx={{ display:'flex', gap:1 }}>
                    <Button fullWidth variant="outlined" onClick={onCancel} disabled={uploading} size="small">Hủy</Button>
                    <Button fullWidth variant="contained" color="primary" onClick={onConfirm} disabled={uploading || noChange} size="small">
                        {uploading ? '⏳ Đang lưu...' : 'Lưu'}
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

// ── Main Dialog ───────────────────────────────────────────────────────────
function EditSongDialog({ open, song, onClose, onEdit }) {
    const [songName, setSongName] = useState('');
    const [cells, setCells]       = useState({});
    const [confirming, setConfirming] = useState(false);
    const [uploading, setUploading]   = useState(false);
    const [error, setError]           = useState('');
    const [draggingSrc, setDraggingSrc] = useState(null); // { diff, type }

    useEffect(() => {
        if (song && open) {
            setSongName(song.name);
            setCells(initCells(song));
            setError('');
            setConfirming(false);
            setDraggingSrc(null);
        }
    }, [song, open]);

    const updateCell = (diff, type, newCell) =>
        setCells(prev => ({ ...prev, [diff]: { ...prev[diff], [type]: newCell } }));

    // Kéo từ srcDiff/srcType thả vào dstDiff/dstType
    const handleInternalMove = (srcDiff, srcType, dstDiff, dstType) => {
        setCells(prev => {
            const src = prev[srcDiff][srcType];
            const dst = prev[dstDiff][dstType];

            // Lấy thông tin gốc của file đang di chuyển
            const originDiff = src.moveFrom?.diff || srcDiff;
            const originType = src.moveFrom?.type || srcType;
            const filename   = src.moveFrom?.filename || src.existing?.name;
            if (!filename) return prev;

            // Source: hoàn tác về trạng thái gốc (đánh dấu xóa nếu có existing)
            const newSrc = src.moveFrom
                ? { ...src, moveFrom: null, toRemove: !!src.existing } // đã là "received", revert
                : { ...src, toRemove: true, moveFrom: null };          // gốc, đánh dấu xóa

            // Destination: nhận moveFrom
            const newDst = {
                ...dst,
                moveFrom: { diff: originDiff, type: originType, filename },
                newFile: null,
                toRemove: !!dst.existing && !dst.moveFrom, // xóa file cũ ở đích nếu có
            };

            return {
                ...prev,
                [srcDiff]: { ...prev[srcDiff], [srcType]: newSrc },
                [dstDiff]: { ...prev[dstDiff], [dstType]: newDst },
            };
        });
    };

    const handleSubmitClick = () => {
        if (!songName.trim()) { setError('Vui lòng nhập tên bài hát'); return; }
        setError('');
        setConfirming(true);
    };

    const handleConfirm = async () => {
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('songName', songName.trim());

            const toRemove = [];
            const toMove   = [];

            DIFFICULTIES.forEach(diff => TYPES.forEach(type => {
                const c = cells[diff]?.[type];
                if (!c) return;
                if (c.newFile) formData.append(`${diff}_${type}`, c.newFile);
                if (c.moveFrom) {
                    toMove.push({ fromDifficulty: c.moveFrom.diff, fromType: c.moveFrom.type, filename: c.moveFrom.filename, toDifficulty: diff, toType: type });
                    // Nếu đích có file cũ cần xóa
                    if (c.existing) toRemove.push({ difficulty: diff, type, filename: c.existing.name });
                } else if (c.toRemove && c.existing && !c.newFile) {
                    toRemove.push({ difficulty: diff, type, filename: c.existing.name });
                }
            }));

            formData.append('toRemove', JSON.stringify(toRemove));
            formData.append('toMove', JSON.stringify(toMove));

            const res = await fetch(`http://localhost:3001/api/songs/${encodeURIComponent(song.name)}`, { method: 'PUT', body: formData });
            if (!res.ok) {
                let msg = 'Edit failed';
                try { const e = await res.json(); msg = e.error || msg; } catch {}
                throw new Error(msg);
            }
            const result = await res.json();
            onEdit({ name: songName.trim(), success: true, ...result });
            handleClose();
        } catch (err) {
            setError(`Lỗi: ${err.message}`);
            setConfirming(false);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setSongName(''); setCells({}); setConfirming(false); setUploading(false); setError(''); setDraggingSrc(null);
        onClose();
    };

    if (!song) return null;

    return (
        <Dialog open={open} onClose={!uploading ? handleClose : undefined} maxWidth="sm" fullWidth
            PaperProps={{ sx: { position: 'relative', overflow: 'visible' } }}>

            <ConfirmPopup open={confirming} songName={songName} originalName={song.name}
                cells={cells} uploading={uploading} onConfirm={handleConfirm} onCancel={() => setConfirming(false)} />

            <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>✏️ Chỉnh sửa bài hát</DialogTitle>

            <DialogContent sx={{ overflow: 'visible', pt: '20px !important' }}>
                <TextField label="Tên bài hát" value={songName} onChange={e => setSongName(e.target.value)}
                    fullWidth autoFocus size="small" sx={{ mb: 2.5 }} />

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

                {/* Header */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr', gap: 1, mb: 1 }}>
                    <div />
                    {TYPES.map(t => (
                        <Box key={t} sx={{ textAlign:'center', fontWeight:700, fontSize:'0.82rem', color:'#4a5568', py:0.6, bgcolor:'#f7fafc', borderRadius:'8px' }}>
                            {TYPE_CONFIG[t].label}
                        </Box>
                    ))}
                </Box>

                {/* Rows */}
                {DIFFICULTIES.map(diff => {
                    const cfg = DIFF_CONFIG[diff];
                    return (
                        <Box key={diff} sx={{ display:'grid', gridTemplateColumns:'100px 1fr 1fr', gap:1, mb:1.2, alignItems:'center' }}>
                            <Box sx={{ fontWeight:700, fontSize:'0.82rem', color:cfg.color, bgcolor:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:'10px', py:0.8, px:1, textAlign:'center' }}>
                                {cfg.label}
                                <Box component="span" sx={{ display:'block', fontSize:'0.65rem', opacity:0.7, fontWeight:400 }}>{cfg.sublabel}</Box>
                            </Box>
                            {TYPES.map(type => (
                                <EditFileCell key={type}
                                    cell={cells[diff]?.[type] || { existing: null, newFile: null, toRemove: false, moveFrom: null }}
                                    difficulty={diff} type={type}
                                    onUpdate={(c) => updateCell(diff, type, c)}
                                    onError={setError}
                                    draggingSrc={draggingSrc}
                                    onDragStart={(d, t) => setDraggingSrc({ diff: d, type: t })}
                                    onDragEnd={() => setDraggingSrc(null)}
                                    onInternalDrop={(srcDiff, srcType) => handleInternalMove(srcDiff, srcType, diff, type)}
                                />
                            ))}
                        </Box>
                    );
                })}

                {/* Summary chips */}
                <Box sx={{ display:'flex', gap:1, flexWrap:'wrap', mt:0.5 }}>
                    {DIFFICULTIES.flatMap(d => TYPES.map(t => {
                        const c = cells[d]?.[t];
                        if (!c) return null;
                        if (c.moveFrom)  return <Chip key={`${d}-${t}-mv`} label={`↕ ${c.moveFrom.diff}→${d}`} size="small" sx={{ bgcolor:'#e9d8fd', color:'#6b46c1' }} />;
                        if (c.newFile)   return <Chip key={`${d}-${t}-new`} label={`➕ ${d}/${t}`} size="small" color="primary" variant="outlined" />;
                        if (c.toRemove && !c.newFile) return <Chip key={`${d}-${t}-rm`} label={`🗑 ${d}/${t}`} size="small" color="error" variant="outlined" />;
                        return null;
                    }))}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px:3, pb:2 }}>
                <Button onClick={handleClose} disabled={uploading}>Hủy</Button>
                <Button onClick={handleSubmitClick} variant="contained" disabled={uploading}>Lưu thay đổi</Button>
            </DialogActions>
        </Dialog>
    );
}

export default EditSongDialog;
