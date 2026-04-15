import { Link, useLocation } from 'react-router-dom';
import { Calendar, Clock, List, Moon, Sun } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from './ThemeProvider';
import { Switch } from '@/components/ui/switch';
import { getAvailability, updateBreakMode } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
const navItems = [
    { to: '/', label: 'Event Types', icon: List },
    { to: '/bookings', label: 'Bookings', icon: Calendar },
    { to: '/availability', label: 'Availability', icon: Clock },
];
export default function AppSidebar() {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const queryClient = useQueryClient();
    const { data: availability } = useQuery({
        queryKey: ['availability'],
        queryFn: getAvailability,
    });
    const breakModeMutation = useMutation({
        mutationFn: updateBreakMode,
        onSuccess: (data) => {
            queryClient.setQueryData(['availability'], (previous = {}) => ({
                ...previous,
                isOnBreak: data.isOnBreak
            }));
            queryClient.invalidateQueries({ queryKey: ['slots'] });
            toast({
                title: data.isOnBreak ? 'Break mode enabled' : 'Break mode disabled'
            });
        },
        onError: (error) => {
            toast({
                title: 'Failed to update break mode',
                description: error?.response?.data?.message || 'Please try again.'
            });
        }
    });
    const isOnBreak = Boolean(availability?.isOnBreak);
    return (<aside className="shrink-0 border-b border-border bg-sidebar-background/95 lg:flex lg:h-screen lg:w-72 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-5 lg:py-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground shadow-sm">
            <Calendar className="w-4 h-4 text-background"/>
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">Almaniq</span>
        </Link>
        <button type="button" onClick={toggleTheme} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun className="h-4 w-4"/> : <Moon className="h-4 w-4"/>}
        </button>
      </div>
      <nav className="flex flex-wrap gap-2 px-4 pb-4 sm:px-6 lg:flex-1 lg:flex-col lg:px-4">
        {navItems.map(item => {
            const active = location.pathname === item.to;
            return (<Link key={item.to} to={item.to} className={`flex min-w-[140px] items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-colors lg:mb-0.5 lg:min-w-0 ${active
                    ? 'bg-secondary text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}>
              <item.icon className="w-4 h-4"/>
              {item.label}
            </Link>);
        })}
        <div className="flex min-w-[140px] items-center justify-between rounded-xl border border-border bg-background px-3.5 py-3 text-sm lg:min-w-0">
          <div>
            <p className="font-medium text-foreground">{isOnBreak ? 'On Break' : 'Available'}</p>
            <p className="text-xs text-muted-foreground">Pause bookings instantly</p>
          </div>
          <Switch checked={isOnBreak} disabled={breakModeMutation.isPending} onCheckedChange={(checked) => breakModeMutation.mutate(checked)}/>
        </div>
      </nav>
      <div className="hidden border-t border-border p-4 lg:block">
        <div className="flex items-center gap-3 rounded-xl px-3 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-medium text-foreground">
            U
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">User</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
      </div>
    </aside>);
}
