import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Alert,
    Stepper,
    Step,
    StepLabel
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

function AddSongDialog({ open, onClose, onAdd }) {
    const [activeStep, setActiveStep] = useState(0);
    const [songData, setSongData] = useState({
        name: '',
        printStatus: 'not print',
        difficulty: 'Easy',
        type: 'Piano',
        file: null
    });
    const [error, setError] = useState('');

    const steps = ['Thông tin bài hát', 'Upload file', 'Xác nhận'];

    const handleNext = () => {
        // Bước 1: Không cần validate tên (sẽ tự động lấy từ file)
        if (activeStep === 1) {
            if (!songData.file) {
                setError('Vui lòng chọn file PDF');
                return;
            }
        }
        setError('');
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
        setError('');
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            // Lấy tên file không có đuôi .pdf
            const fileNameWithoutExt = file.name.replace(/\.pdf$/i, '');

            // Nếu chưa nhập tên bài hát, tự động điền từ tên file
            const songName = songData.name.trim() ? songData.name : fileNameWithoutExt;

            setSongData({
                ...songData,
                file,
                name: songName
            });
            setError('');
        } else {
            setError('Vui lòng chọn file PDF');
        }
    };

    const handleSubmit = async () => {
        try {
            // Tạo FormData để upload
            const formData = new FormData();
            formData.append('file', songData.file);
            formData.append('songData', JSON.stringify({
                name: songData.name,
                printStatus: songData.printStatus,
                difficulty: songData.difficulty,
                type: songData.type
            }));

            // Upload qua API
            const response = await fetch('http://localhost:3001/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();

            onAdd({
                ...songData,
                folderPath: result.path,
                fileName: songData.file.name,
                success: true
            });

            // Reset form
            setSongData({
                name: '',
                printStatus: 'not print',
                difficulty: 'Easy',
                type: 'Piano',
                file: null
            });
            setActiveStep(0);
            setError('');
            onClose();

        } catch (err) {
            setError(`Lỗi: ${err.message}. Đảm bảo server đang chạy (npm run server)`);
            console.error('Error uploading file:', err);
        }
    };

    const handleClose = () => {
        setSongData({
            name: '',
            printStatus: 'not print',
            difficulty: 'Easy',
            type: 'Piano',
            file: null
        });
        setActiveStep(0);
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>Thêm Bài Hát Mới</DialogTitle>

            <DialogContent>
                <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {activeStep === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Tên bài hát"
                            value={songData.name}
                            onChange={(e) => setSongData({ ...songData, name: e.target.value })}
                            fullWidth
                            required
                            placeholder="Ví dụ: Canon in D"
                        />

                        <FormControl fullWidth>
                            <InputLabel>Trạng thái in</InputLabel>
                            <Select
                                value={songData.printStatus}
                                label="Trạng thái in"
                                onChange={(e) => setSongData({ ...songData, printStatus: e.target.value })}
                            >
                                <MenuItem value="printed">Đã in</MenuItem>
                                <MenuItem value="not print">Chưa in</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Độ khó</InputLabel>
                            <Select
                                value={songData.difficulty}
                                label="Độ khó"
                                onChange={(e) => setSongData({ ...songData, difficulty: e.target.value })}
                            >
                                <MenuItem value="Easy">Easy (4-6 tháng)</MenuItem>
                                <MenuItem value="Medium">Medium (6-18 tháng)</MenuItem>
                                <MenuItem value="Hard">Hard (&gt;1.5 năm)</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>Loại</InputLabel>
                            <Select
                                value={songData.type}
                                label="Loại"
                                onChange={(e) => setSongData({ ...songData, type: e.target.value })}
                            >
                                <MenuItem value="Piano">Piano</MenuItem>
                                <MenuItem value="Chord">Chord</MenuItem>
                                <MenuItem value="MIDI">MIDI</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                )}

                {activeStep === 1 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, alignItems: 'center' }}>
                        <Button
                            component="label"
                            variant="contained"
                            startIcon={<CloudUploadIcon />}
                            sx={{ mb: 2 }}
                        >
                            Chọn file PDF
                            <input
                                type="file"
                                hidden
                                accept=".pdf"
                                onChange={handleFileChange}
                            />
                        </Button>

                        {songData.file && (
                            <Alert severity="success">
                                Đã chọn: {songData.file.name}
                            </Alert>
                        )}
                    </Box>
                )}

                {activeStep === 2 && (
                    <Box sx={{ mt: 2 }}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Xác nhận thông tin bài hát
                        </Alert>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Box><strong>Tên bài hát:</strong> {songData.name}</Box>
                            <Box><strong>Trạng thái:</strong> {songData.printStatus === 'printed' ? 'Đã in' : 'Chưa in'}</Box>
                            <Box><strong>Độ khó:</strong> {songData.difficulty}</Box>
                            <Box><strong>Loại:</strong> {songData.type}</Box>
                            <Box><strong>File:</strong> {songData.file?.name}</Box>
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                <strong>Đường dẫn:</strong><br />
                                <code>{`public/piano/${songData.printStatus}/${songData.name}/${songData.difficulty}/${songData.type}/${songData.file?.name}`}</code>
                            </Box>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose}>Hủy</Button>
                {activeStep > 0 && (
                    <Button onClick={handleBack}>Quay lại</Button>
                )}
                {activeStep < steps.length - 1 ? (
                    <Button onClick={handleNext} variant="contained">
                        Tiếp theo
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} variant="contained" color="success">
                        Thêm bài hát
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

export default AddSongDialog;
