import React, { useState } from 'react';

interface CalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
}

const ChevronLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);

const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);


const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelect }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  // Safely create a date from YYYY-MM-DD string to avoid timezone issues
  const initialDate = selectedDate ? new Date(selectedDate.replace(/-/g, '/')) : today;
  
  const [displayDate, setDisplayDate] = useState(initialDate);

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const changeMonth = (offset: number) => {
    setDisplayDate(new Date(year, month + offset, 1));
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(year, month, day);
    onSelect(newDate.toISOString().split('T')[0]);
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfMonth });

  const selectedDay = selectedDate ? new Date(selectedDate.replace(/-/g, '/')) : null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-medium-gray dark:border-gray-700 w-full max-w-xs">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronLeftIcon className="w-5 h-5 text-dark-gray dark:text-gray-200" />
        </button>
        <div className="font-bold text-lg text-dark-gray dark:text-gray-200">
          {displayDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronRightIcon className="w-5 h-5 text-dark-gray dark:text-gray-200" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 dark:text-gray-400 mb-2 font-semibold">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {paddingDays.map((_, index) => <div key={`pad-${index}`} />)}
        {days.map(day => {
          const currentDate = new Date(year, month, day);
          const isSelected = selectedDay && currentDate.getTime() === selectedDay.getTime();
          const isToday = currentDate.getTime() === today.getTime();
          
          let buttonClasses = "w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-200 text-dark-gray dark:text-gray-200";
          if (isSelected) {
            buttonClasses += " bg-classic-green text-white font-bold";
          } else if (isToday) {
            buttonClasses += " bg-blue-100 dark:bg-blue-900 text-classic-blue dark:text-blue-300 font-bold border border-classic-blue";
          } else {
            buttonClasses += " hover:bg-gray-200 dark:hover:bg-gray-700";
          }

          return (
            <div key={day} className="flex justify-center">
                <button onClick={() => handleDateSelect(day)} className={buttonClasses}>
                {day}
                </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;