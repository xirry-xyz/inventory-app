import React from 'react';
import {
    Card, CardContent, Typography, IconButton, Box, Chip, Stack, Divider
} from '@mui/material';
import {
    Add, Remove, Delete, Warning, CheckCircle, EventBusy, Schedule, CalendarToday, Autorenew
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

const ItemCard = ({ item, updateStock, deleteItem, user, markAsReplaced, isMobile }) => {
    const needsRestock = item.currentStock <= item.safetyStock;
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

    const expInfo = getExpirationStatus(item.expirationDate);
    const periodicInfo = getPeriodicStatus(item);

    return (
        <Card
            variant="outlined"
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'all 0.2s',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }
            }}
        >
            <CardContent sx={{ flexGrow: 1, p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom component="div">
                            {item.name}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                                {categories[item.category] || categories['其他']}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {item.category}
                            </Typography>
                        </Stack>
                    </Box>
                    {/* Status Chip & Delete Button */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        {needsRestock ? (
                            <Chip label="需补货" color="error" size="small" sx={{ height: 24, fontWeight: 'bold' }} />
                        ) : (
                            <Chip label="充足" color="success" size="small" variant="outlined" sx={{ height: 24 }} />
                        )}
                        <IconButton
                            size="small"
                            onClick={() => deleteItem(item.id)}
                            disabled={!isUserLoggedIn}
                            sx={{
                                color: 'text.disabled',
                                '&:hover': { color: 'error.main' },
                                opacity: isMobile ? 1 : 0,
                                transition: 'opacity 0.2s',
                                '.MuiCard-root:hover &': { opacity: 1 },
                                p: 0.5
                            }}
                        >
                            <Delete fontSize="small" />
                        </IconButton>
                    </Stack>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Stack spacing={2}>
                    {/* Stock Control */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">当前库存</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <IconButton
                                size="small"
                                onClick={() => updateStock(item.id, item.currentStock - 1)}
                                disabled={!isUserLoggedIn}
                                sx={{ border: '1px solid', borderColor: 'divider', p: 0.5 }}
                            >
                                <Remove fontSize="small" />
                            </IconButton>
                            <Typography variant="body1" fontWeight="bold" sx={{ minWidth: 24, textAlign: 'center' }}>
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
                    </Stack>

                    {/* Expiry / Periodic Info */}
                    {(expInfo || periodicInfo) && (
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                {expInfo ? (
                                    <>
                                        {expInfo.status === 'expired' ? <EventBusy fontSize="small" color="error" /> :
                                            expInfo.status === 'warning' ? <Schedule fontSize="small" color="warning" /> :
                                                <CalendarToday fontSize="small" color="success" />}
                                        <Typography variant="body2" color={expInfo.status === 'expired' ? 'error.main' : expInfo.status === 'warning' ? 'warning.main' : 'text.primary'}>
                                            {expInfo.status === 'expired' ? `已过期 ${expInfo.days} 天` :
                                                expInfo.status === 'warning' ? `${expInfo.days} 天后过期` :
                                                    item.expirationDate}
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        {periodicInfo.status === 'expired' ? <Autorenew fontSize="small" color="error" /> :
                                            periodicInfo.status === 'warning' ? <Autorenew fontSize="small" color="warning" /> :
                                                <Autorenew fontSize="small" color="success" />}
                                        <Typography variant="body2" color={periodicInfo.status === 'expired' ? 'error.main' : periodicInfo.status === 'warning' ? 'warning.main' : 'text.primary'}>
                                            {periodicInfo.status === 'expired' ? `超期 ${periodicInfo.days} 天` :
                                                periodicInfo.status === 'warning' ? `${periodicInfo.days} 天后更换` :
                                                    `${periodicInfo.days} 天后更换`}
                                        </Typography>
                                    </>
                                )}
                            </Stack>
                            {periodicInfo && (
                                <IconButton
                                    size="small"
                                    onClick={() => markAsReplaced(item.id)}
                                    disabled={!isUserLoggedIn}
                                    title="标记为已更换"
                                    sx={{ p: 0.5, bgcolor: 'background.paper' }}
                                >
                                    <CheckCircle fontSize="small" color="action" />
                                </IconButton>
                            )}
                        </Stack>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default ItemCard;
