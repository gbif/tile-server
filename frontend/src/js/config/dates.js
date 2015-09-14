module.exports = {
    start: 0,
    end: 12,
    undated: {
        active: true,
        text: 'No date',
        abbr: 'NO_YEAR',
        filterAbbr: undefined
    },
    options: [
        {
            active: false,
            text: 'Pre 1900',
            abbr: 'PRE_1900',
            filterAbbr: {start: '*', end: 1900}
        },
        {
            active: false,
            text: '1900s',
            abbr: '1900_1910',
            filterAbbr: {start: 1900, end: 1910}
        },
        {
            active: false,
            text: '1910s',
            abbr: '1910_1920',
            filterAbbr: {start: 1910, end: 1920}
        },
        {
            active: false,
            text: '1920s',
            abbr: '1920_1930',
            filterAbbr: {start: 1920, end: 1930}
        },
        {
            active: false,
            text: '1930s',
            abbr: '1930_1940',
            filterAbbr: {start: 1930, end: 1940}
        },
        {
            active: false,
            text: '1940s',
            abbr: '1940_1950',
            filterAbbr: {start: 1940, end: 1950}
        },
        {
            active: false,
            text: '1950s',
            abbr: '1950_1960',
            filterAbbr: {start: 1950, end: 1960}
        },
        {
            active: false,
            text: '1960s',
            abbr: '1960_1970',
            filterAbbr: {start: 1960, end: 1970}
        },
        {
            active: false,
            text: '1970s',
            abbr: '1970_1980',
            filterAbbr: {start: 1970, end: 1980}
        },
        {
            active: false,
            text: '1980s',
            abbr: '1980_1990',
            filterAbbr: {start: 1980, end: 1990}
        },
        {
            active: false,
            text: '1990s',
            abbr: '1990_2000',
            filterAbbr: {start: 1990, end: 2000}
        },
        {
            active: false,
            text: '2000s',
            abbr: '2000_2010',
            filterAbbr: {start: 2000, end: 2010}
        },
        {
            active: false,
            text: '2010s',
            abbr: '2010_2020',
            filterAbbr: {start: 2010, end: 2020}
        }
    ]
};
