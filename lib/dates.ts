

export function createDateTime(hours : string, minutes : string, meridiem : string) : Date {
    // Create a new Date object representing "today"
    const date = new Date();
  
    // Convert the hours to 24-hour format based on AM/PM
    let convertedHours = parseInt(hours, 10); // Convert hours to integer
    if (meridiem === 'PM' && convertedHours !== 12) {
      convertedHours += 12; // Convert PM hours, except for 12 PM
    } else if (meridiem === 'AM' && convertedHours === 12) {
      convertedHours = 0; // Convert 12 AM to 0 (midnight)
    }
  
    // Set the hours and minutes on the Date object
    date.setHours(convertedHours);
    date.setMinutes(parseInt(minutes,10));
    date.setSeconds(0);
    date.setMilliseconds(0);
  
  
    return date; // Return the modified Date object
  }
  