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
                    <Grid item xs={12} sm={6} md={4} lg={3} key={chore.id}>
                        <Card variant="outlined" sx={{ borderRadius: 2, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1, p: 3, '&:last-child': { pb: 3 } }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.3 }}>
                                            {chore.name}
                                        </Typography>
                                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1, color: 'text.secondary' }}>
                                            <EventRepeat fontSize="small" sx={{ fontSize: '1rem' }} />
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
                                        sx={{ height: 24, fontSize: '0.75rem', fontWeight: 'bold' }}
                                    />
                                </Stack>

                                <Typography variant="caption" display="block" sx={{ mt: 3, mb: 3, color: 'text.secondary' }}>
                                    上次完成: {chore.lastCompleted ? new Date(chore.lastCompleted).toLocaleDateString() : '从未'}
                                </Typography>

                                <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" sx={{ mt: 'auto' }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => onDelete(chore.id)}
                                        disabled={!user}
                                        sx={{ color: 'text.disabled' }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<CheckCircle />}
                                        onClick={() => onComplete(chore)}
                                        disabled={!user}
                                        disableElevation
                                        color={status.color === 'success' ? 'primary' : status.color}
                                        sx={{ borderRadius: 2, px: 2 }}
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
