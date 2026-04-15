import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isBefore, startOfDay, startOfWeek, endOfWeek, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Calendar, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createBooking, getAvailability, getEventTypeBySlug, getHeatmap, getSlots } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

function getHeatmapStyles(score = 0) {
    const normalizedScore = Math.max(0, Math.min(100, Number(score) || 0));
    const ratio = normalizedScore / 100;
    const lightness = 96 - ratio * 22;
    const alpha = 0.35 + ratio * 0.45;
    return {
        backgroundColor: `hsl(213 94% ${lightness}% / ${alpha})`,
    };
}

export default function BookingPage() {
    const { slug } = useParams();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [answers, setAnswers] = useState({});
    const [confirmed, setConfirmed] = useState(false);
    const queryClient = useQueryClient();
    const today = startOfDay(new Date());
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    const calDays = eachDayOfInterval({ start: calStart, end: calEnd });
    const { data: event, isLoading: isLoadingEventTypes, isError: isEventTypesError } = useQuery({
        queryKey: ['event-type', slug],
        queryFn: () => getEventTypeBySlug(slug),
        enabled: Boolean(slug),
    });
    const { data: availability } = useQuery({
        queryKey: ['availability'],
        queryFn: getAvailability,
    });
    const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
    const currentMonthStr = format(currentMonth, 'yyyy-MM');
    const isOnBreak = Boolean(availability?.isOnBreak);
    const { data: slotsResponse, isFetching: isFetchingSlots } = useQuery({
        queryKey: ['slots', event?.id, selectedDateStr],
        queryFn: () => getSlots({ eventId: event.id, date: selectedDateStr }),
        enabled: Boolean(event?.id && selectedDateStr && !isOnBreak),
    });
    const { data: heatmapResponse } = useQuery({
        queryKey: ['heatmap', event?.id, currentMonthStr],
        queryFn: () => getHeatmap({ eventId: event.id, month: currentMonthStr }),
        enabled: Boolean(event?.id),
    });
    const createBookingMutation = useMutation({
        mutationFn: createBooking,
    });
    const slots = slotsResponse?.slots || [];
    const timezone = slotsResponse?.timezone || availability?.timezone || 'UTC';
    useEffect(() => {
        if (isOnBreak) {
            setSelectedTime(null);
        }
    }, [isOnBreak]);
    const heatmapData = useMemo(() => {
        if (!heatmapResponse?.days)
            return new Map();
        const map = new Map();
        heatmapResponse.days.forEach((day) => {
            map.set(day.date, day);
        });
        return map;
    }, [heatmapResponse]);
    const handleBook = async (e) => {
        e.preventDefault();
        if (!event || !selectedDate || !selectedTime)
            return;
        try {
            await createBookingMutation.mutateAsync({
                eventTypeId: event.id,
                name,
                email,
                answers,
                date: format(selectedDate, 'yyyy-MM-dd'),
                time: selectedTime,
            });
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['slots', event.id, format(selectedDate, 'yyyy-MM-dd')] }),
                queryClient.invalidateQueries({ queryKey: ['heatmap', event.id] }),
                queryClient.invalidateQueries({ queryKey: ['bookings'] })
            ]);
            setConfirmed(true);
        }
        catch (error) {
            toast({
                title: 'Booking failed',
                description: error?.response?.data?.message || 'Please try another time slot.'
            });
        }
    };
    if (isLoadingEventTypes || isEventTypesError || !event || !event.active) {
        return (<div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">{isLoadingEventTypes ? 'Loading event' : isEventTypesError ? 'Failed to load event' : 'Event not found'}</h1>
          <p className="text-sm text-muted-foreground mb-4">{isLoadingEventTypes ? 'Please wait while we load this booking page.' : isEventTypesError ? 'There was a problem loading this booking page. Please try again.' : 'This booking link may be invalid or the event is inactive.'}</p>
          <Link to="/"><Button variant="outline">Go Home</Button></Link>
        </div>
      </div>);
    }
    if (confirmed) {
        return (<div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-success"/>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Your {event.title} has been scheduled for{' '}
            <span className="font-medium text-foreground">
              {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </span>{' '}
            at <span className="font-medium text-foreground">{selectedTime}</span>.
          </p>
          <p className="text-xs text-muted-foreground mb-8">A confirmation will be sent to {email}</p>
          <Button variant="outline" onClick={() => {
                setConfirmed(false);
                setSelectedDate(null);
                setSelectedTime(null);
                setName('');
                setEmail('');
                setAnswers({});
            }}>
            Book another time
          </Button>
        </motion.div>
      </div>);
    }
    const showForm = selectedDate && selectedTime && !isOnBreak;
    const bookingQuestions = Array.isArray(event.bookingQuestions) ? event.bookingQuestions : [];
    return (<div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-foreground">
              U
            </div>
            <div>
              <p className="text-sm text-muted-foreground">User</p>
              <h1 className="text-xl font-bold text-foreground">{event.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4"/>
              {event.duration} min
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4"/>
              {timezone}
            </span>
          </div>
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[1fr,320px] divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Calendar */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Select a Date</h2>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(prev => addMonths(prev, -1))}>
                    <ChevronLeft className="w-4 h-4"/>
                  </Button>
                  <span className="text-sm font-medium text-foreground min-w-[130px] text-center">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
                    <ChevronRight className="w-4 h-4"/>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (<div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>))}
                {calDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const inMonth = isSameMonth(day, currentMonth);
            const past = isBefore(day, today);
            const heatmapDay = heatmapData.get(dateStr);
            const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === dateStr;
            const selectedDateHasNoSlots = isSelected && !isFetchingSlots && slots.length === 0;
            const isAvailable = inMonth && !past && !selectedDateHasNoSlots && !isOnBreak;
            const heatScore = heatmapDay?.score ?? 0;
            return (<button key={dateStr} disabled={!isAvailable} onClick={() => { setSelectedDate(day); setSelectedTime(null); }} className={`aspect-square rounded-lg text-sm flex items-center justify-center transition-all relative ${!inMonth ? 'text-muted-foreground/20 cursor-default' :
                    !isAvailable ? 'text-muted-foreground/40 cursor-default' :
                        isSelected ? 'bg-foreground text-background font-semibold' :
                            'text-foreground hover:bg-secondary font-medium cursor-pointer'}`}>
                      {isAvailable && !isSelected && heatScore > 0 && (<span className="absolute inset-1 rounded-md transition-colors" style={getHeatmapStyles(heatScore)}/>)}
                      <span className="relative">{format(day, 'd')}</span>
                    </button>);
        })}
              </div>

              {/* Heatmap legend */}
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <span>Less available</span>
                <div className="flex gap-0.5">
                  {[15, 55, 100].map((score, i) => (<div key={i} className="w-4 h-4 rounded" style={getHeatmapStyles(score)}/>))}
                </div>
                <span>More available</span>
              </div>
            </div>

            {/* Time Slots or Form */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                {isOnBreak ? (<motion.div key="break" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-full min-h-[200px]">
                    <p className="text-sm text-muted-foreground">Currently not accepting bookings</p>
                  </motion.div>) : showForm ? (<motion.div key="form" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                    <button onClick={() => setSelectedTime(null)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                      <ArrowLeft className="w-3.5 h-3.5"/>
                      Back
                    </button>
                    <h2 className="text-sm font-semibold text-foreground mb-1">
                      {format(selectedDate, 'EEEE, MMMM d')}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">{selectedTime} · {event.duration} min</p>

                    <form onSubmit={handleBook} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bname" className="text-sm">Your Name</Label>
                        <Input id="bname" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe"/>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bemail" className="text-sm">Email Address</Label>
                        <Input id="bemail" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="john@example.com"/>
                      </div>
                      {bookingQuestions.map((question, index) => (<div key={question} className="space-y-2">
                          <Label htmlFor={`question-${index}`} className="text-sm">{question}</Label>
                          <Input id={`question-${index}`} value={answers[question] || ''} onChange={e => setAnswers(prev => ({ ...prev, [question]: e.target.value }))} required/>
                        </div>))}
                      <Button type="submit" className="w-full">
                        Confirm Booking
                      </Button>
                    </form>
                  </motion.div>) : selectedDate ? (<motion.div key="slots" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                    <h2 className="text-sm font-semibold text-foreground mb-1">
                      {format(selectedDate, 'EEEE, MMMM d')}
                    </h2>
                    <p className="text-xs text-muted-foreground mb-4">{slots.length} available time{slots.length !== 1 ? 's' : ''}</p>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {isFetchingSlots ? (<p className="text-sm text-muted-foreground py-8 text-center">Loading available times</p>) : slots.length === 0 ? (<p className="text-sm text-muted-foreground py-8 text-center">No available times</p>) : slots.map(slot => (<button key={slot} onClick={() => setSelectedTime(slot)} className="w-full text-left px-4 py-3 rounded-lg border border-border text-sm font-medium text-foreground hover:border-foreground/30 hover:bg-secondary/50 transition-colors">
                          {slot}
                        </button>))}
                    </div>
                  </motion.div>) : (<motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-full min-h-[200px]">
                    <p className="text-sm text-muted-foreground">Select a date to view available times</p>
                  </motion.div>)}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
