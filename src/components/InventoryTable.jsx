import React from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Chip, Typography, Box, Stack
} from '@mui/material';
import {
    Add, Remove, Delete, Edit, Warning, CheckCircle, EventBusy, Schedule, CalendarToday, Autorenew
} from '@mui/icons-material';
import {
    ShoppingCart, Package, Heart, Leaf, Wrench, Sprout, Cat
} from 'lucide-react';

const categories = {
    '全部': <Package className="w-4 h-4" />,
    '食品生鲜': <Leaf className="w-4 h-4" />,
    '日用百货': <ShoppingCart className="w-4 h-4" />,
    '个护清洁': <Wrench className="w-4 h-4" />,
    '医疗健康': <Heart className="w-4 h-4" />,
    '猫咪相关': <Cat className="w-4 h-4" />,
    '其他': <Sprout className="w-4 h-4" />,
};

const InventoryTable = ({ items, updateStock, deleteItem, user, markAsReplaced }) => {
    const isUserLoggedIn = !!user && !!user.uid;

    const getExpirationStatus = (date) => {
        if (!date) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = new Date(date);
        expDate.setHours(0, 0, 0, 0);
        const diffTime = expDate - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) return { status: 'expired', days: Math.abs(daysRemaining) };
        if (daysRemaining <= 7) return { status: 'warning', days: daysRemaining };
        return { status: 'good', days: daysRemaining };
    };

    const getPeriodicStatus = (item) => {
        if (!item.isPeriodic || !item.lastReplaced || !item.replacementCycle) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastDate = new Date(item.lastReplaced);
        lastDate.setHours(0, 0, 0, 0);

        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + Number(item.replacementCycle));

        const diffTime = nextDate - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) return { status: 'expired', days: Math.abs(daysRemaining) };
        if (daysRemaining <= 7) return { status: 'warning', days: daysRemaining };
        return { status: 'good', days: daysRemaining };
    };

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table sx={{ minWidth: 650 }} aria-label="inventory table">
                <TableHead sx={{ bgcolor: 'background.default' }}>
                    <TableRow>
                        <TableCell>物品名称</TableCell>
                        <TableCell>分类</TableCell>
                        <TableCell align="center">库存状态</TableCell>
                        <TableCell align="center">当前库存</TableCell>
                        <TableCell align="center">安全库存</TableCell>
                        <TableCell>过期时间</TableCell>
                        <TableCell align="right">操作</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((item) => {
                        const needsRestock = item.currentStock <= item.safetyStock;
                        const expInfo = getExpirationStatus(item.expirationDate);
                        const periodicInfo = getPeriodicStatus(item);

                        return (
                            <TableRow
                                key={item.id}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    <Typography variant="subtitle2" fontWeight="bold">
                                        {item.name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                                            {categories[item.category] || categories['其他']}
                                        </Box>
                                        <Typography variant="body2">
                                            {item.category}
                                        </Typography>
                                    </Stack>
                                </TableCell>
                                <TableCell align="center">
                                    {needsRestock ? (
                                        <Chip
                                            label="需补货"
                                            color="error"
                                            size="small"
                                            sx={{ height: 24, fontWeight: 'bold' }}
                                        />
                                    ) : (
                                        <Chip
                                            label="充足"
                                            color="success"
                                            size="small"
                                            variant="outlined"
                                            sx={{ height: 24 }}
                                        />
                                    )}
                                </TableCell>
                                <TableCell align="center">
                                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                                        <IconButton
                                            size="small"
                                            onClick={() => updateStock(item.id, item.currentStock - 1)}
                                            disabled={!isUserLoggedIn}
                                            sx={{ border: '1px solid', borderColor: 'divider', p: 0.5 }}
                                        >
                                            <Remove fontSize="small" />
                                        </IconButton>
                                        <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 24, textAlign: 'center' }}>
                                            {item.currentStock}
                                        </Typography>
                                        <IconButton
                                            size="small"
                                            onClick={() => updateStock(item.id, item.currentStock + 1)}
                                            disabled={!isUserLoggedIn}
                                            sx={{ border: '1px solid', borderColor: 'divider', p: 0.5 }}
                                        >
                                            <Add fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </TableCell>
                                <TableCell align="center">
                                    {item.safetyStock}
                                </TableCell>
                                <TableCell>
                                    {expInfo ? (
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            {expInfo.status === 'expired' ? <EventBusy fontSize="small" color="error" /> :
                                                expInfo.status === 'warning' ? <Schedule fontSize="small" color="warning" /> :
                                                    <CalendarToday fontSize="small" color="success" />}

                                            <Typography
                                                variant="body2"
                                                color={
                                                    expInfo.status === 'expired' ? 'error.main' :
                                                        expInfo.status === 'warning' ? 'warning.main' : 'text.primary'
                                                }
                                            >
                                                {expInfo.status === 'expired' ? `已过期 ${expInfo.days} 天` :
                                                    expInfo.status === 'warning' ? `${expInfo.days} 天后` :
                                                        item.expirationDate}
                                            </Typography>
                                        </Stack>
                                    ) : periodicInfo ? (
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            {periodicInfo.status === 'expired' ? <Autorenew fontSize="small" color="error" /> :
                                                periodicInfo.status === 'warning' ? <Autorenew fontSize="small" color="warning" /> :
                                                    <Autorenew fontSize="small" color="success" />}

                                            <Typography
                                                variant="body2"
                                                color={
                                                    periodicInfo.status === 'expired' ? 'error.main' :
                                                        periodicInfo.status === 'warning' ? 'warning.main' : 'text.primary'
                                                }
                                            >
                                                {periodicInfo.status === 'expired' ? `超期 ${periodicInfo.days} 天` :
                                                    periodicInfo.status === 'warning' ? `${periodicInfo.days} 天后更换` :
                                                        `${periodicInfo.days} 天后更换`}
                                            </Typography>
                                            <IconButton
                                                size="small"
                                                onClick={() => markAsReplaced(item.id)}
                                                disabled={!isUserLoggedIn}
                                                title="标记为已更换"
                                                sx={{ p: 0.5 }}
                                            >
                                                <CheckCircle fontSize="small" color="action" />
                                            </IconButton>
                                        </Stack>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        size="small"
                                        onClick={() => deleteItem(item.id)}
                                        disabled={!isUserLoggedIn}
                                        color="error"
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default InventoryTable;
