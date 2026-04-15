import { useState } from 'react';
import { Plus, Copy, Pencil, Trash2, ExternalLink } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import EventTypeDialog from '@/components/EventTypeDialog';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createEventType, deleteEventType, getEventTypes, updateEventType } from '@/lib/api';
export default function EventTypes() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const queryClient = useQueryClient();
    const { data: eventTypes = [], isLoading: loading } = useQuery({
        queryKey: ['event-types'],
        queryFn: getEventTypes,
    });
    const invalidateEventTypeQueries = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['event-types'] }),
            queryClient.invalidateQueries({ queryKey: ['event-type'] })
        ]);
    };
    const createEventMutation = useMutation({
        mutationFn: createEventType,
        onSuccess: async () => {
            await invalidateEventTypeQueries();
        }
    });
    const updateEventMutation = useMutation({
        mutationFn: ({ id, payload }) => updateEventType(id, payload),
        onSuccess: async () => {
            await invalidateEventTypeQueries();
        }
    });
    const deleteEventMutation = useMutation({
        mutationFn: deleteEventType,
        onSuccess: async () => {
            await invalidateEventTypeQueries();
        }
    });
    const getEventPath = (slug) => `/book/${slug}`;
    const copyLink = (slug) => {
        const url = `${window.location.origin}${getEventPath(slug)}`;
        navigator.clipboard.writeText(url);
        toast({ title: 'Link copied', description: 'Booking link copied to clipboard.' });
    };
    const toggleEvent = async (id) => {
        const currentEvent = eventTypes.find(e => e.id === id);
        if (!currentEvent)
            return;
        try {
            await updateEventMutation.mutateAsync({ id, payload: { active: !currentEvent.active } });
        }
        catch (error) {
            toast({
                title: 'Failed to update event type',
                description: error?.response?.data?.message || 'Please try again.'
            });
        }
    };
    const addEvent = async (event) => {
        await createEventMutation.mutateAsync(event);
    };
    const saveEventUpdate = async (id, updates) => {
        await updateEventMutation.mutateAsync({ id, payload: updates });
    };
    const removeEvent = async (id) => {
        try {
            await deleteEventMutation.mutateAsync(id);
        }
        catch (error) {
            toast({
                title: 'Cannot delete event type',
                description: error?.response?.data?.message || 'Please try again.'
            });
        }
    };
    const handleSave = async (data) => {
        try {
            if (editing) {
                await saveEventUpdate(editing.id, data);
            }
            else {
                await addEvent(data);
            }
            setDialogOpen(false);
            setEditing(null);
        }
        catch (error) {
            toast({
                title: 'Failed to save event type',
                description: error?.response?.data?.message || 'Please try again.'
            });
        }
    };
    const getEventHref = (slug) => getEventPath(slug);
    return (<DashboardLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Event Types</h1>
            <p className="text-sm text-muted-foreground mt-1">Create events for people to book on your calendar.</p>
          </div>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="h-11 gap-2 self-start rounded-xl px-5 shadow-sm">
            <Plus className="w-4 h-4"/>
            New Event Type
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {loading ? (<div className="p-12 text-center text-muted-foreground text-sm">
              Loading event types...
            </div>) : eventTypes.length === 0 ? (<div className="p-12 text-center text-muted-foreground text-sm">
              No event types yet. Create your first one.
            </div>) : (eventTypes.map((event, i) => (<div key={event.id} className={`px-4 py-5 transition-colors hover:bg-secondary/30 sm:px-6 ${i < eventTypes.length - 1 ? 'border-b border-border' : ''}`}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className={`mt-1 h-12 w-1.5 rounded-full ${event.active ? 'bg-brand' : 'bg-border'}`}/>
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
                        <span className="text-sm text-muted-foreground">{getEventPath(event.slug)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
                          {event.duration}m
                        </span>
                        {event.description ? (<p className="min-w-0 text-sm text-muted-foreground">{event.description}</p>) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      {!event.active ? <span className="text-sm text-muted-foreground">Hidden</span> : null}
                      <Switch checked={event.active} onCheckedChange={() => toggleEvent(event.id)}/>
                    </div>
                    <div className="flex w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm sm:w-auto">
                      <Link to={getEventHref(event.slug)} target="_blank">
                        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-none border-r border-border">
                          <ExternalLink className="w-4 h-4"/>
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-11 w-11 rounded-none border-r border-border" onClick={() => copyLink(event.slug)}>
                        <Copy className="w-4 h-4"/>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-11 w-11 rounded-none border-r border-border" onClick={() => { setEditing(event); setDialogOpen(true); }}>
                        <Pencil className="w-4 h-4"/>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-11 w-11 rounded-none" onClick={() => removeEvent(event.id)}>
                        <Trash2 className="w-4 h-4"/>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>)))}
        </div>
      </div>

      <EventTypeDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSave} initial={editing}/>
    </DashboardLayout>);
}
