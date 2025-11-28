import React, { useState } from 'react';
import {
    Box, TextField, Button, Stack, Typography, InputAdornment
} from '@mui/material';

const ChoreForm = ({ onSubmit, onCancel }) => {
    const [name, setName] = useState('');
    const [frequency, setFrequency] = useState(7);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({
            name,
            frequency: Number(frequency)
        });
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Stack spacing={3}>
                <TextField
                    label="任务名称"
                    placeholder="例如：给猫咪换水"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    required
                    autoFocus
                />

                <TextField
                    label="重复频率"
                    type="number"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    fullWidth
                    required
                    InputProps={{
                        endAdornment: <InputAdornment position="end">天/次</InputAdornment>,
                        inputProps: { min: 1 }
                    }}
                    helperText="每隔多少天执行一次"
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                    <Button onClick={onCancel} color="inherit">
                        取消
                    </Button>
                    <Button type="submit" variant="contained" disableElevation>
                        添加任务
                    </Button>
                </Stack>
            </Stack>
        </Box>
    );
};

export default ChoreForm;
