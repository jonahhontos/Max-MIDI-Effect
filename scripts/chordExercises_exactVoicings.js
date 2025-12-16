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

outlets = 7;


function getVoicing(...args) {
    let input = arrayfromargs(args);
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

function generateExerciseList(...args) {
    let types = arrayfromargs(args);
    let count = 0;
    let everyExercise = [];

    outlet(4, ['clear']);

    types.forEach((type) => {
        let chords = allVoicings[type];
        for (let chord in chords) {
            let displayName = chords[chord].displayName;
            for (let lh=0; lh < chords[chord].left.length; lh++) {
                for (let rh=0; rh < chords[chord].right.length; rh++) {
                    for (let root=0; root < 12; root++) {
                        everyExercise.push([displayName, type, chords[chord].id, root, lh, rh]);
                    }
                }
            }
        }
    });

    let shuffledExercises = shuffleArray(everyExercise);
    shuffledExercises.forEach( (exercise) => {
        outlet(4, [count, ...exercise]);
        count++;
    });
}