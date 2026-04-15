import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export default function EventTypeDialog({ open, onOpenChange, onSave, initial }) {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [duration, setDuration] = useState(30);
    const [description, setDescription] = useState('');
    const [bookingQuestionsText, setBookingQuestionsText] = useState('');
    useEffect(() => {
        if (initial) {
            setTitle(initial.title);
            setSlug(initial.slug);
            setDuration(initial.duration);
            setDescription(initial.description);
            setBookingQuestionsText(Array.isArray(initial.bookingQuestions) ? initial.bookingQuestions.join('\n') : '');
        }
        else {
            setTitle('');
            setSlug('');
            setDuration(30);
            setDescription('');
            setBookingQuestionsText('');
        }
    }, [initial, open]);
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            title,
            slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
            duration,
            description,
            bookingQuestions: bookingQuestionsText
                .split('\n')
                .map(item => item.trim())
                .filter(Boolean)
                .slice(0, 5),
            active: initial?.active ?? true,
        });
    };
    return (<Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit' : 'New'} Event Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">URL slug</Label>
            <Input id="slug" value={slug} onChange={e => setSlug(e.target.value)} placeholder={title.toLowerCase().replace(/\s+/g, '-')}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input id="duration" type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={5} max={480}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" value={description} onChange={e => setDescription(e.target.value)}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="questions">Custom Booking Questions</Label>
            <textarea id="questions" value={bookingQuestionsText} onChange={e => setBookingQuestionsText(e.target.value)} placeholder={`Company name\nWhat would you like to discuss?`} className="flex min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"/>
            <p className="text-xs text-muted-foreground">Add one question per line. Up to 5 questions.</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{initial ? 'Save' : 'Create'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>);
}
