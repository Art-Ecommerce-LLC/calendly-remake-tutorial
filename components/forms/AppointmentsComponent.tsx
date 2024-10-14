"use client"

import { useState,useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { DateRange } from "react-day-picker"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@nextui-org/react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import GoogleConnectButton from "@/components/ui/GoogleConnectButton"
import { addDays } from "date-fns"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePickerWithRange } from "../ui/DatePickerWithRange"
import { createDateTime } from "@/lib/dates"
import { useToast } from "@/hooks/use-toast"
import {Spinner} from "@nextui-org/spinner";

type FormValues = z.infer<typeof formSchema>;
type TimeKeys = keyof FormValues['startTime']; // The keys of startTime and endTime ("hours", "minutes", "meridiem")


const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  startTime: z.object({
    hours: z.string().min(1, 'Start Hours is required'),
    minutes: z.string().min(1, 'Start Minutes is required'),
    meridiem: z.string().min(1, 'Start Abbreviation is required'),
  }),
  endTime: z.object({
    hours: z.string().min(1, 'End Hours is required'),
    minutes: z.string().min(1, 'End Minutes is required'),
    meridiem: z.string().min(1, 'End Abbreviation is required'),
  }),
  appointmentLength: z.string().min(1, 'Appointment Length is required'),
  dateRange: z.object({
    from: z.date(), // Make 'from' optional for better validation handling
    to: z.date().optional(),   // Make 'to' optional for better validation handling
  }),
}).superRefine(({ startTime, endTime, appointmentLength, dateRange }, ctx) => {


  if (!dateRange.to) {
    ctx.addIssue({
      path: ["dateRange"],
      message: "End date is required",
      code: z.ZodIssueCode.custom,
    });
  }

  // Convert start and end time to Date objects
  const startDate = createDateTime(startTime.hours, startTime.minutes, startTime.meridiem);
  const endDate = createDateTime(endTime.hours, endTime.minutes, endTime.meridiem);

  // Validate that start time is before end time
  if (startDate >= endDate) {
    // Add error for both startTime and endTime
    ctx.addIssue({
      path: ["startTime"],
      message: "Start time must be before end time",
      code: z.ZodIssueCode.custom,
    });
    ctx.addIssue({
      path: ["endTime"],
      message: "End time must be after start time",
      code: z.ZodIssueCode.custom,
    });
  }

  // Validate that minutes match when the appointment length is 1 hour
  const startMinutes = startDate.getMinutes();
  const endMinutes = endDate.getMinutes();

  if (appointmentLength === "60" && startMinutes !== endMinutes) {
    ctx.addIssue({
      path: ["startTime"],
      message: "Start and end minutes must be the same for 1-hour appointments",
      code: z.ZodIssueCode.custom,
    });
    ctx.addIssue({
      path: ["endTime"],
      message: "Start and end minutes must be the same for 1-hour appointments",
      code: z.ZodIssueCode.custom,
    });
  }
});

export function AppointmentsComponent() {

  const { toast } = useToast()

  const [startTime, setStartTime] = useState({
    hours: "9",
    minutes: "00",
    meridiem: "AM",
  })

  const [endTime, setEndTime] = useState({
    hours: "5",
    minutes: "00",
    meridiem: "PM",
  })

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(addDays(new Date(), 1).setHours(0, 0, 0, 0)),
    to:new Date(addDays(new Date(), 14).setHours(0, 0, 0, 0)),
  })

  const [isLoading, setLoading] = useState(false);

  const [isGoogleConnected, setLoggedIn] = useState(false);

      // Fetch route getGoogleAuth in /api/auth to see if the user is logged in on a useEffect
  useEffect(() => {
        async function checkIfLoggedIn() {
            const response = await fetch('/api/auth/getGoogleAuth');
            const data = await response.json();
            if (!data.error) {
                setLoggedIn(true);
            }
        }
        checkIfLoggedIn();
    }, []);

    console.log(isGoogleConnected);

  // Update startTime object and form value
  const handleStartTimeChange = (key : TimeKeys, value : string) => {
    const newStartTime = { ...startTime, [key]: value }
    setStartTime(newStartTime)
    form.setValue('startTime', newStartTime)
  }

  // Update endTime object and form value
  const handleEndTimeChange = (key : TimeKeys, value : string) => {
    const newEndTime = { ...endTime, [key]: value }
    setEndTime(newEndTime)
    form.setValue('endTime', newEndTime)
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "Art Ecommerce Development Meeting",
      description: "Meeting to discuss the development of a website",
      startTime: startTime,
      endTime: endTime,
      dateRange: date,
      appointmentLength: "30",
    },
  })

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {

    setLoading(true);

    const startTime = createDateTime(values.startTime.hours, values.startTime.minutes, values.startTime.meridiem);
    const endTime = createDateTime(values.endTime.hours, values.endTime.minutes, values.endTime.meridiem);

    // set the start date time
    const startDatetime = values.dateRange.from;
    // set the end date time
    const endDatetime = values.dateRange.to!;

    // set the hours and minutes on the start and end date time
    startDatetime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    endDatetime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

    

    const payload = {
      title: values.title,
      description: values.description,
      startDatetime ,
      endDatetime ,
      appointmentLength: values.appointmentLength,
    }

    try{  
      const response = await fetch("/api/calendar/postSchedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
      const responseData = await response.json()
      if (responseData.error) {
        throw new Error("Something went wrong")
      } 
      setLoading(false);
      toast({
        variant: "default",
        description: "Appointments scheduled successfully",
      })

    } catch (error) {
      setLoading(false);
      toast({
        variant: "destructive",
        description: "Something went wrong",
      })
    } 
    
  }

  return (
    <>
    {isGoogleConnected ? (
      <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter title here..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter description..." 
                    {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
            />
             <FormField
              control={form.control}
              name="appointmentLength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appointment Length</FormLabel>
                  <FormControl>
                  <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="30 Minutes" defaultValue={"30"}/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Appointment Duration</SelectLabel>
                        <SelectItem value={"30"}>30 Minutes</SelectItem>
                        <SelectItem value={"60"}>1 Hour</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Time Start</FormLabel>
                  <div className="flex flex-row space-x-2 items-center">
                    <FormControl>
                      <Select 
                      onValueChange={(value) => handleStartTimeChange("hours", value)}
                      defaultValue={field.value.hours}>
                        <SelectTrigger className="w-[4rem]">
                          <SelectValue placeholder="9" defaultValue={"9"}/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Hour</SelectLabel>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                            <SelectItem value="3">3</SelectItem>
                            <SelectItem value="4">4</SelectItem>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="6">6</SelectItem>
                            <SelectItem value="7">7</SelectItem>
                            <SelectItem value="8">8</SelectItem>
                            <SelectItem value="9">9</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="11">11</SelectItem>
                            <SelectItem value="12">12</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <span>:</span>
                    <FormControl>
                      <Select 
                      onValueChange={(value) => handleStartTimeChange("minutes", value)}
                      defaultValue={field.value.minutes}>
                        <SelectTrigger className="w-[4rem]">
                          <SelectValue placeholder={"00"} defaultValue={"00"}/>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Minutes</SelectLabel>
                            <SelectItem value="00">00</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <Select 
                      onValueChange={(value) => handleStartTimeChange("meridiem", value)}
                      defaultValue={field.value.meridiem} >
                      <SelectTrigger className="w-[4rem]">
                        <SelectValue defaultValue={"AM"} placeholder={"AM"}/>
                      </SelectTrigger>
                      <SelectContent >
                        <SelectGroup>
                          <SelectLabel>Hours</SelectLabel>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                      </Select>
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}/>
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem >
                  
                  <FormLabel>Daily Time End</FormLabel>
                  <div className="flex flex-row space-x-2 items-center">
                  <FormControl>
                  <Select 
                  onValueChange={(value) => handleEndTimeChange("hours", value)}
                  defaultValue={field.value.hours}>
                    <SelectTrigger className="w-[4rem]">
                      <SelectValue placeholder="12" defaultValue={"12"}/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Hour</SelectLabel>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                        <SelectItem value="7">7</SelectItem>
                        <SelectItem value="8">8</SelectItem>
                        <SelectItem value="9">9</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="11">11</SelectItem>
                        <SelectItem value="12">12</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  </FormControl>
                  <span>:</span>
                  <FormControl>
                  <Select 
                  onValueChange={(value) => handleEndTimeChange("minutes", value)}
                  defaultValue={field.value.minutes}>
                  <SelectTrigger className="w-[4rem]">
                    <SelectValue placeholder={"00"} defaultValue={"00"}/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Minutes</SelectLabel>
                      <SelectItem value="00">00</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                  </FormControl>
                  <FormControl>
                  <Select 
                  onValueChange={(value) => handleEndTimeChange("meridiem", value)}
                  defaultValue={field.value.meridiem}

                   >
                    <SelectTrigger className="w-[4rem]">
                      <SelectValue defaultValue={"PM"} placeholder={"PM"}/>
                    </SelectTrigger>
                    <SelectContent >
                      <SelectGroup>
                        <SelectLabel>Hours</SelectLabel>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  </FormControl>
                  </div>
                  <FormMessage /> 
                </FormItem>

              )}/>           
            <FormField
              control={form.control}
              name="dateRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Range</FormLabel>
                  <FormControl>
                  <DatePickerWithRange
                    selectedDateRange={field.value}
                    onDateChange={field.onChange} // Sync form state with date picker
                    date={date}
                    setDate={setDate}
                  />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> 
          {isLoading ? (  
            <Button 
            type="submit" 
            isDisabled 
            className="bg-success w-full">
              Submitting
              <Spinner size="sm" />
            </Button>
        ) : (
          <Button 
          type="submit" 
          className="bg-success w-full">
            Submit
          </Button>
        )}

      </form>
    </Form>
    ) : (
      <div>
        <GoogleConnectButton />
      </div>
    )}
    </>
    
  )
}

