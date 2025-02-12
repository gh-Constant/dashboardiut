'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { useSchedule } from '@/lib/context/ScheduleContext'
import type { School, Class, Subclass, Semester, ScheduleEvent } from '@/lib/types/schedule'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import 'react-big-calendar/lib/css/react-big-calendar.css'

interface EventDialogProps {
  event: ScheduleEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

function EventDialog({ event, isOpen, onClose }: EventDialogProps) {
  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <p className="font-semibold">Horaire</p>
            <p>{format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}</p>
          </div>
          <div>
            <p className="font-semibold">Lieu</p>
            <p>{event.location}</p>
          </div>
          {event.description && (
            <div>
              <p className="font-semibold">Description</p>
              <p>{event.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const locales = {
  'fr': fr,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const messages = {
  week: 'Semaine',
  work_week: 'Semaine de travail',
  day: 'Jour',
  month: 'Mois',
  previous: 'Précédent',
  next: 'Suivant',
  today: "Aujourd'hui",
  agenda: 'Agenda',
  showMore: (total: number) => `+${total} plus`,
  noEventsInRange: '',
}

export default function SchedulePage() {
  const {
    state,
    setSchool,
    setClass,
    setSubclass,
    setSemester,
  } = useSchedule()

  const [schools, setSchools] = useState<School[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subclasses, setSubclasses] = useState<Subclass[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<View>('week')
  const [currentWeek, setCurrentWeek] = useState(7)
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null)
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)

  const fetchSchedule = useCallback(async (days: number) => {
    if (!state.subclass) {
      setEvents([])
      return
    }

    setIsLoading(true)
    setError(null) // Reset any previous errors
    
    try {
      const url = `https://sedna.univ-fcomte.fr/jsp/custom/ufc/mplanif.jsp?id=${state.subclass}&jours=${days}`;
      console.log('🔍 Fetching schedule from:', url);
      const response = await fetch(
        `/api/schedule?subclassId=${state.subclass}&jours=${days}`
      )
      console.log('Schedule response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch schedule' }))
        console.error('Schedule fetch error:', errorData)
        throw new Error(errorData.message || 'Failed to fetch schedule')
      }
      
      const data = await response.json()
      if (!Array.isArray(data)) {
        throw new Error('Invalid schedule data received')
      }
      
      console.log('Schedule data received:', data)
      setEvents(data)
    } catch (err) {
      console.error('Error in fetchSchedule:', err)
      setError(err instanceof Error ? err.message : 'Failed to load schedule')
      setEvents([]) // Clear events on error
    } finally {
      setIsLoading(false)
    }
  }, [state.subclass])

  // Load saved state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('scheduleSelections')
    if (savedState) {
      try {
        const { school, semester, class: classId, subclass } = JSON.parse(savedState)
        // Load all data in sequence if we have saved state
        if (school) {
          setSchool(school)
          Promise.all([
            fetch(`/api/schools?departmentId=6976`),
            fetch(`/api/semesters?schoolId=${school}`)
          ]).then(async ([schoolsRes, semestersRes]) => {
            if (schoolsRes.ok) setSchools(await schoolsRes.json())
            if (semestersRes.ok && semester) {
              setSemesters(await semestersRes.json())
              setSemester(semester)
              
              const classesRes = await fetch(`/api/classes?semesterId=${semester}`)
              if (classesRes.ok && classId) {
                setClasses(await classesRes.json())
                setClass(classId)
                
                const subclassesRes = await fetch(`/api/subclasses?classId=${classId}`)
                if (subclassesRes.ok && subclass) {
                  setSubclasses(await subclassesRes.json())
                  setSubclass(subclass)
                }
              }
            }
          }).catch(console.error)
        }
      } catch (error) {
        console.error('Error parsing saved state:', error)
        localStorage.removeItem('scheduleSelections')
        fetchSchools()
      }
    } else {
      fetchSchools()
    }
  }, []) // Only run once on mount

  // Fetch schools - only if no saved state
  const fetchSchools = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/schools?departmentId=6976`)
      if (response.ok) {
        const data = await response.json()
        setSchools(data)
      }
    } catch (err) {
      console.error('Error in fetchSchools:', err)
      setError('Failed to load schools')
    } finally {
      setIsLoading(false)
    }
  }

  // Save state changes to localStorage - debounced to avoid frequent saves
  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.school || state.semester || state.class || state.subclass) {
        const stateToSave = {
          school: state.school,
          semester: state.semester,
          class: state.class,
          subclass: state.subclass
        }
        localStorage.setItem('scheduleSelections', JSON.stringify(stateToSave))
      }
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timer)
  }, [state])

  // Fetch schedule with debouncing
  const debouncedFetchSchedule = useCallback(
    (() => {
      let timer: NodeJS.Timeout
      return (days: number) => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          if (state.subclass) {
            fetchSchedule(days)
          } else {
            setEvents([])
          }
        }, 300)
      }
    })(),
    [state.subclass, fetchSchedule]
  )

  // Fetch schedule when dependencies change - with debouncing
  useEffect(() => {
    debouncedFetchSchedule(currentWeek)
  }, [state.subclass, currentWeek, debouncedFetchSchedule])

  // Fetch semesters when school changes - only if different
  useEffect(() => {
    if (!state.school) {
      setSemesters([])
      return
    }

    const fetchSemesters = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/semesters?schoolId=${state.school}`)
        if (response.ok) {
          const data = await response.json()
          setSemesters(data)
        }
      } catch (err) {
        setError('Failed to load semesters')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSemesters()
  }, [state.school])

  // Fetch classes when semester changes - only if different
  useEffect(() => {
    if (!state.semester) {
      setClasses([])
      return
    }

    const fetchClasses = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/classes?semesterId=${state.semester}`)
        if (response.ok) {
          const data = await response.json()
          setClasses(data)
        }
      } catch (err) {
        setError('Failed to load classes')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClasses()
  }, [state.semester])

  // Fetch subclasses when class changes - only if different
  useEffect(() => {
    if (!state.class) {
      setSubclasses([])
      return
    }

    const fetchSubclasses = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/subclasses?classId=${state.class}`)
        if (response.ok) {
          const data = await response.json()
          setSubclasses(data)
        }
      } catch (err) {
        setError('Failed to load subclasses')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubclasses()
  }, [state.class])

  // Color mapping for events
  const getEventColor = (eventTitle: string) => {
    // Create a hash of the event title to generate a consistent color
    const hash = eventTitle.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    // Generate a hue value between 0 and 360
    const hue = Math.abs(hash % 360);
    
    // Return an HSL color with fixed saturation and lightness
    return `hsl(${hue}, 70%, 65%)`;
  };

  // Event style function
  const eventStyleGetter = (event: ScheduleEvent) => {
    const backgroundColor = getEventColor(event.title);
    return {
      style: {
        backgroundColor,
        border: 'none',
        borderRadius: '4px',
        color: '#1a1a1a',
        fontSize: '0.875rem',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        padding: '4px',
      }
    };
  };

  // Custom event component
  const EventComponent = ({ event, title }: { event: ScheduleEvent, title?: string }) => {
    const duration = new Date(event.end).getTime() - new Date(event.start).getTime();
    const minutes = duration / (1000 * 60);
    
    // Adjust font size based on event duration
    const titleSize = minutes >= 90 ? 'text-sm' : 'text-xs';
    const locationSize = minutes >= 90 ? 'text-xs' : 'text-[0.7rem]';
    
    return (
      <div className="h-full flex flex-col">
        <div className={`font-medium ${titleSize} truncate`}>
          {title || event.title}
        </div>
        {minutes >= 45 && (
          <div className={`${locationSize} text-gray-700 truncate mt-0.5`}>
            {event.location}
          </div>
        )}
      </div>
    );
  };

  // Handle event click
  const handleEventClick = (event: ScheduleEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleWeekChange = async (days: number) => {
    setCurrentWeek(days);
    // Update URL with jour parameter
    const url = new URL(window.location.href);
    url.searchParams.set('jour', days.toString());
    window.history.pushState({}, '', url);
    
    // Clear current events before fetching new ones
    setEvents([]);
    await fetchSchedule(days);
  };

  // Also update the Aujourd'hui button click handler
  const handleTodayClick = async () => {
    setCurrentWeek(1);
    setCurrentView('week');
    // Clear current events before fetching new ones
    setEvents([]);
    await fetchSchedule(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Emploi du temps</CardTitle>
          <CardDescription>
            Sélectionnez votre école, classe et semestre pour voir votre emploi du temps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">École</label>
              <Select.Root value={state.school || ""} onValueChange={setSchool}>
                <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <Select.Value placeholder="Sélectionner une école" />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                    <Select.Viewport className="p-1">
                      {schools.map((school) => (
                        <Select.Item
                          key={school.id}
                          value={school.id}
                          className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        >
                          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                            <Select.ItemIndicator>
                              <Check className="h-4 w-4" />
                            </Select.ItemIndicator>
                          </span>
                          <Select.ItemText>{school.name}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Semestre</label>
              <Select.Root value={state.semester || ""} onValueChange={setSemester} disabled={!state.school || semesters.length === 0}>
                <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <Select.Value placeholder="Sélectionner un semestre" />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                    <Select.Viewport className="p-1">
                      {semesters.map((semester) => (
                        <Select.Item
                          key={semester.id}
                          value={semester.id}
                          className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        >
                          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                            <Select.ItemIndicator>
                              <Check className="h-4 w-4" />
                            </Select.ItemIndicator>
                          </span>
                          <Select.ItemText>{semester.name}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Classe</label>
              <Select.Root value={state.class || ""} onValueChange={setClass} disabled={!state.semester || classes.length === 0}>
                <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <Select.Value placeholder="Sélectionner une classe" />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                    <Select.Viewport className="p-1">
                      {classes.map((cls) => (
                        <Select.Item
                          key={cls.id}
                          value={cls.id}
                          className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        >
                          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                            <Select.ItemIndicator>
                              <Check className="h-4 w-4" />
                            </Select.ItemIndicator>
                          </span>
                          <Select.ItemText>{cls.name}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Sous-classe</label>
              <Select.Root value={state.subclass || ""} onValueChange={setSubclass} disabled={!state.class || subclasses.length === 0}>
                <Select.Trigger className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <Select.Value placeholder="Sélectionner une sous-classe" />
                  <Select.Icon>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
                    <Select.Viewport className="p-1">
                      {subclasses.map((subcls) => (
                        <Select.Item
                          key={subcls.id}
                          value={subcls.id}
                          className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        >
                          <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                            <Select.ItemIndicator>
                              <Check className="h-4 w-4" />
                            </Select.ItemIndicator>
                          </span>
                          <Select.ItemText>{subcls.name}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2 mb-4">
            <Button 
              variant="outline" 
              onClick={handleTodayClick}
            >
              Aujourd&apos;hui
            </Button>
            <Button 
              variant={currentWeek === 7 ? "default" : "outline"}
              onClick={() => handleWeekChange(7)}
            >
              Cette semaine
            </Button>
            <Button 
              variant={currentWeek === 14 ? "default" : "outline"}
              onClick={() => handleWeekChange(14)}
            >
              Semaine +1
            </Button>
            <Button 
              variant={currentWeek === 21 ? "default" : "outline"}
              onClick={() => handleWeekChange(21)}
            >
              Semaine +2
            </Button>
            <Button 
              variant={currentWeek === 28 ? "default" : "outline"}
              onClick={() => handleWeekChange(28)}
            >
              Semaine +3
            </Button>
          </div>
          {isLoading ? (
            <div className="h-[750px] flex items-center justify-center">
              <div className="space-y-4">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ) : (
            <div className="h-[750px]">
              <Calendar
                localizer={localizer}
                events={events.map(event => {
                  const start = new Date(event.start)
                  const end = new Date(event.end)
                  return {
                    ...event,
                    start: new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), start.getUTCHours(), start.getUTCMinutes()),
                    end: new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), end.getUTCHours(), end.getUTCMinutes())
                  }
                })}
                startAccessor="start"
                endAccessor="end"
                views={['week']}
                defaultView="week"
                view={currentView}
                onView={(newView: View) => setCurrentView(newView)}
                min={new Date(0, 0, 0, 8, 0, 0)}
                max={new Date(0, 0, 0, 20, 0, 0)}
                tooltipAccessor={null}
                messages={messages}
                culture="fr"
                eventPropGetter={eventStyleGetter}
                onSelectEvent={handleEventClick}
                components={{
                  event: EventComponent
                }}
                className="h-full [&_.rbc-time-content]:!overflow-y-visible [&_.rbc-time-content_.rbc-day-slot]:!min-h-[650px]"
                timeslots={1}
                step={60}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <EventDialog
        event={selectedEvent}
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
      />
    </div>
  )
} 