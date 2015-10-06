module.exports = {
    defaultOptions: ['sp', 'obs', 'oth', 'fossil', 'living'],
    all: ['sp', 'obs', 'oth', 'fossil', 'living'],
    options: {
        sp: {
            text: 'Preserved specimen',
            abbr: 'SP',
            filterAbbr: ['PRESERVED_SPECIMEN'],
            dated: true
        },
        obs: {
            text: 'Observation',
            abbr: 'OBS',
            filterAbbr: ['OBSERVATION', 'HUMAN_OBSERVATION', 'MACHINE_OBSERVATION'],
            dated: true
        },
        oth: {
            text: 'Other',
            abbr: 'OTH',
            filterAbbr: ['UNKNOWN', 'MATERIAL_SAMPLE', 'LITERATURE'],
            dated: true
        },
        fossil: {
            text: 'Fossil',
            comment: 'No date',
            abbr: 'FOSSIL',
            filterAbbr: ['FOSSIL_SPECIMEN'],
            dated: false
        },
        living: {
            text: 'Living specimen',
            comment: 'No date',
            abbr: 'LIVING',
            filterAbbr: ['LIVING_SPECIMEN'],
            dated: false
        }
    }
};
