// import modules
const fs = require('fs');
const os = require('os');
const path = require('path');
const child_process = require('child_process');

// set some other constants
const spawn = child_process.spawn;
const processArgs = process.argv;
const platform = os.platform();
const cwd = process.cwd();
const cfr = path.join(cwd, 'deps', 'cfr-0.150.jar');
const version = processArgs[2];

// strings that i dont wanna type later and i might need
const yarnGithub = 'https://github.com/fabricmc/yarn';
const gradleCommand = (os.platform == 'win32') ? '.\\gradlew.bat' : './gradlew';
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcCodeViewer-'));

// the actual stuff
let gitProcess = spawn('git',['clone', yarnGithub], {cwd: tempDir});
console.info("Cloning github repo...")
// console.info(cwd);

function cleanUp() {
    fs.rmdirSync(tempDir, {recursive: true});
}

gitProcess.on('exit',(code, signal) => {
    // console.log(code);
    if(code != 0){
        console.error("GIT PROCESS EXITED WITH NON-ZERO VALUE");
        cleanUp();
        process.exit(69);
    }
    console.info("Yarn repo cloned!")

    let branchProcess = spawn('git', ['checkout', version], {cwd:path.join(tempDir,'yarn')})

    branchProcess.on('exit', (code, signal) => {
        if(code != 0){
            console.error("GIT CHECKOUT PROCESS EXITED WITH NON-ZERO VALUE");
            cleanUp();
            process.exit(69);
        }

        let gradleProcess = spawn(gradleCommand, ['mapNamedJar'], {cwd:path.join(tempDir,'yarn'), stdio: [process.stdin, process.stdout, process.stderr]});
        console.info("running gradle mapNamedJar task...");

        gradleProcess.on('exit', (code, signal) => {
            if(code != 0) {
                console.error("GRADLE PROCESS EXITED WITH NON-ZERO VALUE");
                cleanUp();
                process.exit(420);
            }
            console.info("Gradle task completed!");
            fs.mkdirSync(path.join(cwd,'MCSource'))

            let decompileProcess = spawn('java', ['-jar', cfr, path.join(tempDir, 'yarn', version + '-named.jar'), '--outputdir',  path.join(cwd,'MCSource')], {stdio: [process.stdin, process.stdout, process.stderr]});

            decompileProcess.on('exit', (code,signal) => { 
                cleanUp();
            });

        });

    });
});

