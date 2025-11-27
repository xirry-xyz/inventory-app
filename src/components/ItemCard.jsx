import React from 'react';
import {
    Card, CardContent, Typography, IconButton, Box, Chip, Stack, Divider
} from '@mui/material';
import {
    Add, Remove, Delete, Warning, CheckCircle, EventBusy, Schedule, CalendarToday
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

const ItemCard = ({ item, updateStock, deleteItem, user }) => {
    const needsRestock = item.currentStock <= item.safetyStock;
    const isUserLoggedIn = !!user && !!user.uid;

    // Expiration Logic
    let expirationStatus = 'good'; // good, warning, expired
    let daysRemaining = null;

    if (item.expirationDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expDate = new Date(item.expirationDate);
        expDate.setHours(0, 0, 0, 0);

        const diffTime = expDate - today;
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) {
            expirationStatus = 'expired';
        } else if (daysRemaining <= 7) {
            expirationStatus = 'warning';
        }
    }

    return (
        <Card
            variant="outlined"
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }
            }}
        >
            <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                            {item.name}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                                {categories[item.category] || categories['其他']}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                                {item.category}
                            </Typography>
                        </Stack>
                    </Box>
                    {needsRestock && (
                        <Chip
                            label="补货"
                            color="error"
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                        />
                    )}
                </Stack>

                {/* Expiration Info */}
                {item.expirationDate && (
                    <Box
                        sx={{
                            mb: 2, p: 1, borderRadius: 1,
                            bgcolor: expirationStatus === 'expired' ? '#FEF2F2' :
                                expirationStatus === 'warning' ? '#FFFBEB' : '#F0FDF4',
                            color: expirationStatus === 'expired' ? '#991B1B' :
                                expirationStatus === 'warning' ? '#92400E' : '#166534',
                            display: 'flex', alignItems: 'center', gap: 1,
                            fontSize: '0.8rem'
                        }}
                    >
                        {expirationStatus === 'expired' ? <EventBusy sx={{ fontSize: 16 }} /> :
                            expirationStatus === 'warning' ? <Schedule sx={{ fontSize: 16 }} /> :
                                <CalendarToday sx={{ fontSize: 16 }} />}

                        <Typography variant="caption" fontWeight="medium">
                            {expirationStatus === 'expired' ? `过期 ${Math.abs(daysRemaining)} 天` :
                                expirationStatus === 'warning' ? `${daysRemaining} 天后过期` :
                                    `有效期: ${item.expirationDate}`}
                        </Typography>
                    </Box>
                )}

                <Divider sx={{ my: 1.5 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                        库存: <Box component="span" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{item.currentStock}</Box> / {item.safetyStock}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <IconButton
                            size="small"
                            onClick={() => updateStock(item.id, item.currentStock - 1)}
                            disabled={!isUserLoggedIn}
                            sx={{ p: 0.5, borderRadius: 0 }}
                        >
                            <Remove sx={{ fontSize: 16 }} />
                        </IconButton>

                        <Box sx={{ px: 1, borderLeft: '1px solid', borderRight: '1px solid', borderColor: 'divider', minWidth: 24, textAlign: 'center' }}>
                            <Typography variant="body2" fontWeight="bold">
                                {item.currentStock}
                            </Typography>
                        </Box>

                        <IconButton
                            size="small"
                            onClick={() => updateStock(item.id, item.currentStock + 1)}
                            disabled={!isUserLoggedIn}
                            sx={{ p: 0.5, borderRadius: 0 }}
                        >
                            <Add sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>
                </Stack>
            </CardContent>

            {/* Optional: Delete button on hover or always visible but subtle */}
            <Box sx={{ position: 'absolute', top: 8, right: 8, opacity: 0, transition: 'opacity 0.2s', '.MuiCard-root:hover &': { opacity: 1 } }}>
                <IconButton
                    size="small"
                    onClick={() => deleteItem(item.id)}
                    disabled={!isUserLoggedIn}
                    sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                >
                    <Delete fontSize="small" />
                </IconButton>
            </Box>
        </Card>
    );
};

export default ItemCard;
