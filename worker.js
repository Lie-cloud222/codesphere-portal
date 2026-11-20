// the Web Worker (runs in the background)
//
// A worker has its own thread, so a long calculation here cannot
// freeze the page. It cannot touch the page (no document, no window).
// It can only talk to the main script with messages.

// listen for a message from the main script. The message
// carries the list of employee records.
self.addEventListener("message", function (event) {
    const records = event.data.records;
    const startTime = Date.now();

    const countByDepartment = {};   // department name -> number of employees
    const hoursByDepartment = {};   // department name -> total training hours
    let totalHours = 0;
    let highestHours = -1;
    let highestRecord = null;

    // one pass over every record.
    for (let i = 0; i < records.length; i++) {
        const record = records[i];

        // employees per department
        countByDepartment[record.department] = (countByDepartment[record.department] || 0) + 1;
        hoursByDepartment[record.department] = (hoursByDepartment[record.department] || 0) + record.trainingHours;

        // running total for the average trainingHours
        totalHours += record.trainingHours;

        // the highest trainingHours
        if (record.trainingHours > highestHours) {
            highestHours = record.trainingHours;
            highestRecord = record;
        }
    }

    // average trainingHours for each department
    const averageByDepartment = {};
    for (const department in countByDepartment) {
        averageByDepartment[department] = hoursByDepartment[department] / countByDepartment[department];
    }

    // send the results back to the main script.
    self.postMessage({
        total: records.length,
        countByDepartment: countByDepartment,
        averageByDepartment: averageByDepartment,
        averageHours: records.length > 0 ? totalHours / records.length : 0,
        highestHours: highestHours,
        highestName: highestRecord ? highestRecord.name : "",
        milliseconds: Date.now() - startTime
    });
});