const Jasmine = require('jasmine');
const JasmineReporters = require('jasmine-reporters');
const path = require('path');

const jasmine = new Jasmine();
jasmine.loadConfigFile('spec/support/jasmine.json');

const junitReporter = new JasmineReporters.JUnitXmlReporter({
    savePath: path.join(__dirname, 'test-results'),
    consolidateAll: true
});

jasmine.addReporter(junitReporter);
jasmine.execute().then(r => console.log(r));