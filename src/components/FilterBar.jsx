import React from 'react';
import { Box, Grid, InputBase, Stack, Chip } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import {
    Package, Leaf, ShoppingCart, Wrench, Heart, Cat, Sprout
} from 'lucide-react';

// Categories constant
export const categories = {
    '全部': <Package className="w-5 h-5" />,
    '食品生鲜': <Leaf className="w-5 h-5" />,
    '日用百货': <ShoppingCart className="w-5 h-5" />,
    '个护清洁': <Wrench className="w-5 h-5" />,
    '医疗健康': <Heart className="w-5 h-5" />,
    '猫咪相关': <Cat className="w-5 h-5" />,
    '其他': <Sprout className="w-5 h-5" />,
};

const FilterBar = ({ searchTerm, setSearchTerm, activeCategory, setActiveCategory }) => {
    return (
        <Box sx={{ p: { xs: 2, md: 3 }, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                    <Box sx={{ position: 'relative' }}>
                        <Box sx={{ position: 'absolute', top: 10, left: 12, color: 'text.secondary' }}>
                            <SearchIcon fontSize="small" />
                        </Box>
                        <InputBase
                            placeholder="搜索物品..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{
                                width: '100%',
                                pl: 5, pr: 2, py: 0.5,
                                border: '1px solid', borderColor: 'divider', borderRadius: 1,
                                fontSize: '0.875rem',
                                '&:focus-within': { borderColor: 'primary.main', borderWidth: 1 }
                            }}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
                        {Object.keys(categories).map(category => (
                            <Chip
                                key={category}
                                label={category}
                                onClick={() => setActiveCategory(category)}
                                color={activeCategory === category ? "primary" : "default"}
                                variant={activeCategory === category ? "filled" : "outlined"}
                                clickable
                                size="small"
                                sx={{ borderRadius: 1 }}
                            />
                        ))}
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default FilterBar;
