import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const StatusMessage = ({ statusMessage }) => {
    if (!statusMessage) return null;

    return (
        <Snackbar
            open={!!statusMessage}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <Alert
                severity={statusMessage.isError ? 'error' : 'success'}
                variant="filled"
                sx={{ width: '100%', borderRadius: 4, boxShadow: 3 }}
            >
                {statusMessage.message}
            </Alert>
        </Snackbar>
    );
};

export default StatusMessage;
