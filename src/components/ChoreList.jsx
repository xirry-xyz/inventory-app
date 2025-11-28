import React from 'react';
import {
    Card, CardContent, Typography, IconButton, Chip, Stack, Box, Button, Grid
} from '@mui/material';
import {
    CheckCircle, Delete, Edit, AccessTime, EventRepeat
} from '@mui/icons-material';

const ChoreList = ({ chores, onComplete, onDelete, onEdit, user }) => {
    const getStatus = (nextDue) => {
        if (!nextDue) return { label: '新任务', color: 'info' };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(nextDue);
        dueDate.setHours(0, 0, 0, 0);

        const diffTime = dueDate - today;
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysRemaining < 0) return { label: `逾期 ${Math.abs(daysRemaining)} 天`, color: 'error', days: daysRemaining };
        if (daysRemaining === 0) return { label: '今天', color: 'warning', days: 0 };
        if (daysRemaining <= 2) return { label: `${daysRemaining} 天后`, color: 'warning', days: daysRemaining };
        return { label: `${daysRemaining} 天后`, color: 'success', days: daysRemaining };
    };

    if (chores.length === 0) {
        return (
            <Box sx={{ py: 8, textAlign: 'center' }}>
                <Typography color="text.secondary">
                    没有家务任务，点击右上角添加
                </Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={2}>
            {chores.map(chore => {
                const status = getStatus(chore.nextDue);
                return (
                    <Grid item xs={12} sm={6} md={4} key={chore.id}>
                        <Card variant="outlined" sx={{ borderRadius: 2, position: 'relative' }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold">
                                            {chore.name}
                                        </Typography>
                                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5, color: 'text.secondary' }}>
                                            <EventRepeat fontSize="small" />
                                            <Typography variant="body2">
                                                每 {chore.frequency} 天
                                            </Typography>
                                        </Stack>
                                    </Box>
                                    <Chip
                                        label={status.label}
                                        color={status.color}
                                        size="small"
                                        variant={status.color === 'success' ? 'outlined' : 'filled'}
                                    />
                                </Stack>

                                <Typography variant="caption" display="block" sx={{ mt: 2, mb: 2, color: 'text.secondary' }}>
                                    上次完成: {chore.lastCompleted ? new Date(chore.lastCompleted).toLocaleDateString() : '从未'}
                                </Typography>

                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <IconButton
                                        size="small"
                                        onClick={() => onDelete(chore.id)}
                                        disabled={!user}
                                        sx={{ color: 'text.disabled' }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                    {/* Edit button can be added here later */}
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<CheckCircle />}
                                        onClick={() => onComplete(chore)}
                                        disabled={!user}
                                        disableElevation
                                        color={status.color === 'success' ? 'primary' : status.color} // Use status color for urgency
                                        sx={{ borderRadius: 2 }}
                                    >
                                        完成
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                );
            })}
        </Grid>
    );
};

export default ChoreList;
