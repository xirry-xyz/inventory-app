import React from 'react';
import { Box, Typography, Button, Chip, Stack, Grid, useMediaQuery, useTheme } from '@mui/material';
import { Add as AddIcon, Share } from '@mui/icons-material';
import InventoryTable from './InventoryTable';
import ItemCard from './ItemCard';

const InventoryView = ({
    activeTab,
    titleText,
    currentList,
    handleShareList,
    handleAddItemClick,
    user,
    itemsList,
    updateStock,
    deleteItem,
    markAsReplaced,
    isUserGoogleLoggedIn
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <>
            {/* List Header */}
            <Box sx={{
                px: 3,
                py: 2,
                bgcolor: 'background.default',
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' }, // Stack on mobile
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' }, // Align start on mobile
                gap: { xs: 2, sm: 0 } // Add gap on mobile
            }}>
                <Stack direction="column" spacing={0.5} sx={{ width: '100%' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                            {titleText}
                        </Typography>
                        {currentList && (
                            <Chip
                                label="共享列表"
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                        )}
                    </Stack>
                    {currentList && currentList.type === 'shared' && (
                        <Typography variant="caption" color="text.secondary">
                            创建者: {currentList.ownerEmail || '未知'} | 成员: {currentList.memberEmails ? currentList.memberEmails.join(', ') : `${currentList.members ? currentList.members.length : 0} 人`}
                        </Typography>
                    )}
                </Stack>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
                    {currentList && currentList.type === 'shared' && (
                        <Button
                            size="small"
                            startIcon={<Share />}
                            onClick={handleShareList}
                            sx={{ textTransform: 'none' }}
                        >
                            邀请成员
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={handleAddItemClick}
                        disabled={!user}
                        fullWidth={isMobile} // Full width button on mobile
                    >
                        {activeTab === 'chores' ? '添加任务' : '添加物品'}
                    </Button>
                </Stack>
            </Box>

            {/* Content Area */}
            <Box sx={{ p: 0 }}>
                {itemsList.length > 0 ? (
                    isMobile ? (
                        <Grid container spacing={2} sx={{ p: 2 }}>
                            {itemsList.map(item => (
                                <Grid item xs={12} key={item.id}>
                                    <ItemCard
                                        item={item}
                                        updateStock={updateStock}
                                        deleteItem={deleteItem}
                                        markAsReplaced={markAsReplaced}
                                        user={user}
                                        isMobile={isMobile}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <InventoryTable
                            items={itemsList}
                            updateStock={updateStock}
                            deleteItem={deleteItem}
                            markAsReplaced={markAsReplaced}
                            user={user}
                        />
                    )
                ) : (
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            {isUserGoogleLoggedIn
                                ? (activeTab === 'restock'
                                    ? "没有需要补货或即将过期的物品"
                                    : "没有找到匹配的物品")
                                : "请先登录"}
                        </Typography>
                    </Box>
                )}
            </Box>
        </>
    );
};

export default InventoryView;
