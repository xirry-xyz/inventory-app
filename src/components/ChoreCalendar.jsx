import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

const DAYS_OF_WEEK = ['日', '一', '二', '三', '四', '五', '六'];

const ChoreCalendar = ({ chores, onRemoveCompletion }) => {
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
            calendarDays.push(<div key={`empty-${i}`} />);
        }

        // Days of the month
        for (let day = 1; day <= days; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateKey = date.toDateString();
            const completedChores = completionMap[dateKey] || [];
            const isToday = new Date().toDateString() === dateKey;
            const isSelected = selectedDate && selectedDate.toDateString() === dateKey;

            calendarDays.push(
                <div key={day} className="text-center mb-1">
                    <div
                        onClick={() => handleDateClick(day)}
                        className={`
                            w-9 h-9 rounded-full flex items-center justify-center mx-auto cursor-pointer relative
                            ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                            ${!isSelected && isToday ? 'bg-secondary text-secondary-foreground ring-1 ring-primary' : ''}
                            ${!isSelected && !isToday ? 'hover:bg-muted' : ''}
                        `}
                    >
                        <span className={`text-sm ${isToday || isSelected ? 'font-bold' : 'font-normal'}`}>
                            {day}
                        </span>
                        {completedChores.length > 0 && (
                            <div className={`absolute bottom-0.5 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-green-500'}`} />
                        )}
                    </div>
                </div>
            );
        }

        return calendarDays;
    };

    // Get chores for selected date
    const selectedChores = selectedDate ? (completionMap[selectedDate.toDateString()] || []) : [];

    return (
        <Card className="mb-6">
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="font-semibold text-lg">
                        {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 mb-2">
                    {DAYS_OF_WEEK.map(day => (
                        <div key={day} className="text-center">
                            <span className="text-xs text-muted-foreground">
                                {day}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-y-1">
                    {renderCalendarDays()}
                </div>

                {/* Selected Date Details */}
                {selectedDate && (
                    <div className="mt-4 pt-4 border-t">
                        <div className="text-sm font-medium mb-2">
                            {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 完成的任务:
                        </div>
                        {selectedChores.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {selectedChores.map((chore, index) => (
                                    <Badge
                                        key={`${chore.id}-${index}`}
                                        variant="outline"
                                        className="pl-2 pr-1 py-1 flex items-center gap-1 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-colors cursor-default"
                                    >
                                        <CheckCircle2 className="h-3 w-3" />
                                        {chore.name}
                                        <button
                                            className="ml-1 hover:text-destructive focus:outline-none rounded-full p-0.5"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveCompletion(chore.id, selectedDate);
                                            }}
                                        >
                                            <span className="sr-only">Remove</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground">
                                无完成记录
                            </span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ChoreCalendar;
