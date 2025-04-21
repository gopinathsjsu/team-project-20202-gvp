"use client";



import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


// SearchState type
import { SearchState } from "@/context/RestaurantContext";

const DateSelector = ({  searchState, setSearchState }: { searchState: SearchState, setSearchState: (state: SearchState) => void }) => {
  // Handle date selection
  
  const handleDateSelect = (date: Date | undefined) => {
    console.log("Hello")
    if (!date) return;
    setSearchState({
      ...searchState,
      date: date 
    });
  };

  return (
    <div className="w-full sm:w-auto flex-shrink-0">
      <Popover>
        <PopoverTrigger asChild>
          <button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-700 px-4 py-2 rounded-md flex items-center justify-between border border-slate-700">
            <div className="flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2 text-stale-800" />
              <span>
                {searchState.date ? format(searchState.date, 'MMM dd') : 'Select date'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 ml-2" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 bg-slate-800 border border-slate-700 flex justify-center w-full">
          <Calendar
           mode="single"
            // onSelect={(date) => handleDateSelect(date)}
            selected={searchState.date}
            onSelect={handleDateSelect}
            initialFocus
            className="bg-slate-900 text-slate-100 m-0 "
          />
          
        </PopoverContent>
      </Popover>
    </div>
  );
};
export default DateSelector;