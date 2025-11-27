import React, { memo } from 'react';
import {
    TextField, Button, FormControl, InputLabel, Select, MenuItem, Grid, Box
} from '@mui/material';
import { Save } from '@mui/icons-material';

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
        const { name, value } = e.target;
        setNewItem(prev => ({
            ...prev,
            [name]: value
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
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="物品名称"
                        name="name"
                        value={newItem.name}
                        onChange={handleInputChange}
                        required
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12}>
                    <FormControl fullWidth required>
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
                <Grid item xs={6}>
                    <TextField
                        fullWidth
                        label="当前库存"
                        name="currentStock"
                        type="number"
                        value={newItem.currentStock}
                        onChange={handleInputChange}
                        required
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
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={!isLoggedIn}
                        startIcon={<Save />}
                        sx={{ mt: 2, height: 56 }}
                    >
                        {isLoggedIn ? '保存物品' : '请先登录'}
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
});

export default ItemForm;
