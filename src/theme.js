import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#4F46E5', // Indigo 600
            light: '#6366F1',
            dark: '#4338CA',
        },
        secondary: {
            main: '#DB2777', // Pink 600
            light: '#EC4899',
            dark: '#BE185D',
        },
        background: {
            default: '#F3F4F6', // Gray 100
            paper: '#FFFFFF',
        },
        error: {
            main: '#EF4444', // Red 500
        },
        warning: {
            main: '#F59E0B', // Amber 500
        },
        success: {
            main: '#10B981', // Emerald 500
        },
        info: {
            main: '#3B82F6', // Blue 500
        },
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 700,
        },
        h3: {
            fontWeight: 600,
        },
        button: {
            textTransform: 'none', // Material 3 often uses sentence case or no transform
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 16, // More rounded corners for Material 3 feel
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 24, // Pill-shaped buttons
                    padding: '8px 24px',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 24,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', // Soft shadow
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                rounded: {
                    borderRadius: 24,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                    },
                },
            },
        },
    },
});

export default theme;
