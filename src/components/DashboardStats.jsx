import React from 'react';
import { Grid, Card, CardContent, Typography } from '@mui/material';

const DashboardStats = ({ totalItems, restockCount, expiringCount }) => {
    return (
        <Grid container spacing={2}>
            <Grid item xs={4}>
                <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ py: 1.5, px: 1, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>总物品</Typography>
                        <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1 }}>{totalItems}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={4}>
                <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ py: 1.5, px: 1, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>需补货</Typography>
                        <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1 }} color={restockCount > 0 ? "error.main" : "text.primary"}>
                            {restockCount}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={4}>
                <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ py: 1.5, px: 1, '&:last-child': { pb: 1.5 }, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>即将过期</Typography>
                        <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1 }} color={expiringCount > 0 ? "warning.main" : "text.primary"}>
                            {expiringCount}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default DashboardStats;
