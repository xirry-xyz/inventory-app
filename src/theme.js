import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#111827', // Dark Navy/Black (Gray 900)
            light: '#374151', // Gray 700
            dark: '#000000',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#6B7280', // Gray 500
            light: '#9CA3AF',
            dark: '#4B5563',
            contrastText: '#FFFFFF',
        },
        background: {
            default: '#F9FAFB', // Gray 50
            paper: '#FFFFFF',
        },
        text: {
            primary: '#111827', // Gray 900
            secondary: '#6B7280', // Gray 500
        },
        divider: '#E5E7EB', // Gray 200
        error: {
            main: '#EF4444',
        },
        warning: {
            main: '#F59E0B',
        },
        success: {
            main: '#10B981',
        },
        info: {
            main: '#3B82F6',
        },
    },
    typography: {
        fontFamily: [
            'Inter',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
        h1: { fontWeight: 700, letterSpacing: '-0.025em' },
        h2: { fontWeight: 700, letterSpacing: '-0.025em' },
        h3: { fontWeight: 600, letterSpacing: '-0.025em' },
        h4: { fontWeight: 600, letterSpacing: '-0.025em' },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: {
            textTransform: 'none',
            fontWeight: 500,
        },
    },
    shape: {
        borderRadius: 8, // Standard rounded corners for SaaS look
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
                containedPrimary: {
                    backgroundColor: '#111827',
                    '&:hover': {
                        backgroundColor: '#1F2937',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    border: '1px solid #E5E7EB', // Subtle border
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // Very subtle shadow
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                rounded: {
                    borderRadius: 12,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 6,
                        backgroundColor: '#FFFFFF',
                        '& fieldset': {
                            borderColor: '#D1D5DB', // Gray 300
                        },
                        '&:hover fieldset': {
                            borderColor: '#9CA3AF', // Gray 400
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#111827', // Primary
                            borderWidth: 1,
                        },
                    },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#FFFFFF',
                    color: '#111827',
                    borderBottom: '1px solid #E5E7EB',
                    boxShadow: 'none',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    fontWeight: 500,
                },
            },
        },
    },
});

export default theme;
