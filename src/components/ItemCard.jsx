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

    // ... (rest of the logic)

    return (
        <Card
            variant="outlined"
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative', // Ensure absolute positioning works
                transition: 'all 0.2s',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }
            }}
        >
            {/* ... content ... */}

            {/* Delete button: Always visible on mobile, hover on desktop */}
            <Box sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                opacity: isMobile ? 1 : 0,
                transition: 'opacity 0.2s',
                '.MuiCard-root:hover &': { opacity: 1 }
            }}>
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
