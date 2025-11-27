import React from 'react';
import {
    Card, CardContent, CardActions, Typography, Button, IconButton, Box, Chip, Stack
} from '@mui/material';
import {
    Add, Remove, Delete, Warning, CheckCircle, EventBusy, Schedule, CalendarToday
} from '@mui/icons-material';
import {
    ShoppingCart, Package, Heart, Leaf, Wrench, Sprout, Cat
} from 'lucide-react';

const categories = {
    '全部': <Package className="w-5 h-5" />,
    '食品生鲜': <Leaf className="w-5 h-5" />,
    '日用百货': <ShoppingCart className="w-5 h-5" />,
    '个护清洁': <Wrench className="w-5 h-5" />,
    '医疗健康': <Heart className="w-5 h-5" />,
    '猫咪相关': <Cat className="w-5 h-5" />,
    '其他': <Sprout className="w-5 h-5" />,
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

    // Card Styling based on status
    let cardBgColor = 'background.paper';
    let cardBorderColor = 'transparent';

    if (expirationStatus === 'expired') {
        cardBgColor = '#FEF2F2'; // Red 50
        cardBorderColor = 'error.main';
    } else if (expirationStatus === 'warning') {
        cardBgColor = '#FFFBEB'; // Amber 50
        cardBorderColor = 'warning.main';
    } else if (needsRestock) {
        cardBorderColor = 'warning.main';
    }

    return (
        <Card
            variant="outlined"
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: cardBgColor,
                borderColor: cardBorderColor !== 'transparent' ? cardBorderColor : undefined,
                borderWidth: cardBorderColor !== 'transparent' ? 2 : 1,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                }
            }}
        >
            <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography variant="h6" component="div" fontWeight="bold">
                            {item.name}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
                            <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                                {categories[item.category] || categories['其他']}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                {item.category}
                            </Typography>
                        </Stack>
                    </Box>
                    <Chip
                        icon={needsRestock ? <Warning /> : <CheckCircle />}
                        label={needsRestock ? "需补货" : "充足"}
                        color={needsRestock ? "warning" : "success"}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                    />
                </Box>

                {/* Expiration Info */}
                {item.expirationDate && (
                    <Box
                        sx={{
                            mb: 2, p: 1, borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.6)',
                            display: 'flex', alignItems: 'center', gap: 1,
                            color: expirationStatus === 'expired' ? 'error.main' :
                                expirationStatus === 'warning' ? 'warning.dark' : 'success.dark'
                        }}
                    >
                        {expirationStatus === 'expired' ? <EventBusy fontSize="small" /> :
                            expirationStatus === 'warning' ? <Schedule fontSize="small" /> :
                                <CalendarToday fontSize="small" />}

                        <Typography variant="body2" fontWeight="medium">
                            {expirationStatus === 'expired' ? `已过期 ${Math.abs(daysRemaining)} 天` :
                                expirationStatus === 'warning' ? `${daysRemaining} 天后过期` :
                                    `有效期至 ${item.expirationDate}`}
                        </Typography>
                    </Box>
                )}

                <Typography variant="body2" color="text.secondary">
                    安全库存: {item.safetyStock} {item.unit || '份'}
                </Typography>
            </CardContent>

            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'action.hover', borderRadius: 8, p: 0.5 }}>
                    <IconButton
                        size="small"
                        onClick={() => updateStock(item.id, item.currentStock - 1)}
                        disabled={!isUserLoggedIn}
                        color="primary"
                    >
                        <Remove fontSize="small" />
                    </IconButton>

                    <Typography
                        variant="h6"
                        sx={{
                            mx: 2,
                            minWidth: 24,
                            textAlign: 'center',
                            color: needsRestock ? 'warning.main' : 'primary.main',
                            fontWeight: 'bold'
                        }}
                    >
                        {item.currentStock}
                    </Typography>

                    <IconButton
                        size="small"
                        onClick={() => updateStock(item.id, item.currentStock + 1)}
                        disabled={!isUserLoggedIn}
                        color="primary"
                    >
                        <Add fontSize="small" />
                    </IconButton>
                </Box>

                <IconButton
                    onClick={() => deleteItem(item.id)}
                    disabled={!isUserLoggedIn}
                    color="error"
                    sx={{ bgcolor: 'error.lighter', '&:hover': { bgcolor: 'error.light', color: 'white' } }}
                >
                    <Delete />
                </IconButton>
            </CardActions>
        </Card>
    );
};

export default ItemCard;
