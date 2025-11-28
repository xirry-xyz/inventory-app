import React, { useState, useMemo } from 'react';
import {
    Box, Paper, Typography, IconButton, Grid, Badge, Tooltip, Popover, List, ListItem, ListItemText, Chip, Stack
} from '@mui/material';
import { ChevronLeft, ChevronRight, CheckCircle } from '@mui/icons-material';

const DAYS_OF_WEEK = ['日', '一', '二', '三', '四', '五', '六'];

const ChoreCalendar = ({ chores }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);

    // Process chores to get a map of date -> completed chores
    const completionMap = useMemo(() => {
        const map = {};
        chores.forEach(chore => {
            if (chore.completionHistory && Array.isArray(chore.completionHistory)) {
                chore.completionHistory.forEach(timestamp => {
                    const date = new Date(timestamp);
                    const key = date.toDateString(); // "Fri Nov 28 2025"
                    if (!map[key]) map[key] = [];
                    map[key].push(chore);
                });
            }
        });
        return map;
    }, [chores]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDate(null);
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDate(null);
    };

    const handleDateClick = (day) => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(date);
    };

    const renderCalendarDays = () => {
        const calendarDays = [];

        // Empty cells for days before start of month
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(<Grid item xs={1} key={`empty-${i}`} />);
        }

        // Days of the month
        for (let day = 1; day <= days; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateKey = date.toDateString();
            const completedChores = completionMap[dateKey] || [];
            const isToday = new Date().toDateString() === dateKey;
            const isSelected = selectedDate && selectedDate.toDateString() === dateKey;

            calendarDays.push(
                <Grid item xs={1} key={day} sx={{ textAlign: 'center', mb: 1 }}>
                    <Box
                        onClick={() => handleDateClick(day)}
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            cursor: 'pointer',
                            bgcolor: isSelected ? 'primary.main' : isToday ? 'primary.light' : 'transparent',
                            color: isSelected ? 'white' : isToday ? 'white' : 'text.primary',
                            border: isToday && !isSelected ? '1px solid' : 'none',
                            borderColor: 'primary.main',
                            position: 'relative',
                            '&:hover': {
                                bgcolor: isSelected ? 'primary.dark' : 'action.hover'
                            }
                        }}
                    >
                        <Typography variant="body2" fontWeight={isToday || isSelected ? 'bold' : 'normal'}>
                            {day}
                        </Typography>
                        {completedChores.length > 0 && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: 2,
                                    width: 4,
                                    height: 4,
                                    borderRadius: '50%',
                                    bgcolor: isSelected ? 'white' : 'success.main'
                                }}
                            />
                        )}
                    </Box>
                </Grid>
            );
        }

        return calendarDays;
    };

    // Get chores for selected date
    const selectedChores = selectedDate ? (completionMap[selectedDate.toDateString()] || []) : [];

    return (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }} variant="outlined">
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <IconButton onClick={handlePrevMonth} size="small">
                    <ChevronLeft />
                </IconButton>
                <Typography variant="subtitle1" fontWeight="bold">
                    {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
                </Typography>
                <IconButton onClick={handleNextMonth} size="small">
                    <ChevronRight />
                </IconButton>
            </Stack>

            {/* Days of Week */}
            <Grid container columns={7} sx={{ mb: 1 }}>
                {DAYS_OF_WEEK.map(day => (
                    <Grid item xs={1} key={day} sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            {day}
                        </Typography>
                    </Grid>
                ))}
            </Grid>

            {/* Calendar Grid */}
            <Grid container columns={7}>
                {renderCalendarDays()}
            </Grid>

            {/* Selected Date Details */}
            {selectedDate && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 完成的任务:
                    </Typography>
                    {selectedChores.length > 0 ? (
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                            {selectedChores.map((chore, index) => (
                                <Chip
                                    key={`${chore.id}-${index}`}
                                    label={chore.name}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    icon={<CheckCircle sx={{ width: 14, height: 14 }} />}
                                />
                            ))}
                        </Stack>
                    ) : (
                        <Typography variant="caption" color="text.secondary">
                            无完成记录
                        </Typography>
                    )}
                </Box>
            )}
        </Paper>
    );
};

export default ChoreCalendar;
