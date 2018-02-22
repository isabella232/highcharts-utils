const Config = require('../../config.json');
const FS = require('fs');
const Path = require('path');

const csvParser = new RegExp('(\\"[^\\"]*?\\"|[^\\,]*?)([\\r\\n]+|\\,)', 'g');
const targetFilePath  = Path.join('../..', Config['highchartsDir'], 'samples/data/world-mortality.json');
//const xlsUrl = 'http://www.who.int/entity/healthinfo/global_burden_disease/GHE2015_Deaths-2015-country.xls?ua=1';
const xlsExportedCsvFile = '/Users/highsoft/Downloads/GHE2015_Deaths-2015-country.csv';

module.exports = function () {
    return new Promise((resolve, reject) => FS.readFile(xlsExportedCsvFile, 'utf8',
        (error, csv) => {
            
            if (error)
            {
                reject(error);
                return;
            }

            let index = -1,
                json = [],
                match = null;

            csvParser.lastIndex = 0;

            while ((match = csvParser.exec(csv)) !== null) {
                ++index;
                while (!json[index]) {
                    json.push([]);
                }
                if (match[1][0] === '"') {
                    json[index].push(match[1].substr(1, match[1].length - 2));
                } else {
                    json[index].push(match[1]);
                }
                if (match[2] !== ',') {
                    index = -1;
                }
            }

            let finalDataSet = null,
                finalJson = {};

            let continentMapping = loadContinentMapping(),
                dataContinent = null,
                dataCountry = null,
                dataSet = null;
            
            for (let index = 0, indexEnd = json.length; index < indexEnd; ++index) {

                dataSet = json[index];
                dataCountry = dataSet[0];
                dataContinent = continentMapping[dataCountry.toLowerCase()];

                if (!dataContinent) {
                    switch (dataCountry.toLowerCase())
                    {
                        default:
                            continue;
                        case 'cape verde':
                        case 'sao tome and principe':
                        case 'seychelles':
                            dataContinent = 'Africa';
                            break;
                        case 'antigua and barbuda':
                        case 'grenada':
                        case 'saint lucia':
                        case 'saint vincent and the grenadines':
                            dataContinent = 'Americas';
                            break;
                        case 'libyan arab jamahiriya':
                            dataContinent = 'Eastern Mediterranean';
                            break;
                        case 'kiribati':
                        case 'micronesia (federated states of)':
                        case 'samoa':
                        case 'tonga':
                        case 'vanuatu':
                            dataContinent = 'Western Pacific';
                            break;
                    }
                }

                finalDataSet = {
                    'Communicable & other Group I': parseFloat(dataSet[2]),
                    'Injuries': parseFloat(dataSet[4]),
                    'Noncommunicable diseases': parseFloat(dataSet[3]),
                };

                if (!finalJson[dataContinent]) {
                    finalJson[dataContinent] = {};
                }

                finalJson[dataContinent][dataCountry] = finalDataSet;
            }

            FS.appendFile(
                Path.join(Config['highchartsDir'], 'samples/data/world-mortality.json'),
                JSON.stringify(finalJson, undefined, '\t'),
                { encoding: 'utf8', flag: 'w' },
                (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(true);
                    }
                }
            );
        }
    ))
};

const loadContinentMapping = function () {
    let mappingDictionary = {};
    let oldJson = require(targetFilePath);

    Object
        .keys(oldJson)
        .forEach(continent => {
            Object
            .keys(oldJson[continent])
            .forEach(country => {
                switch (country)
                {
                    case 'Czech Republic':
                        country = 'Czechia';
                        break;
                    case 'United Kingdom of Great Britain and Northern Ireland':
                        country = 'United Kingdom';
                        break;
                }
                mappingDictionary[country.toLowerCase()] = continent;
            })
        });
    
    return mappingDictionary;
}