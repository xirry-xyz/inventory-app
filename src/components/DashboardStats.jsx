import React from 'react';
import { Stack, Card, CardContent, Typography } from '@mui/material';

const DashboardStats = ({ totalItems, restockCount, expiringCount }) => {
    return (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
            <Card sx={{ flex: 1 }}>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">总物品</Typography>
                    <Typography variant="h5" fontWeight="bold">{totalItems}</Typography>
                </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">需补货</Typography>
                    <Typography variant="h5" fontWeight="bold" color={restockCount > 0 ? "error.main" : "text.primary"}>
                        {restockCount}
                    </Typography>
                </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 }, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">即将过期</Typography>
                    <Typography variant="h5" fontWeight="bold" color={expiringCount > 0 ? "warning.main" : "text.primary"}>
                        {expiringCount}
                    </Typography>
                </CardContent>
            </Card>
        </Stack>
    );
};

export default DashboardStats;
