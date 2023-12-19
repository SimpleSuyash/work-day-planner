
//for date ordinal, advancedFormat plugin is required
dayjs.extend(window.dayjs_plugin_advancedFormat);
$('#currentDay').text(dayjs().format('dddd, MMMM Do'));
const currentHour = dayjs().hour();
//getting the container element
const containerEl = $('#container');
const saveMessageEl = $('#save-result');


//outputs the string to be used as a class name 
//which will style the element with correct color
function colorCode(hour) {
  // alert(`current hour ${currentHour}, this hour ${hour}`);
  if (hour < currentHour) {
    return 'past';
  } else if (hour == currentHour) {
    return 'present';
  } else {
    return 'future';
  }
}

//outputs the disabled string to be used as an attribute
function addAttrDisabled(hour) {
  if (hour < currentHour) {
    return 'disabled';
  } else {
    return '';
  }
}

//outputs the readonly string to be used as an attribute
function addAttrReadonly(hour) {
  if (hour < currentHour) {
    return 'readonly';
  } else {
    return '';
  }
}

function addClassUnHover(hour) {
  if (hour < currentHour) {
    return 'unHover';
  } else {
    return '';
  }
}

//disabling the enter in the schedule textarea
//since only one event can be saved for any given hour
function handleEnter(theEvent) {
  if (theEvent.key === 'Enter') {
    theEvent.preventDefault();
    return false;
  }
};

//office hour = {hour, hourText}
//creating an array of obj with length 9
//[{hour1, hour1Text}, {hour2, hour2Text},{hour3, hour3Text}, ...]
const officeHours = Array.from(new Array(9)).map((item, index) => {
  //dayjs().hour(index + 6) equals to  Mon, 18 Dec 2023 03:02:10 GMT
  //office hours are 9AM to 5PM
  const hour = dayjs().hour(index + 9).format('H');//like 9, 14
  const hourText = dayjs().hour(index + 9).format('hA');// like 9AM, 2PM
  return { hour, hourText };
});

//for every office hours, creating a row of elements
officeHours.forEach((hourObj) => {
  //schedule row
  const scheduleBlockEl = $(`<div class ='row time-block ${colorCode(hourObj.hour)}' id = '${hourObj.hourText}'></div>`);
  // time column
  const timeColumnEl = $(`<div class = 'col-2 col-md-1 hour text-center py-3'>${hourObj.hourText}</div>`);
  //task column
  const taskColumnEl = $(`<textarea class ='col-8 col-md-10 description' rows = '3' data-hour ='${hourObj.hourText}' ${addAttrReadonly(hourObj.hour)} name = 'schedule'>${getSchedule()}</textarea>`);//hourObj
  //save column
  const saveEl = $(`<button class = 'btn saveBtn col-2 col-md-1 ${addClassUnHover(hourObj.hour)}' aria-label = 'save' ${addAttrDisabled(hourObj.hour)}><i class ='fas fa-save' aria-hidden='true'></i></button>`);

  //appending the elements to the container
  scheduleBlockEl.append(timeColumnEl, taskColumnEl, saveEl);
  containerEl.append(scheduleBlockEl);


  // Takes an array of schedules and saves them in localStorage.
  //schedule = {time, task}
  function saveSchedulesToStorage(schedules, toSaveOrRemove = 'save') {
    localStorage.setItem('schedules', JSON.stringify(schedules));

    //scrolls to the top of the page, so that save successful message is visible
    $(window).scrollTop(0);
    if (toSaveOrRemove == 'save') {
      // displaying the save successful message on top of the time blocks
      saveMessageEl.html('The schedule is saved to the <span>localstorage </span><i class="fa-solid fa-check fa-beat fa-xl"></i>');
    } else {
      // displaying the delete successful message on top of the time blocks
      saveMessageEl.html('The schedule is removed from the <span>localstorage </span><i class="fa-solid fa-check fa-beat fa-xl"></i>');
    }

    setTimeout(() => saveMessageEl.empty(), 3000);
  }
  // Reads schedules from local storage and returns array of schedule objects.
  // Returns an empty array ([]) if there aren't any schedules.
  function readSchedulesFromStorage() {
    let schedules = localStorage.getItem('schedules');
    if (schedules) {
      //if schedules array is not null
      schedules = JSON.parse(localStorage.getItem("schedules"));
    } else {
      schedules = [];
    }
    return schedules;
  }

  function getSchedule() {
    let event = "";;
    const schedules = readSchedulesFromStorage();
    //going thru each items in the given schedules array
    schedules.forEach((schedule) => {
      //alert(`${hourObj.hourText}, ${schedule.time}`) ;                                                             
      if (hourObj.hourText == schedule.time) {
        event = schedule.task;
      }
    });
    return event;
  }
  //defining the click event on save button
  function handleSave() {
    let schedules = readSchedulesFromStorage();
    const task = taskColumnEl.val().trim();
    const time = taskColumnEl.attr('data-hour');
    //to track if for any given hour, the schedule already exist in the storage
    let scheduleExistAlready = false;
    if (task) {//when user typed something as a schedule
      //for all the schedules in the storage
      //if time in the storage matches to the schedule element time
      //change the schedule in the storage with that of the schedule element
      schedules.forEach((schedule) => {
        if (schedule.time == time) {
          //when a schedule already exist for the hour
          // just update the new schedule
          schedule.task = task;
          scheduleExistAlready = true;
        }
      });
      if (!scheduleExistAlready) {
        //if no schedules found in the storage for the given hours
        //add the schedule
        schedules.push({ time, task });
      }
      //save all the schedules to storage
      saveSchedulesToStorage(schedules);
      //when the schedule element's value is empty 
      //or when there is no schedule but user pressed save button
    } else { //when user typed empty string as schedule
      let theExistingSchedule;
      //this serves as the delete function
      //if there was a task scheduled before 
      //and now user is replacing with empty string
      schedules.forEach((schedule) => {
        if (schedule.time == time) {
          //finding the existing schedule
          theExistingSchedule = schedule;
          scheduleExistAlready = true;
        }
      });
      if (scheduleExistAlready) {//when user wants to replace existing schedule with empty string
        //deleting the existing schedule and creating 
        //a new schedules without the previously stored schedule
        schedules = schedules.filter(schedule => schedule !== theExistingSchedule);
        //save all the schedules to storage
        saveSchedulesToStorage(schedules, 'remove');
      } else {//when user typed in empty string in an previously empty schedule
        //schedule element textarea may have whitespaces, 
        //so making it empty, so placehoder can be displayed as an error message
        taskColumnEl.val('');
        taskColumnEl.attr('placeholder', '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Your task is empty. The Schedule could not be saved. ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
        setTimeout(() => taskColumnEl.attr('placeholder', ''), 3000);
      }
    }
    taskColumnEl.val(getSchedule());
  };

  //attaching the events
  taskColumnEl.on('keydown', handleEnter);
  saveEl.on('click', handleSave);
});



