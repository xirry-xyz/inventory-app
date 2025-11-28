import React, { memo } from 'react';
import {
    TextField, Button, FormControl, InputLabel, Select, MenuItem, Grid, Box, Typography, FormControlLabel, Checkbox
} from '@mui/material';

const categories = [
    '食品生鲜',
    '日用百货',
    '个护清洁',
    '医疗健康',
    '猫咪相关',
    '其他'
];

const ItemForm = memo(({ newItem, setNewItem, addItem, user, showStatus }) => {

    const handleInputChange = (e) => {
        const { name, value, checked, type } = e.target;
        setNewItem(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await addItem(newItem, showStatus);
    };

    // 检查用户是否已登录 (user 存在且有 uid)
    const isLoggedIn = !!user && !!user.uid;

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                基本信息
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="物品名称"
                        name="name"
                        value={newItem.name}
                        onChange={handleInputChange}
                        required
                        size="small"
                        placeholder="例如：洗手液"
                    />
                </Grid>
                <Grid item xs={12}>
                    <FormControl fullWidth required size="small">
                        <InputLabel>分类</InputLabel>
                        <Select
                            name="category"
                            value={newItem.category}
                            label="分类"
                            onChange={handleInputChange}
                        >
                            {categories.map(cat => (
                                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                库存设置
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="当前库存"
                        name="currentStock"
                        type="number"
                        value={newItem.currentStock}
                        onChange={handleInputChange}
                        required
                        size="small"
                        inputProps={{ min: 0 }}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="安全库存"
                        name="safetyStock"
                        type="number"
                        value={newItem.safetyStock}
                        onChange={handleInputChange}
                        required
                        size="small"
                        inputProps={{ min: 1 }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="过期日期 (可选)"
                        name="expirationDate"
                        type="date"
                        value={newItem.expirationDate || ''}
                        onChange={handleInputChange}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
            </Grid>

            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                周期性更换 (可选)
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={newItem.isPeriodic || false}
                                onChange={handleInputChange}
                                name="isPeriodic"
                            />
                        }
                        label="启用周期性更换提醒 (如电动牙刷头)"
                    />
                </Grid>
                {newItem.isPeriodic && (
                    <>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="更换周期 (天)"
                                name="replacementCycle"
                                type="number"
                                value={newItem.replacementCycle || ''}
                                onChange={handleInputChange}
                                required={newItem.isPeriodic}
                                size="small"
                                inputProps={{ min: 1 }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="上次更换日期"
                                name="lastReplaced"
                                type="date"
                                value={newItem.lastReplaced || new Date().toISOString().split('T')[0]}
                                onChange={handleInputChange}
                                required={newItem.isPeriodic}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </>
                )}
            </Grid>

            <Button
                type="submit"
                fullWidth
                variant="contained"
                disableElevation
                disabled={!isLoggedIn}
                sx={{ height: 40 }}
            >
                {isLoggedIn ? '保存物品' : '请先登录'}
            </Button>
        </Box>
    );
});

export default ItemForm;
