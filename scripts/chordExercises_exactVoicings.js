// load the chord voicings
function loadFile(filename) {
    let file = new File(`${filename}.json`, 'read');
    let data = JSON.parse(file.readstring(10000000));
    file.close();
    return data;
}
loadFile.local = 1;

let allVoicings = { 
    threeAndThree: loadFile('threeAndThree'),
    twoAndFour: loadFile('twoAndFour')
};

let exerciseList = [];
let loadedExerciseList = loadFile('exerciseList');
if (loadedExerciseList && loadedExerciseList.isArray()) { 
    exerciseList = loadedExerciseList; 
}
outlet(7, [exerciseList.length]);

let missedExercises = [];
let loadedMissedExercises = loadFile('missedExercises');
if (loadedMissedExercises && loadedMissedExercises.isArray()) { 
    missedExercises = loadedMissedExercises; 
}
outlet(8, [missedExercises.length]);

let roots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
let lhInversions = [];
let rhInversions = [];

let missedMode = false;
let missedQueue = [];

outlets = 10;

function setRoots(...args) {;
    if (arrayfromargs(args).length > 0) {
        roots = arrayfromargs(args);
    } else {
        roots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    }
}

function setLHInversions(...args) {
    if (arrayfromargs(args).length > 0) {
        lhInversions = arrayfromargs(args);
    } else {
        lhInversions = [];
    }
}

function setRHInversions(...args) {
    if (arrayfromargs(args).length > 0) {
        rhInversions = arrayfromargs(args);
    } else {
        rhInversions = [];
    }
}

function getVoicing(...args) {
    let input = args.isArray() ? args : arrayfromargs(args);
    let type = input[0];
    let chord = input[1]
    let root = input[2];
    let lhInversion = input[3];
    let rhInversion = input[4];

    outlet(6, [allVoicings[type][chord].rightShapeName]);
    outlet(5, [allVoicings[type][chord].leftShapeName]);

    let lhVoicing = allVoicings[type][chord]['left'][lhInversion];
    let rhVoicing = allVoicings[type][chord]['right'][rhInversion];

    outlet(3, rhVoicing.length); // number of notes in right hand voicing
    let rhOutput = [];
    rhVoicing.forEach( (interval) => {
        let noteValue = (parseInt(interval) + root) % 12;
        rhOutput.push(noteValue);
    });
    outlet(2, rhOutput);

    outlet(1, lhVoicing.length); // number of notes in left hand voicing
    let lhOutput = [];
    lhVoicing.forEach( (interval) => {
        let noteValue = (parseInt(interval) + root) % 12;
        lhOutput.push(noteValue);
    });
    outlet(0, lhOutput);
}

function shuffleArray(array) {
  // Create a shallow copy to avoid modifying the original array if desired
  const shuffledArray = [...array]; 

  for (let i = shuffledArray.length - 1; i > 0; i--) {
    // Generate a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements at indices i and j
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
  }

  return shuffledArray;
}
shuffleArray.local = 1;

function getAllInversions(chord) {
    let inversions = [];
    for (let i = 0; i < chord.length; i++) {
        inversions.push(i);
    }
    return inversions;
}
getAllInversions.local = 1;

function generateExerciseList(...args) {
    let types = arrayfromargs(args);
    exerciseList = [];

    types.forEach((type) => {
        let chords = allVoicings[type];
        for (let chord in chords) {
            let lhToUse = lhInversions.length === 0 ? getAllInversions(chords[chord].left) : lhInversions;
            let rhToUse = rhInversions.length === 0 ? getAllInversions(chords[chord].right) : rhInversions;

            let displayName = chords[chord].displayName;
            for (let lh of lhToUse) {
                for (let rh of rhToUse) {
                    for (let root of roots) {
                        if (chords[chord].left[lh] === undefined || chords[chord].right[rh] === undefined) {
                            continue;
                        }
                        exerciseList.push([displayName, type, chords[chord].id, root, lh, rh]);
                    }
                }
            }
        }
    });

    exerciseList = shuffleArray(exerciseList);
    outlet(7, [ exerciseList.length ]);
}

function saveLists() {
    let file = new File('exerciseList.json', 'write');
    file.writestring(JSON.stringify(exerciseList));
    file.close();

    file = new File('missedExercises.json', 'write');
    file.writestring(JSON.stringify(missedExercises));
    file.close();
}

function nextExercise() {
    if (!missedMode && exerciseList.length > 0) {
        let nextExercise = exerciseList.splice(0, 1)[0];
        outlet(7, exerciseList.length);
        outlet(4, nextExercise);
        getVoicing(nextExercise);
    } else if (missedMode && missedQueue.length > 0) {
        let nextExercise = missedQueue.splice(0, 1)[0];
        if (missedQueue.length === 0) {
            missedMode = false;
            outlet(9, 0);
        }
        outlet(8, missedQueue.length);
        outlet(4, nextExercise);
        getVoicing(nextExercise);
    }
}

function missedExercise(...args) {
    let missedExercise = arrayfromargs(args);
    missedExercises.push(missedExercise);
    outlet(8, [missedExercises.length]);
}

function toggleMissedMode() {
    missedMode = !missedMode;

    if (missedMode) {
        missedQueue = [...missedExercises];
    }
}

function clearMissedExercises() {
    missedExercises = [];
    outlet(8, [missedExercises.length]);
}