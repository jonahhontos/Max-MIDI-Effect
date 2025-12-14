var notesToWrite = [];
var notesOn = [];
var ticksPerStep = 480;
var stepLengthInMs;
var totalSteps = 0;
var currentBpm = 120;
var meterDivision = 4;

outlets = 2;

function getMsFromTicks(ticks) {
    let msPerTick = stepLengthInMs / ticksPerStep;
    // post(`msPerTick: ${msPerTick}, ticks: ${ticks}, stepLengthInMs: ${stepLengthInMs}, ticksPerStep: ${ticksPerStep}`);
    return ticks * msPerTick;
}
getMsFromTicks.local = 1;

function tempo(bpm) {
    currentBpm = bpm;
    setMetricValues();
}

function length(steps) {
    totalSteps = steps;
    post( "Total steps set to: " + totalSteps + "\n" );
}

function meter(division) {
    meterDivision = division / 4;
    setMetricValues();
}

function setMetricValues() {
    stepLengthInMs = (60000 / currentBpm) / meterDivision;
    outlet(1, stepLengthInMs); // output step length in ms to outlet 1
    // post( "Step length in ms: " + stepLengthInMs + "\n" );
    ticksPerStep = 480 / meterDivision;
    // post( "Ticks per step set to: " + ticksPerStep + "\n" );
}
setMetricValues.local = 1;

function parsePosition(position) {
    // post( "Parsing position: " + position + "\n" );
    let result;
    if (position > ticksPerStep / 2) { // note is 'early'
        result = getMsFromTicks(position - (ticksPerStep / 2));
    } else { // note is 'late'
        result = getMsFromTicks(position + (ticksPerStep / 2));
    }
    // post( "Parsed position: " + result + "\n" );
    return result;
}
parsePosition.local = 1;


function note(...args) {
    // this should be recieving '[note value], [velocity], [position in ticks], [step index]'
    // if the velocity is > 0, add the note to notesOn
    let input = arrayfromargs(args);
    let noteValue = input[0];
    let velocity = input[1];
    let position = input[2];
    position = parsePosition(position);
    let stepIndex = input[3];
    // post( `Received note: value=${noteValue}, velocity=${velocity}, position=${position}, stepIndex=${stepIndex}\n` );

    if (velocity > 0) {
        notesOn.push({ noteValue, velocity, position, stepIndex });
    }

    if (velocity === 0) {
        let noteIndex = notesOn.findIndex((note) => note.noteValue === noteValue);
        let noteStart = notesOn[noteIndex];
        let noteToWrite = {};
        if (noteStart) {
            noteToWrite.startStep = noteStart.stepIndex;
            noteToWrite.startPosition = noteStart.position;
            noteToWrite.velocity = noteStart.velocity;
            noteToWrite.duration = getMsFromTicks(ticksPerStep - noteStart.position) 
                                 + getMsFromTicks((stepIndex - noteStart.stepIndex) * ticksPerStep)
                                 + getMsFromTicks(position);
            notesToWrite.push(noteToWrite);
            // post( `Writing note: startStep=${noteToWrite.startStep}, startPosition=${noteToWrite.startPosition}, velocity=${noteToWrite.velocity}, duration=${noteToWrite.duration}\n` );
            notesOn.splice(noteIndex, 1); // remove the note from notesOn
        }
    }
}

function terminateNotes() {
    // post("terminating\n");
    for (let note of notesOn) {
        let noteToWrite = {};
        noteToWrite.startStep = note.stepIndex;
        noteToWrite.startPosition = note.position;
        noteToWrite.velocity = note.velocity;
        noteToWrite.duration = getMsFromTicks(ticksPerStep - note.position) 
                             + getMsFromTicks((totalSteps - note.stepIndex - 1) * ticksPerStep);
        notesToWrite.push(noteToWrite);
    }
}

function writeSequence() {
    // post("writing sequence\n");
    let sequence = [];
    // post(`totalSteps: ${totalSteps}\n`);
    for (let i = 0; i < totalSteps; i++) {
        // post(`index ${i}\n`);
        let notesThisStep = notesToWrite.filter(note => note.startStep === i);
        // post(`notesThisStep length: ${notesThisStep.length}\n`);
        if (notesThisStep.length > 0) {
            let step = [i];
            for (let note of notesThisStep) {
                // stepString += `${note.startPosition} ${note.velocity} ${note.duration} `;
                step = [...step, note.startPosition,note.velocity, note.duration];
            }
            // stepString += ';';
            // post(`stepString: ${stepString}\n`);
            sequence.push(step);
        }
    }
    for (let step of sequence) { 
        outlet(0, step);
    }
    // clear notesToWrite and notesOn for next sequence
    notesToWrite = [];
    notesOn = [];
}