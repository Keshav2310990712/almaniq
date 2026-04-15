import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Clock, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { cancelBooking, getAvailability, getBookings, getEventTypes, getSlots, rescheduleBooking } from '@/lib/api';

export default function BookingsPage() {
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [upcomingRowsPerPage, setUpcomingRowsPerPage] = useState(10);
  const [pastRowsPerPage, setPastRowsPerPage] = useState(10);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['bookings-dashboard'],
    queryFn: async () => {
      const [bookingsData, eventTypes, availability] = await Promise.all([
        getBookings(),
        getEventTypes(),
        getAvailability()
      ]);

      const eventTypeMap = new Map((eventTypes || []).map((event) => [event.id, event]));

      return {
        timezone: availability?.timezone || 'UTC',
        bookings: (bookingsData || []).map((booking) => ({
          ...booking,
          id: booking.uid,
          eventTitle: eventTypeMap.get(booking.eventTypeId)?.title || 'Deleted Event',
          eventDescription: eventTypeMap.get(booking.eventTypeId)?.description || '',
          eventActive: eventTypeMap.get(booking.eventTypeId)?.active ?? false
        }))
      };
    }
  });

  const cancelBookingMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookings-dashboard'] });
    }
  });

  const rescheduleBookingMutation = useMutation({
    mutationFn: ({ id, payload }) => rescheduleBooking(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bookings-dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['booking-reschedule-slots'] })
      ]);
    }
  });

  const bookings = dashboardData?.bookings || [];
  const timezone = dashboardData?.timezone || 'UTC';
  const selectedBooking = bookings.find((booking) => booking.id === selectedBookingId) || null;
  const selectedBookingCanReschedule =
    selectedBooking?.status === 'confirmed' && selectedBooking?.eventActive;

  useEffect(() => {
    if (!selectedBooking) {
      setRescheduleDate('');
      setRescheduleTime('');
      return;
    }

    setRescheduleDate(selectedBooking.date);
    setRescheduleTime('');
  }, [selectedBooking]);

  const { data: slotsResponse, isFetching: isFetchingSlots } = useQuery({
    queryKey: ['booking-reschedule-slots', selectedBooking?.eventTypeId, rescheduleDate],
    queryFn: () => getSlots({ eventId: selectedBooking.eventTypeId, date: rescheduleDate }),
    enabled: Boolean(selectedBookingCanReschedule && rescheduleDate)
  });

  const availableSlots = slotsResponse?.slots || [];
  const dialogTimezone = slotsResponse?.timezone || timezone;

  const handleCancelBooking = async (uid) => {
    try {
      await cancelBookingMutation.mutateAsync(uid);
    } catch {
      toast({
        title: 'Failed to cancel booking',
        description: 'Please try again.'
      });
    }
  };

  const handleRescheduleBooking = async () => {
    if (!selectedBooking || !rescheduleDate || !rescheduleTime) {
      return;
    }

    try {
      await rescheduleBookingMutation.mutateAsync({
        id: selectedBooking.id,
        payload: {
          date: rescheduleDate,
          time: rescheduleTime
        }
      });

      toast({ title: 'Booking rescheduled' });
      setSelectedBookingId(null);
    } catch (error) {
      toast({
        title: 'Failed to reschedule booking',
        description: error?.response?.data?.message || 'Please try another time.'
      });
    }
  };

  const nowInTimezone = getNowInTimeZone(timezone);
  const upcoming = bookings
    .filter((booking) => booking.status === 'confirmed' && `${booking.date}T${booking.time}` >= nowInTimezone)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const past = bookings
    .filter((booking) => booking.status === 'cancelled' || (booking.status === 'confirmed' && `${booking.date}T${booking.time}` < nowInTimezone))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  useEffect(() => {
    setUpcomingPage(1);
  }, [upcomingRowsPerPage]);

  useEffect(() => {
    setPastPage(1);
  }, [pastRowsPerPage]);

  useEffect(() => {
    setUpcomingPage((prev) => Math.min(prev, Math.max(1, Math.ceil(upcoming.length / upcomingRowsPerPage))));
  }, [upcoming.length, upcomingRowsPerPage]);

  useEffect(() => {
    setPastPage((prev) => Math.min(prev, Math.max(1, Math.ceil(past.length / pastRowsPerPage))));
  }, [past.length, pastRowsPerPage]);

  const selectedBookingDetails = useMemo(() => {
    if (!selectedBooking) {
      return [];
    }

    return [
      { label: 'When', value: `${format(parseISO(selectedBooking.date), 'MMM d, yyyy')} at ${selectedBooking.time}` },
      { label: 'Duration', value: `${selectedBooking.duration}m` },
      { label: 'Status', value: selectedBooking.status === 'cancelled' ? 'Cancelled' : selectedBooking.eventActive ? 'Confirmed' : 'Inactive event' },
      { label: 'Timezone', value: dialogTimezone },
      { label: 'Guest', value: selectedBooking.name },
      { label: 'Email', value: selectedBooking.email }
    ];
  }, [dialogTimezone, selectedBooking]);

  const BookingRow = ({ booking, showActions }) => (
    <div className="border-b border-border px-4 py-5 transition-colors last:border-b-0 hover:bg-secondary/30 sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <button
          type="button"
          onClick={() => setSelectedBookingId(booking.id)}
          className="flex min-w-0 flex-1 items-start gap-4 text-left"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="grid min-w-0 flex-1 gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-1">
              <p className="text-base font-medium text-foreground">{format(parseISO(booking.date), 'EEE, MMM d')}</p>
              <p className="text-sm text-muted-foreground">
                {booking.time} - {booking.duration}m
              </p>
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-medium text-foreground">{booking.eventTitle}</p>
              <p className="truncate text-sm text-muted-foreground">
                {booking.name} {booking.email ? `- ${booking.email}` : ''}
              </p>
            </div>
          </div>
        </button>
        <div className="ml-0 flex shrink-0 flex-wrap items-center gap-3 xl:ml-4 xl:justify-end">
          {!booking.eventActive ? (
            <span className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
              Inactive
            </span>
          ) : null}
          {booking.status === 'cancelled' ? (
            <span className="rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
              Cancelled
            </span>
          ) : showActions ? (
            <div className="flex flex-wrap items-center gap-2">
              {booking.eventActive ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedBookingId(booking.id);
                  }}
                  className="rounded-lg"
                >
                  Reschedule
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  handleCancelBooking(booking.id);
                }}
                className="rounded-lg text-destructive hover:text-destructive"
              >
                <XCircle className="mr-1 w-4 h-4" />
                Cancel
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  const BookingSection = ({ title, bookingsList, page, onPageChange, rowsPerPage, onRowsPerPageChange, showActions, emptyMessage }) => {
    const totalPages = Math.max(1, Math.ceil(bookingsList.length / rowsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIndex = bookingsList.length === 0 ? 0 : (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, bookingsList.length);
    const visibleBookings = bookingsList.slice(startIndex, endIndex);

    return (
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">{title} ({bookingsList.length})</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {visibleBookings.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            visibleBookings.map((booking) => (
              <BookingRow key={booking.id} booking={booking} showActions={showActions} />
            ))
          )}

          <div className="flex flex-col gap-4 border-t border-border bg-secondary/40 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 text-sm text-foreground">
              <select
                value={rowsPerPage}
                onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-foreground/20"
              >
                {[5, 10, 20].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <span className="text-muted-foreground">rows per page</span>
            </div>

            <div className="flex items-center justify-between gap-3 md:justify-end">
              <span className="text-sm text-muted-foreground">
                {bookingsList.length === 0 ? '0-0 of 0' : `${startIndex + 1}-${endIndex} of ${bookingsList.length}`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || bookingsList.length === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || bookingsList.length === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage all your scheduled bookings.</p>
        </div>

        <div className="space-y-6">
          <BookingSection
            title="Upcoming"
            bookingsList={upcoming}
            page={upcomingPage}
            onPageChange={setUpcomingPage}
            rowsPerPage={upcomingRowsPerPage}
            onRowsPerPageChange={setUpcomingRowsPerPage}
            showActions
            emptyMessage={isLoading ? 'Loading bookings...' : 'No upcoming bookings'}
          />

          {past.length > 0 || isLoading ? (
            <BookingSection
              title="Past & Cancelled"
              bookingsList={past}
              page={pastPage}
              onPageChange={setPastPage}
              rowsPerPage={pastRowsPerPage}
              onRowsPerPageChange={setPastRowsPerPage}
              emptyMessage={isLoading ? 'Loading bookings...' : 'No past or cancelled bookings'}
            />
          ) : null}
        </div>
      </div>

      <Dialog open={Boolean(selectedBooking)} onOpenChange={(open) => !open && setSelectedBookingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedBooking?.eventTitle}</DialogTitle>
            <DialogDescription>
              {selectedBooking?.eventDescription || 'Booking details and quick actions.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {selectedBookingDetails.map((detail) => (
                <div key={detail.label} className="rounded-lg border border-border p-3">
                  <p className="mb-1 text-xs text-muted-foreground">{detail.label}</p>
                  <p className="text-sm text-foreground">{detail.value}</p>
                </div>
              ))}
            </div>

            {selectedBookingCanReschedule ? (
              <div className="space-y-4 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Clock className="w-4 h-4" />
                  Reschedule
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reschedule-date">New Date</Label>
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(event) => {
                      setRescheduleDate(event.target.value);
                      setRescheduleTime('');
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Available Times</Label>
                  <div className="flex flex-wrap gap-2">
                    {isFetchingSlots ? (
                      <p className="text-sm text-muted-foreground">Loading available times</p>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No available times for this date</p>
                    ) : (
                      availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          type="button"
                          variant={rescheduleTime === slot ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setRescheduleTime(slot)}
                        >
                          {slot}
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            {selectedBookingCanReschedule ? (
              <Button
                onClick={handleRescheduleBooking}
                disabled={!rescheduleDate || !rescheduleTime || rescheduleBookingMutation.isPending}
              >
                {rescheduleBookingMutation.isPending ? 'Saving...' : 'Save Reschedule'}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function getNowInTimeZone(timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const getPart = (type) => parts.find((part) => part.type === type)?.value || '00';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:${getPart('minute')}`;
}
