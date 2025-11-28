import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, FormControl, InputLabel, Select, MenuItem,
    Box, Typography
} from '@mui/material';

const ListActionModal = ({ open, onClose, mode, initialName, initialType, onSubmit }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('private');

    useEffect(() => {
        if (open) {
            setName(initialName || '');
            setType(initialType || 'private');
        }
    }, [open, initialName, initialType]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(name.trim(), type);
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { borderRadius: 2, minWidth: 320 }
            }}
        >
            <form onSubmit={handleSubmit}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    {mode === 'create' ? '新建列表' : '重命名列表'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            autoFocus
                            label="列表名称"
                            fullWidth
                            variant="outlined"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            size="small"
                        />

                        {mode === 'create' && (
                            <FormControl fullWidth size="small">
                                <InputLabel>列表类型</InputLabel>
                                <Select
                                    value={type}
                                    label="列表类型"
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <MenuItem value="private">个人私有列表</MenuItem>
                                    <MenuItem value="shared">共享列表</MenuItem>
                                </Select>
                            </FormControl>
                        )}

                        {mode === 'create' && type === 'shared' && (
                            <Typography variant="caption" color="text.secondary">
                                创建后可以通过邀请链接邀请他人加入。
                            </Typography>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={onClose} color="inherit">
                        取消
                    </Button>
                    <Button type="submit" variant="contained" disabled={!name.trim()}>
                        确定
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ListActionModal;
