const fs = require('fs');
const [inFilename, outFilename, compilationLevel] = process.argv.slice(2, 5);

if (!inFilename || !outFilename) {
	console.log("Usage: node googleClosureCompiler <inFilename> <outFilename>");
	process.exit(1);
}

if (!fs.existsSync(inFilename)) {
	console.log("File not found: " + inFilename);
	process.exit(2);
}

const ClosureCompiler = require('google-closure-compiler').jsCompiler;

if (!ClosureCompiler) {
	console.log('Please run npm install google-closure-compiler');
	process.exit(3);
}
 
console.log(ClosureCompiler.CONTRIB_PATH); // absolute path to the contrib folder which contains externs
 
const closureCompiler = new ClosureCompiler({
	compilation_level: compilationLevel || 'ADVANCED'
});
 
const compilerProcess = closureCompiler.run([{
	path: outFilename,
	src: fs.readFileSync(inFilename).toString(),
	sourceMap: null // optional input source map
}], (exitCode, stdOut, stdErr) => {
	console.log('Compilation complete.');
	//compilation complete
});